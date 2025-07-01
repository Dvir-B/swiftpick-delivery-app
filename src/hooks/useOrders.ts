import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, softDeleteOrder, updateOrderStatus, getHfdSettings, logOrderActivity } from "@/services/database";
import { createDelivery } from '@/services/delivery';
import { Order } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את ההזמנות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_number.includes(searchTerm) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [orders, searchTerm]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStartPicking = (orderId: string) => {
    navigate(`/picking/${orderId}`);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await softDeleteOrder(orderId);
      await logOrderActivity(orderId, 'order_deleted');
      await loadOrders();
      toast({
        title: "הזמנה נמחקה",
        description: "ההזמנה נמחקה בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההזמנה",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await logOrderActivity(orderId, 'status_updated', { newStatus });
      await loadOrders();
      toast({
        title: "סטטוס עודכן",
        description: "סטטוס ההזמנה עודכן בהצלחה",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "שגיאה", 
        description: "לא ניתן לעדכן את סטטוס ההזמנה",
        variant: "destructive",
      });
    }
  };

  const handleSendToShipping = async (order: Order) => {
    try {
      console.log('Sending order to delivery:', order);

      const result = await createDelivery(order);
      console.log('Delivery result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create delivery');
      }

      await updateOrderStatus(order.id!, "shipped");
      await logOrderActivity(order.id!, 'shipment_created', { hfdShipmentNumber: result.shipment?.hfd_shipment_number, trackingNumber: result.shipment?.tracking_number });
      await loadOrders();

      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: `משלוח מספר ${result.shipment?.hfd_shipment_number} נוצר בהצלחה`,
      });
    } catch (error) {
      console.error('Error sending order to shipping:', error);
      if (order.id) {
        await updateOrderStatus(order.id, 'error');
        await logOrderActivity(order.id, 'shipment_creation_failed', { error: error instanceof Error ? error.message : String(error) });
        await loadOrders();
      }
      toast({
        title: "שגיאה בשליחה למשלוח",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    }
  };

  const handleBulkSendToShipping = async () => {
    const allSelectedOrders = orders.filter(o => selectedOrders.includes(o.id!));
    const ordersToSend = allSelectedOrders.filter(o => o.status === 'pending' || o.status === 'processed');
    const skippedCount = allSelectedOrders.length - ordersToSend.length;

    if (ordersToSend.length === 0) {
      if (allSelectedOrders.length > 0) {
        toast({
            title: "אין הזמנות לשליחה",
            description: `כל ${allSelectedOrders.length} ההזמנות שנבחרו אינן בסטטוס המאפשר שליחה.`,
            variant: "default"
        });
      } else {
        toast({
            title: "לא נבחרו הזמנות",
            description: "יש לבחור הזמנות לשליחה.",
            variant: "destructive"
        });
      }
      setSelectedOrders([]);
      return;
    }

    toast({ description: `מתחיל שליחה של ${ordersToSend.length} הזמנות...` });

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const order of ordersToSend) {
      try {
        console.log(`Processing order ${order.order_number} for bulk send`);
        
        const result = await createDelivery(order);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create delivery');
        }
        
        await updateOrderStatus(order.id!, "shipped");
        await logOrderActivity(order.id!, 'shipment_created', { hfdShipmentNumber: result.shipment?.hfd_shipment_number, trackingNumber: result.shipment?.tracking_number, context: 'bulk_send' });
        console.log(`Order ${order.order_number} sent successfully. HFD shipment: ${result.shipment?.hfd_shipment_number}`);
        successCount++;
      } catch (error) {
        console.error(`Error processing order ${order.order_number}:`, error);
        errors.push(`הזמנה ${order.order_number}: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
        errorCount++;
        
        // Update order status to error
        try {
          await updateOrderStatus(order.id!, 'error');
          await logOrderActivity(order.id!, 'shipment_creation_failed', { error: error instanceof Error ? error.message : String(error), context: 'bulk_send' });
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }
      }
    }

    setIsLoading(false);
    await loadOrders();
    setSelectedOrders([]);

    // Show results
    let summaryMessage = `${successCount} הזמנות נשלחו בהצלחה.`;
    if (errorCount > 0) {
      summaryMessage += ` ${errorCount} נכשלו.`;
    }
    if (skippedCount > 0) {
      summaryMessage += ` ${skippedCount} הזמנות דולגו (בסטטוס לא מתאים).`;
    }

    toast({
      title: "שליחה למשלוח הושלמה",
      description: summaryMessage,
      variant: errorCount > 0 ? "destructive" : "default",
      duration: 9000
    });

    if (errorCount > 0) {
      toast({
        title: "שגיאות בשליחה",
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? ` ועוד ${errors.length - 3} שגיאות` : ''),
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "לא נבחרו הזמנות",
        description: "יש לבחור הזמנות למחיקה.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    for (const orderId of selectedOrders) {
      try {
        await softDeleteOrder(orderId);
        await logOrderActivity(orderId, 'order_deleted', { context: 'bulk_delete' });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Error deleting order:', error);
      }
    }
    setIsLoading(false);
    await loadOrders();
    setSelectedOrders([]);
    toast({
      title: "מחיקת הזמנות הושלמה",
      description: `${successCount} הזמנות נמחקו${errorCount > 0 ? `, ${errorCount} נכשלו` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    setSelectedOrders(prev => 
      isSelected
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };
  
  const handleSelectAllOrders = (isSelected: boolean) => {
    setSelectedOrders(isSelected ? filteredOrders.map(o => o.id!) : []);
  }

  return {
    loading,
    searchTerm,
    setSearchTerm,
    filteredOrders,
    selectedOrders,
    handleGoBack,
    handleStartPicking,
    handleViewOrder,
    handleDeleteOrder,
    handleUpdateStatus,
    handleSendToShipping,
    handleBulkSendToShipping,
    handleBulkDeleteOrders,
    handleSelectOrder,
    handleSelectAllOrders
  };
};

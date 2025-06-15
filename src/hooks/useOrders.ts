import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, softDeleteOrder, updateOrderStatus, getHfdSettings, logOrderActivity } from "@/services/database";
import { convertOrderToHfdShipment, createHfdShipment } from "@/utils/hfdIntegration";
import { Order } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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
      await logOrderActivity({ order_id: orderId, activity_type: 'order_deleted' });
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
      await logOrderActivity({ order_id: orderId, activity_type: 'status_updated', details: { newStatus } });
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
      const hfdSettings = await getHfdSettings();
      if (!hfdSettings) {
        toast({
          title: "שגיאה",
          description: "לא נמצאו הגדרות HFD. אנא הגדר תחילה את פרטי ההתחברות ל-HFD",
          variant: "destructive",
        });
        return;
      }

      console.log('Sending order to HFD:', order);
      console.log('Using HFD settings:', hfdSettings);

      const shipmentData = convertOrderToHfdShipment(order, hfdSettings);
      console.log('Converted shipment data:', shipmentData);

      const result = await createHfdShipment(shipmentData);
      console.log('HFD shipment result:', result);

      await updateOrderStatus(order.id!, "shipped");
      await logOrderActivity({ order_id: order.id!, activity_type: 'shipment_created', details: { hfdShipmentNumber: result.shipmentNumber } });
      await loadOrders();

      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: `משלוח מספר ${result.shipmentNumber} נוצר ב-HFD`,
      });
    } catch (error) {
      console.error('Error sending order to shipping:', error);
      if (order.id) {
        await updateOrderStatus(order.id, 'error');
        await logOrderActivity({
          order_id: order.id,
          activity_type: 'shipment_creation_failed',
          details: { error: error instanceof Error ? error.message : String(error) }
        });
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

    const hfdSettings = await getHfdSettings();
    if (!hfdSettings) {
      toast({
        title: "שגיאה",
        description: "לא נמצאו הגדרות HFD. אנא הגדר תחילה את פרטי ההתחברות ל-HFD",
        variant: "destructive",
      });
      return;
    }

    toast({ description: `מתחיל שליחה של ${ordersToSend.length} הזמנות...` });

    let successCount = 0;
    let errorCount = 0;

    for (const order of ordersToSend) {
      try {
        const shipmentData = convertOrderToHfdShipment(order, hfdSettings);
        const result = await createHfdShipment(shipmentData);
        await updateOrderStatus(order.id!, "shipped");
        await logOrderActivity({ order_id: order.id!, activity_type: 'shipment_created', details: { hfdShipmentNumber: result.shipmentNumber, context: 'bulk_send' } });
        console.log(`Order ${order.order_number} sent successfully. HFD shipment: ${result.shipmentNumber}`);
        successCount++;
      } catch (error: any) {
        console.error(`Error sending order ${order.order_number}:`, error);
        await updateOrderStatus(order.id!, 'error');
        await logOrderActivity({
            order_id: order.id!,
            activity_type: 'shipment_creation_failed',
            details: { error: error.message, context: 'bulk_send' }
        });
        errorCount++;
      }
    }

    await loadOrders();
    setSelectedOrders([]);

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
    handleSelectOrder,
    handleSelectAllOrders
  };
};

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Trash2, Send, ArrowLeft, RefreshCw, Undo2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, softDeleteOrder, updateOrderStatus, getHfdSettings, logOrderActivity } from "@/services/database";
import { convertOrderToHfdShipment, createHfdShipment } from "@/utils/hfdIntegration";
import { Order } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  pending: "bg-gray-200 text-gray-800",
  processed: "bg-yellow-200 text-yellow-800",
  shipped: "bg-blue-200 text-blue-800",
  delivered: "bg-green-200 text-green-800",
  error: "bg-red-200 text-red-800",
};

const statusText = {
  pending: "ממתינה",
  processed: "בטיפול", 
  shipped: "נשלחה",
  delivered: "נמסרה",
  error: "שגיאה",
};

export function OrdersTable() {
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

  const filteredOrders = orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_number.includes(searchTerm) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStartPicking = (orderId: string) => {
    navigate(`/picking/${orderId}`);
  };

  const handleViewOrder = (orderId: string) => {
    // Navigate to order details page when implemented
    console.log('View order:', orderId);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await softDeleteOrder(orderId);
      await logOrderActivity({ order_id: orderId, activity_type: 'order_deleted' });
      await loadOrders(); // Refresh the orders list
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
      await loadOrders(); // Refresh the orders list
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
      // Get HFD settings
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

      // Convert order to HFD shipment format
      const shipmentData = convertOrderToHfdShipment(order, hfdSettings);
      console.log('Converted shipment data:', shipmentData);

      // Create shipment in HFD
      const result = await createHfdShipment(shipmentData);
      console.log('HFD shipment result:', result);

      // Update order status to shipped
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
    const errorMessages: string[] = [];

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
        errorMessages.push(`הזמנה ${order.order_number}: ${error.message}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>טוען הזמנות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזור
            </Button>
            {selectedOrders.length > 0 && (
                <Button onClick={handleBulkSendToShipping}>
                  <Send className="w-4 h-4 mr-2" />
                  שלח למשלוח ({selectedOrders.length})
                </Button>
            )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            placeholder="חיפוש לפי שם לקוח, מספר הזמנה או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  id="select-all"
                  checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                  onCheckedChange={(checked) => {
                    setSelectedOrders(checked ? filteredOrders.map(o => o.id!) : []);
                  }}
                  aria-label="בחר הכל"
                />
              </TableHead>
              <TableHead className="text-right">מספר הזמנה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right hidden md:table-cell">אימייל</TableHead>
              <TableHead className="text-right hidden lg:table-cell">פלטפורמה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right hidden lg:table-cell">תאריך הזמנה</TableHead>
              <TableHead className="text-right hidden md:table-cell">סכום</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  לא נמצאו הזמנות
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} data-state={selectedOrders.includes(order.id!) ? "selected" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(order.id!)}
                      onCheckedChange={(checked) => {
                        setSelectedOrders(prev => 
                          checked
                            ? [...prev, order.id!]
                            : prev.filter(id => id !== order.id!)
                        );
                      }}
                      aria-label="בחר שורה"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name || 'לא זמין'}</TableCell>
                  <TableCell className="hidden md:table-cell">{order.customer_email || 'לא זמין'}</TableCell>
                  <TableCell className="capitalize hidden lg:table-cell">{order.platform}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {statusText[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString("he-IL") : 'לא זמין'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.total_amount ? `₪${order.total_amount}` : 'לא זמין'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {order.status === "pending" && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartPicking(order.id!)}
                          >
                            התחל ליקוט
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToShipping(order)}
                            className="bg-green-50 hover:bg-green-100"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            שלח למשלוח
                          </Button>
                        </>
                      )}
                      {order.status === "processed" && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id!, "shipped")}
                          >
                            סמן כנשלח
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToShipping(order)}
                            className="bg-green-50 hover:bg-green-100"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            שלח למשלוח
                          </Button>
                        </>
                      )}
                      {order.status === 'error' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToShipping(order)}
                            className="text-orange-600 hover:text-orange-800 border-orange-200 hover:bg-orange-50"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            נסה לשלוח שוב
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id!, 'pending')}
                          >
                            <Undo2 className="w-4 h-4 mr-1" />
                            אפס סטטוס
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order.id!)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id!)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Eye, Trash2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, softDeleteOrder, restoreOrder, updateOrderStatus } from "@/services/database";
import { Order } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  pending: "bg-blue-100 text-blue-800",
  processed: "bg-yellow-100 text-yellow-800", 
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

const statusText = {
  pending: "ממתינה",
  processed: "בטיפול", 
  shipped: "נשלחה",
  delivered: "נמסרה",
};

export function OrdersTable() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>טוען הזמנות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          placeholder="חיפוש לפי שם לקוח, מספר הזמנה או אימייל..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מספר הזמנה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">אימייל</TableHead>
              <TableHead className="text-right">פלטפורמה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">תאריך הזמנה</TableHead>
              <TableHead className="text-right">סכום</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  לא נמצאו הזמנות
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name || 'לא זמין'}</TableCell>
                  <TableCell>{order.customer_email || 'לא זמין'}</TableCell>
                  <TableCell className="capitalize">{order.platform}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {statusText[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.order_date ? new Date(order.order_date).toLocaleDateString("he-IL") : 'לא זמין'}
                  </TableCell>
                  <TableCell>
                    {order.total_amount ? `₪${order.total_amount}` : 'לא זמין'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {order.status === "pending" && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartPicking(order.id!)}
                        >
                          התחל ליקוט
                        </Button>
                      )}
                      {order.status === "processed" && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id!, "shipped")}
                        >
                          סמן כנשלח
                        </Button>
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


import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/lib/supabase";
import { getOrders, updateOrderStatus, logOrderActivity } from "@/services/database";

export const usePDQWorkflow = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const handleStageChange = async (orderId: string, stage: 'verify' | 'assign' | 'fulfill') => {
    try {
      let newStatus: Order['status'];
      let activityType: string;

      switch (stage) {
        case 'verify':
          // Moving from pending to processed after verification
          newStatus = 'processed';
          activityType = 'order_verified';
          break;
        case 'assign':
          // Order is processed and ready for assignment
          newStatus = 'processed';
          activityType = 'ready_for_assignment';
          break;
        case 'fulfill':
          // Order is in process
          newStatus = 'in_process';
          activityType = 'assigned_to_picker';
          break;
        default:
          return;
      }

      await updateOrderStatus(orderId, newStatus);
      await logOrderActivity({
        order_id: orderId,
        activity_type: activityType,
        details: { stage, timestamp: new Date().toISOString() }
      });

      await loadOrders();

      toast({
        title: "עודכן בהצלחה",
        description: `ההזמנה הועברה לשלב ${stage === 'verify' ? 'אימות' : stage === 'assign' ? 'הקצאה' : 'מילוי'}`,
      });
    } catch (error) {
      console.error('Error updating order stage:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את שלב ההזמנה",
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    handleStageChange,
    refreshOrders: loadOrders
  };
};

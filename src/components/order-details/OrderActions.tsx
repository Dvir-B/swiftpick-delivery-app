import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { updateOrderStatus, logOrderActivity, softDeleteOrder } from "@/services/database";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  RotateCcw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface OrderActionsProps {
  order: Order;
  onOrderUpdated: () => void;
}

export function OrderActions({ order, onOrderUpdated }: OrderActionsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(order.id!, newStatus);
      await logOrderActivity(order.id!, 'status_updated', { newStatus, previousStatus: order.status });
      onOrderUpdated();
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
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsUpdating(true);
    try {
      await softDeleteOrder(order.id!);
      await logOrderActivity(order.id!, 'order_deleted');
      toast({
        title: "הזמנה נמחקה",
        description: "ההזמנה נמחקה בהצלחה",
      });
      navigate(-1);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את ההזמנה",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartPicking = () => {
    navigate(`/picking/${order.id}`);
  };

  const getAvailableActions = () => {
    const actions = [];

    if (order.status === 'pending') {
      actions.push({
        label: 'סמן כמעובד',
        icon: <Package className="w-4 h-4" />,
        action: () => handleStatusUpdate('processed'),
        variant: 'default' as const,
      });
    }

    if (order.status === 'pending' || order.status === 'processed') {
      actions.push({
        label: 'התחל איסוף',
        icon: <Package className="w-4 h-4" />,
        action: handleStartPicking,
        variant: 'default' as const,
      });
    }

    if (order.status === 'processed') {
      actions.push({
        label: 'סמן כנשלח',
        icon: <Truck className="w-4 h-4" />,
        action: () => handleStatusUpdate('shipped'),
        variant: 'default' as const,
      });
    }

    if (order.status === 'shipped') {
      actions.push({
        label: 'סמן כנמסר',
        icon: <CheckCircle className="w-4 h-4" />,
        action: () => handleStatusUpdate('delivered'),
        variant: 'default' as const,
      });
    }

    if (order.status === 'error') {
      actions.push({
        label: 'החזר לממתין',
        icon: <RotateCcw className="w-4 h-4" />,
        action: () => handleStatusUpdate('pending'),
        variant: 'outline' as const,
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          פעולות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full flex items-center gap-2 justify-start"
            onClick={action.action}
            disabled={isUpdating}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}

        <div className="pt-2 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full flex items-center gap-2 justify-start"
                disabled={isUpdating}
              >
                <Trash2 className="w-4 h-4" />
                מחק הזמנה
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                  פעולה זו תמחק את ההזמנה #{order.order_number}. 
                  ניתן יהיה לשחזר אותה מאוחר יותר.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteOrder}>
                  מחק
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

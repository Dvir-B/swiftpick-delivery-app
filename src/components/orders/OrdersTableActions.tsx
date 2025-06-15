
import { Order } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Send, RefreshCw, Undo2 } from "lucide-react";

interface OrdersTableActionsProps {
  order: Order;
  onStartPicking: (orderId: string) => void;
  onSendToShipping: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  onViewOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrdersTableActions = ({
  order,
  onStartPicking,
  onSendToShipping,
  onUpdateStatus,
  onViewOrder,
  onDeleteOrder,
}: OrdersTableActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {order.status === "pending" && (
        <>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onStartPicking(order.id!)}
          >
            התחל ליקוט
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onSendToShipping(order)}
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
            onClick={() => onUpdateStatus(order.id!, "shipped")}
          >
            סמן כנשלח
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onSendToShipping(order)}
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
            onClick={() => onSendToShipping(order)}
            className="text-orange-600 hover:text-orange-800 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            נסה לשלוח שוב
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(order.id!, 'pending')}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            אפס סטטוס
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewOrder(order.id!)}
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteOrder(order.id!)}
        className="text-red-600 hover:text-red-800"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};


import { Order } from "@/lib/supabase";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { OrdersTableActions } from "./OrdersTableActions";

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

interface OrdersTableRowProps {
  order: Order;
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
  onStartPicking: (orderId: string) => void;
  onSendToShipping: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  onViewOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrdersTableRow = ({
  order,
  isSelected,
  onSelectChange,
  ...actionHandlers
}: OrdersTableRowProps) => {
  return (
    <TableRow data-state={isSelected ? "selected" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange(Boolean(checked))}
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
        <OrdersTableActions order={order} {...actionHandlers} />
      </TableCell>
    </TableRow>
  );
};

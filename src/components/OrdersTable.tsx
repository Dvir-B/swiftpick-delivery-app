import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Order {
  id: string;
  customer: string;
  status: "new" | "processing" | "shipped";
  date: string;
  items: number;
}

const mockOrders: Order[] = [
  { id: "1", customer: "ישראל ישראלי", status: "new", date: "2024-02-20", items: 3 },
  { id: "2", customer: "חיים כהן", status: "processing", date: "2024-02-19", items: 1 },
  { id: "3", customer: "שרה לוי", status: "shipped", date: "2024-02-18", items: 5 },
];

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  shipped: "bg-green-100 text-green-800",
};

const statusText = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
};

export function OrdersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const filteredOrders = orders.filter(order => 
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          placeholder="חיפוש לפי שם לקוח או מספר הזמנה..."
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
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">תאריך</TableHead>
              <TableHead className="text-right">פריטים</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status]}>
                    {statusText[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString("he-IL")}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    {order.items}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
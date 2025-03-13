
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, FileText, Send } from "lucide-react";
import { WixCredentials, WixOrder, fetchWixOrders, convertWixOrderToHfdShipment } from "@/utils/wixIntegration";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface WixOrdersListProps {
  credentials: WixCredentials;
  hfdSettings: any;
  onCreateShipment: (shipmentData: any) => void;
}

const WixOrdersList = ({ credentials, hfdSettings, onCreateShipment }: WixOrdersListProps) => {
  const [orders, setOrders] = useState<WixOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchWixOrders(credentials);
      setOrders(fetchedOrders);
      toast({
        title: "הזמנות נטענו בהצלחה",
        description: `נטענו ${fetchedOrders.length} הזמנות מחנות Wix שלך`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בטעינת הזמנות",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = (order: WixOrder) => {
    try {
      const shipmentData = convertWixOrderToHfdShipment(order, hfdSettings);
      onCreateShipment(shipmentData);
      toast({
        title: "הזמנה נשלחה ל-HFD",
        description: `הזמנה מספר ${order.number} נשלחה ליצירת משלוח`,
      });
    } catch (error) {
      toast({
        title: "שגיאה ביצירת משלוח",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">הזמנות Wix</h3>
        <Button 
          onClick={loadOrders} 
          disabled={loading || !credentials.isConnected}
          className="flex items-center"
        >
          <FileText className="mr-2 h-4 w-4" />
          {loading ? "טוען הזמנות..." : "טען הזמנות"}
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {credentials.isConnected ? "לחץ על 'טען הזמנות' כדי להציג הזמנות מחנות Wix שלך" : "התחבר לחנות Wix שלך כדי לראות הזמנות"}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">הזמנה #{order.number}</CardTitle>
                    <CardDescription>
                      {new Date(order.dateCreated).toLocaleDateString('he-IL')} | 
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </CardDescription>
                  </div>
                  <Badge>{order.status === "PAID" ? "שולם" : order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">פרטי לקוח:</p>
                    <p className="text-sm">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                    <p className="text-sm">{order.customerInfo.email}</p>
                    <p className="text-sm">{order.customerInfo.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">כתובת למשלוח:</p>
                    <p className="text-sm">{order.shippingInfo.shipmentDetails.address.addressLine1}</p>
                    <p className="text-sm">{order.shippingInfo.shipmentDetails.address.city}</p>
                    <p className="text-sm">סוג משלוח: {order.shippingInfo.deliveryOption}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between">
                  <span className="text-sm">סה"כ: ₪{order.totals.total.toFixed(2)}</span>
                  <span className="text-sm">משקל: {order.totals.weight}g</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleCreateShipment(order)} 
                  className="w-full flex items-center"
                  disabled={!hfdSettings.clientNumber || !hfdSettings.token}
                >
                  <Send className="mr-2 h-4 w-4" />
                  צור משלוח HFD
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WixOrdersList;

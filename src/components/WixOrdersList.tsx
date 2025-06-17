
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, FileText, Send, ExternalLink } from "lucide-react";
import { WixCredentials as WixIntegrationCredentials, WixOrder, fetchWixOrders } from "@/utils/wixIntegration";
import { convertOrderToHfdShipment, createHfdShipment } from "@/utils/hfdIntegration";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WixCredentials } from "@/lib/supabase";

interface WixOrdersListProps {
  credentials: WixCredentials;
  hfdSettings: any;
  onCreateShipment: (shipmentData: any) => void;
}

const WixOrdersList = ({ credentials, hfdSettings, onCreateShipment }: WixOrdersListProps) => {
  const [orders, setOrders] = useState<WixOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Convert WixCredentials to WixIntegrationCredentials format
      const integrationCredentials: WixIntegrationCredentials = {
        siteUrl: credentials.site_url,
        appId: credentials.app_id,
        apiKey: credentials.api_key,
        refreshToken: credentials.refresh_token,
        isConnected: credentials.is_connected
      };
      
      const fetchedOrders = await fetchWixOrders(integrationCredentials);
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

  const handleCreateShipment = async (order: WixOrder) => {
    setProcessingOrders(prev => new Set(prev).add(order.id));
    
    try {
      if (!hfdSettings.client_number || !hfdSettings.token) {
        throw new Error("חסרים פרטי חיבור ל-HFD");
      }

      const shipmentData = convertOrderToHfdShipment(order, hfdSettings);
      const result = await createHfdShipment(shipmentData);

      toast({
        title: "משלוח נוצר בהצלחה",
        description: `משלוח מספר ${result.shipmentNumber} נוצר ב-HFD`,
      });

      // Remove the order from the list since it's processed
      setOrders(prev => prev.filter(o => o.id !== order.id));

    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "שגיאה ביצירת משלוח",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">שולם</Badge>;
      case 'PENDING':
        return <Badge variant="outline">ממתין</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!credentials.is_connected) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>יש להתקין את האפליקציה בחנות Wix שלך ולהשלים את תהליך החיבור</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">הזמנות Wix</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.open('https://www.wix.com/my-account/site-selector/?buttonText=Select%20Site&title=Select%20a%20Site&autoSelectOnSingleSite=true&actionUrl=https%3A%2F%2Fwww.wix.com%2Fdashboard%2F%7B%7BmetaSiteId%7D%7D%2Forder-management', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            ניהול הזמנות ב-Wix
          </Button>
          <Button 
            onClick={loadOrders} 
            disabled={loading || !credentials.is_connected}
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "טוען הזמנות..." : "טען הזמנות"}
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>לחץ על 'טען הזמנות' כדי להציג הזמנות מחנות Wix שלך</p>
          <p className="text-sm mt-1">או שאין הזמנות חדשות כרגע</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            נמצאו {orders.length} הזמנות. ודא שפרטי ה-HFD מוגדרים נכון לפני שליחת המשלוחים.
          </div>
          
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
                  {getOrderStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">פרטי לקוח:</p>
                    <div className="text-sm space-y-1">
                      <p>{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p className="text-gray-600">{order.customerInfo.email}</p>
                      {order.customerInfo.phone && (
                        <p className="text-gray-600">{order.customerInfo.phone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">כתובת למשלוח:</p>
                    <div className="text-sm space-y-1">
                      <p>{order.shippingInfo.shipmentDetails.address.addressLine1}</p>
                      <p>{order.shippingInfo.shipmentDetails.address.city}</p>
                      <p className="text-gray-600">סוג משלוח: {order.shippingInfo.deliveryOption}</p>
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-sm">
                  <span>סה"כ: ₪{order.totals.total.toFixed(2)}</span>
                  <span>משקל: {order.totals.weight}g</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleCreateShipment(order)} 
                  className="w-full flex items-center"
                  disabled={!hfdSettings.client_number || !hfdSettings.token || processingOrders.has(order.id)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {processingOrders.has(order.id) ? "יוצר משלוח..." : "צור משלוח HFD"}
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

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Package, MapPin, Calendar, DollarSign, User, Mail, Phone, ArrowLeft, Edit, Truck, Eye } from "lucide-react";
import { getOrderById, getOrderLogs, getShipments } from "@/services/database";
import type { Shipment } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderActivityTimeline } from "@/components/order-details/OrderActivityTimeline";
import { OrderActions } from "@/components/order-details/OrderActions";
import { OrderEditDialog } from "@/components/order-details/OrderEditDialog";
import { CreateShipmentForm } from "@/components/shipments/CreateShipmentForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);

  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
  });

  const { data: orderLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['orderLogs', orderId],
    queryFn: () => getOrderLogs(orderId!),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (order?.id) {
      getShipments().then((shipments) => {
        const found = shipments.find((s) => s.order_id === order.id);
        setShipment(found || null);
      });
    }
  }, [order?.id]);

  if (orderLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div>טוען פרטי הזמנה...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">הזמנה לא נמצאה</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'in_process': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'processed': return 'מעובד';
      case 'shipped': return 'נשלח';
      case 'delivered': return 'נמסר';
      case 'error': return 'שגיאה';
      case 'in_process': return 'בתהליך';
      default: return status;
    }
  };

  const handleOrderUpdated = () => {
    refetchOrder();
    refetchLogs();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            חזור
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">הזמנה #{order.order_number}</h1>
            <p className="text-gray-500">נוצרה בתאריך {formatDate(order.created_at!)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            ערוך
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">שם</label>
                  <p className="text-lg">{order.customer_name || 'לא צוין'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">אימייל</label>
                  <p className="text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customer_email || 'לא צוין'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">טלפון</label>
                  <p className="text-lg flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.customer_phone || 'לא צוין'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">פלטפורמה</label>
                  <Badge variant="outline" className="ml-2">
                    {order.platform.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {(order.shipping_address || shipment?.delivery_address) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  כתובת משלוח
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeof order.shipping_address === 'string' ? (
                  <p>{order.shipping_address}</p>
                ) : (
                  <div>
                    {/* Display full address first if available */}
                    {order.shipping_address?.address && <p>{order.shipping_address.address}</p>}
                    
                    {/* Then display structured address, but avoid redundancy if full address exists */}
                    {order.shipping_address?.street && !order.shipping_address.address && (
                      <p>{order.shipping_address.street}</p>
                    )}
                    {(order.shipping_address?.city || order.shipping_address?.zipCode) && !order.shipping_address.address && (
                      <p>
                        {order.shipping_address.city}{order.shipping_address.zipCode ? `, ${order.shipping_address.zipCode}` : ''}
                      </p>
                    )}
                    {order.shipping_address?.country && !order.shipping_address.address && (
                      <p>{order.shipping_address.country}</p>
                    )}
                  </div>
                )}
                
                {shipment?.delivery_address && (
                  <div className={order.shipping_address ? 'mt-4 pt-4 border-t' : ''}>
                    <p className="text-sm text-gray-500 mb-1">כתובת למשלוח (HFD)</p>
                    <p>{shipment.delivery_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                היסטוריית פעולות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div>טוען היסטוריה...</div>
              ) : (
                <OrderActivityTimeline logs={orderLogs || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                סיכום הזמנה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">מספר הזמנה:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">מזהה חיצוני:</span>
                <span className="font-medium">{order.external_id}</span>
              </div>
              {order.total_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">סכום:</span>
                  <span className="font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(order.total_amount, order.currency)}
                  </span>
                </div>
              )}
              {order.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-500">משקל:</span>
                  <span className="font-medium">{order.weight} ק"ג</span>
                </div>
              )}
              {order.order_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">תאריך הזמנה:</span>
                  <span className="font-medium">{formatDate(order.order_date)}</span>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">מספר מעקב:</span>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span className="font-medium">{order.tracking_number}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <OrderActions 
            order={order} 
            onOrderUpdated={handleOrderUpdated}
          />

          {/* Create Shipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                יצירת משלוח
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateShipmentForm 
                orderId={order.id}
                onSuccess={(shipmentNumber) => {
                  // Update order with shipment info
                  handleOrderUpdated();
                  toast({
                    title: 'משלוח נוצר בהצלחה',
                    description: `מספר המשלוח: ${shipmentNumber}`,
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <OrderEditDialog
        order={order}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};

export default OrderDetails;

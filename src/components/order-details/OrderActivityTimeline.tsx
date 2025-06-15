
import { OrderLog } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Edit,
  Trash2,
  ShoppingCart,
  User,
  MapPin
} from "lucide-react";

interface OrderActivityTimelineProps {
  logs: OrderLog[];
}

export function OrderActivityTimeline({ logs }: OrderActivityTimelineProps) {
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'order_created': return <ShoppingCart className="w-4 h-4" />;
      case 'order_updated': return <Edit className="w-4 h-4" />;
      case 'order_deleted': return <Trash2 className="w-4 h-4" />;
      case 'status_updated': return <Clock className="w-4 h-4" />;
      case 'shipment_created': return <Truck className="w-4 h-4" />;
      case 'shipment_creation_failed': return <AlertCircle className="w-4 h-4" />;
      case 'picking_started': return <User className="w-4 h-4" />;
      case 'picking_completed': return <CheckCircle className="w-4 h-4" />;
      case 'address_updated': return <MapPin className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'order_created': return 'text-blue-600 bg-blue-50';
      case 'order_updated': return 'text-purple-600 bg-purple-50';
      case 'order_deleted': return 'text-red-600 bg-red-50';
      case 'status_updated': return 'text-orange-600 bg-orange-50';
      case 'shipment_created': return 'text-green-600 bg-green-50';
      case 'shipment_creation_failed': return 'text-red-600 bg-red-50';
      case 'picking_started': return 'text-indigo-600 bg-indigo-50';
      case 'picking_completed': return 'text-emerald-600 bg-emerald-50';
      case 'address_updated': return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityTitle = (activityType: string) => {
    switch (activityType) {
      case 'order_created': return 'הזמנה נוצרה';
      case 'order_updated': return 'הזמנה עודכנה';
      case 'order_deleted': return 'הזמנה נמחקה';
      case 'status_updated': return 'סטטוס עודכן';
      case 'shipment_created': return 'משלוח נוצר';
      case 'shipment_creation_failed': return 'יצירת משלוח נכשלה';
      case 'picking_started': return 'איסוף החל';
      case 'picking_completed': return 'איסוף הושלם';
      case 'address_updated': return 'כתובת עודכנה';
      default: return activityType;
    }
  };

  const formatActivityDetails = (log: OrderLog) => {
    if (!log.details) return null;

    const details = log.details as any;
    
    switch (log.activity_type) {
      case 'status_updated':
        return `סטטוס עודכן ל: ${details.newStatus}`;
      case 'shipment_created':
        return `מספר משלוח: ${details.hfdShipmentNumber}`;
      case 'shipment_creation_failed':
        return `שגיאה: ${details.error}`;
      default:
        return JSON.stringify(details, null, 2);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>אין פעילות להצגה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${getActivityColor(log.activity_type)}`}>
              {getActivityIcon(log.activity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900">
                  {getActivityTitle(log.activity_type)}
                </h4>
                <span className="text-xs text-gray-500">
                  {formatDate(log.created_at!)}
                </span>
              </div>
              {formatActivityDetails(log) && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatActivityDetails(log)}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

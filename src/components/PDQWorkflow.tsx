
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Package, Truck } from "lucide-react";
import { Order } from "@/lib/supabase";

interface PDQWorkflowProps {
  orders: Order[];
  onStageChange: (orderId: string, stage: 'verify' | 'assign' | 'fulfill') => void;
}

export const PDQWorkflow = ({ orders, onStageChange }: PDQWorkflowProps) => {
  const [activeStage, setActiveStage] = useState<'verify' | 'assign' | 'fulfill'>('verify');

  const getStageOrders = (stage: 'verify' | 'assign' | 'fulfill') => {
    switch (stage) {
      case 'verify':
        return orders.filter(order => order.status === 'pending');
      case 'assign':
        return orders.filter(order => order.status === 'processed' && !order.picker_id);
      case 'fulfill':
        return orders.filter(order => order.status === 'in_process' || (order.status === 'processed' && order.picker_id));
      default:
        return [];
    }
  };

  const stages = [
    {
      id: 'verify' as const,
      name: 'אמת',
      icon: CheckCircle,
      description: 'אמת הזמנות חדשות',
      color: 'bg-blue-500',
      count: getStageOrders('verify').length
    },
    {
      id: 'assign' as const,
      name: 'הקצה',
      icon: Clock,
      description: 'הקצה למלקט',
      color: 'bg-yellow-500',
      count: getStageOrders('assign').length
    },
    {
      id: 'fulfill' as const,
      name: 'מלא',
      icon: Package,
      description: 'מלא הזמנות',
      color: 'bg-green-500',
      count: getStageOrders('fulfill').length
    }
  ];

  const currentOrders = getStageOrders(activeStage);

  return (
    <div className="space-y-6">
      {/* Stage Navigation */}
      <div className="grid grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          
          return (
            <Card 
              key={stage.id}
              className={`cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setActiveStage(stage.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${stage.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{stage.name}</h3>
                    <p className="text-sm text-gray-600">{stage.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {stage.count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Stage Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>שלב {stages.find(s => s.id === activeStage)?.name}</span>
            <Badge>{currentOrders.length} הזמנות</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              אין הזמנות בשלב זה
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{order.order_number}</span>
                      <span className="text-gray-600">{order.customer_name}</span>
                      {order.total_amount && (
                        <span className="text-sm text-gray-500">
                          ₪{order.total_amount}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.order_date && new Date(order.order_date).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {activeStage === 'verify' && (
                      <Button
                        size="sm"
                        onClick={() => onStageChange(order.id!, 'assign')}
                      >
                        אמת והעבר להקצאה
                      </Button>
                    )}
                    
                    {activeStage === 'assign' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStageChange(order.id!, 'fulfill')}
                      >
                        הקצה למלקט
                      </Button>
                    )}
                    
                    {activeStage === 'fulfill' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          התחל ליקוט
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          שלח למשלוח
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

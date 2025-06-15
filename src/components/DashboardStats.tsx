
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/services/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["dashboardStatsOrders"],
    queryFn: getOrders,
  });

  const stats = {
    pending: 0,
    processed: 0,
    shippedToday: 0,
    delivered: 0,
  };

  if (orders) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    stats.pending = orders.filter((o) => o.status === 'pending').length;
    stats.processed = orders.filter((o) => o.status === 'processed').length;
    stats.shippedToday = orders.filter(
      (o) =>
        o.status === 'shipped' && o.updated_at && new Date(o.updated_at) >= today
    ).length;
    stats.delivered = orders.filter((o) => o.status === 'delivered').length;
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">הזמנות חדשות</CardTitle>
          <Package className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <div className="text-2xl font-bold">{stats.pending}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">בטיפול</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <div className="text-2xl font-bold">{stats.processed}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">נשלחו היום</CardTitle>
          <Truck className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <div className="text-2xl font-bold">{stats.shippedToday}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
          <CheckCircle className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <div className="text-2xl font-bold">{stats.delivered}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { DashboardStats } from "@/components/DashboardStats";
import { OrdersTable } from "@/components/OrdersTable";

const Index = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">לוח בקרה</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("he-IL", { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      
      <DashboardStats />
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary">הזמנות אחרונות</h2>
        <OrdersTable />
      </div>
    </div>
  );
};

export default Index;
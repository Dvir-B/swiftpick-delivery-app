
import { DashboardStats } from "@/components/DashboardStats";
import { OrdersTable } from "@/components/OrdersTable";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">לוח בקרה</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/pdq")}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Workflow className="w-4 h-4" />
            PDQ - אמת, הקצה, מלא
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            הגדרות
          </Button>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("he-IL", { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
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

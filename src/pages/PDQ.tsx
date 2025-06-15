
import { PDQWorkflow } from "@/components/PDQWorkflow";
import { usePDQWorkflow } from "@/hooks/usePDQWorkflow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PDQ = () => {
  const navigate = useNavigate();
  const { orders, loading, handleStageChange } = usePDQWorkflow();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            חזור
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-primary">PDQ - אמת, הקצה, מלא</h1>
            <p className="text-gray-600 mt-2">ניהול זרימת עבודה מתקדמת להזמנות</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
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

      <PDQWorkflow orders={orders} onStageChange={handleStageChange} />
    </div>
  );
};

export default PDQ;

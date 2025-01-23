import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

interface PickingHeaderProps {
  orderId: string;
  progress: number;
  onGoBack: () => void;
}

export function PickingHeader({ orderId, progress, onGoBack }: PickingHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onGoBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לרשימת ההזמנות
        </Button>
        <h1 className="text-3xl font-bold">ליקוט הזמנה #{orderId}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Progress value={progress} className="w-[200px]" />
        <span className="text-sm text-gray-500">{Math.round(progress)}% הושלם</span>
      </div>
    </div>
  );
}
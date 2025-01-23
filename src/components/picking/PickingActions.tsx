import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PickingActionsProps {
  onPrint: () => void;
  onComplete: () => void;
}

export function PickingActions({ onPrint, onComplete }: PickingActionsProps) {
  return (
    <div className="flex justify-center gap-4">
      <Button 
        onClick={onPrint}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Printer className="ml-2 h-4 w-4" />
        הדפס תווית
      </Button>
      <Button 
        onClick={onComplete}
        className="bg-green-600 hover:bg-green-700"
      >
        סיים משלוח
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Search } from "lucide-react";

interface OrdersTableToolbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedOrdersCount: number;
  onBulkSend: () => void;
  onGoBack: () => void;
}

export const OrdersTableToolbar = ({
  searchTerm,
  onSearchTermChange,
  selectedOrdersCount,
  onBulkSend,
  onGoBack,
}: OrdersTableToolbarProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          חזור
        </Button>
        {selectedOrdersCount > 0 && (
          <Button onClick={onBulkSend}>
            <Send className="w-4 h-4 mr-2" />
            שלח למשלוח ({selectedOrdersCount})
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          placeholder="חיפוש לפי שם לקוח, מספר הזמנה או אימייל..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
    </div>
  );
};

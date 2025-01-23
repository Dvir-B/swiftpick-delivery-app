import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { PickingHeader } from "@/components/picking/PickingHeader";
import { BarcodeScanner } from "@/components/picking/BarcodeScanner";
import { PickingItemCard } from "@/components/picking/PickingItem";
import { PickingActions } from "@/components/picking/PickingActions";

interface PickingItem {
  id: string;
  name: string;
  sku: string;
  size?: string;
  color?: string;
  quantity: number;
  location: string;
  picked: boolean;
  barcode: string;
}

const mockItems: PickingItem[] = [
  { 
    id: "1", 
    name: "חולצת טי שחורה", 
    sku: "TS-001",
    size: "L",
    color: "שחור",
    quantity: 2, 
    location: "A1-B3", 
    picked: false,
    barcode: "123456789"
  },
  { 
    id: "2", 
    name: "מכנסי ג'ינס כחולים", 
    sku: "JP-002",
    size: "32",
    color: "כחול כהה",
    quantity: 1, 
    location: "B2-C4", 
    picked: false,
    barcode: "987654321"
  },
  { 
    id: "3", 
    name: "גרביים לבנות", 
    sku: "SK-003",
    size: "39-42",
    color: "לבן",
    quantity: 3, 
    location: "D5-E1", 
    picked: false,
    barcode: "456789123"
  },
];

const Picking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<PickingItem[]>(mockItems);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  const progress = (items.filter(item => item.picked).length / items.length) * 100;

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(item => item.barcode === barcodeInput);
    if (item) {
      handlePickItem(item.id);
      setBarcodeInput("");
      toast({
        title: "פריט נסרק בהצלחה",
        description: `${item.name} נוסף לליקוט`,
      });
    } else {
      toast({
        title: "שגיאה",
        description: "ברקוד לא נמצא",
        variant: "destructive",
      });
    }
  };

  const handlePickItem = (itemId: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, picked: true } : item
    ));
  };

  const handlePrintLabel = () => {
    toast({
      title: "תווית נשלחה להדפסה",
      description: `הזמנה מספר ${orderId}`,
    });
  };

  const handleCompleteShipment = () => {
    toast({
      title: "משלוח הושלם",
      description: "ההזמנה מוכנה למשלוח",
    });
    setTimeout(() => navigate('/'), 1500);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PickingHeader 
        orderId={orderId || ""} 
        progress={progress}
        onGoBack={handleGoBack}
      />
      
      <BarcodeScanner
        value={barcodeInput}
        onChange={setBarcodeInput}
        onSubmit={handleBarcodeSubmit}
      />
      
      <div className="grid gap-4">
        {items.map((item) => (
          <PickingItemCard
            key={item.id}
            {...item}
            onPick={handlePickItem}
          />
        ))}
      </div>

      {progress === 100 && (
        <PickingActions
          onPrint={handlePrintLabel}
          onComplete={handleCompleteShipment}
        />
      )}
    </div>
  );
};

export default Picking;
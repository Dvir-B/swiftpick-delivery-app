import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, Package2, Printer, Barcode } from "lucide-react";

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
    // כאן יהיה הקוד להדפסת התווית
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
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ליקוט הזמנה #{orderId}</h1>
        <div className="flex items-center space-x-4">
          <Progress value={progress} className="w-[200px]" />
          <span className="text-sm text-gray-500">{Math.round(progress)}% הושלם</span>
        </div>
      </div>

      <form onSubmit={handleBarcodeSubmit} className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="סרוק ברקוד..."
            className="pr-10"
          />
        </div>
        <Button type="submit">סרוק</Button>
      </form>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className={item.picked ? "bg-gray-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
                <div className="text-sm text-gray-500">
                  <span>מק"ט: {item.sku}</span>
                  {item.size && <span className="mx-2">| מידה: {item.size}</span>}
                  {item.color && <span className="mx-2">| צבע: {item.color}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Package2 className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-sm text-gray-500">מיקום: {item.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
                  <p className="text-sm text-gray-500">ברקוד: {item.barcode}</p>
                </div>
                {item.picked ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-5 w-5 ml-2" />
                    <span>נלקט</span>
                  </div>
                ) : (
                  <Button onClick={() => handlePickItem(item.id)}>סמן כנלקט</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {progress === 100 && (
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handlePrintLabel}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="ml-2 h-4 w-4" />
            הדפס תווית
          </Button>
          <Button 
            onClick={handleCompleteShipment}
            className="bg-green-600 hover:bg-green-700"
          >
            סיים משלוח
          </Button>
        </div>
      )}
    </div>
  );
};

export default Picking;
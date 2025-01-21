import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Package2 } from "lucide-react";

interface PickingItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
  picked: boolean;
}

const mockItems: PickingItem[] = [
  { id: "1", name: "חולצת טי שחורה", quantity: 2, location: "A1-B3", picked: false },
  { id: "2", name: "מכנסי ג'ינס כחולים", quantity: 1, location: "B2-C4", picked: false },
  { id: "3", name: "גרביים לבנות", quantity: 3, location: "D5-E1", picked: false },
];

const Picking = () => {
  const { orderId } = useParams();
  const [items, setItems] = useState<PickingItem[]>(mockItems);
  
  const progress = (items.filter(item => item.picked).length / items.length) * 100;

  const handlePickItem = (itemId: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, picked: true } : item
    ));
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

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className={item.picked ? "bg-gray-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <Package2 className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-sm text-gray-500">מיקום: {item.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
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
        <div className="flex justify-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            סיים ליקוט
          </Button>
        </div>
      )}
    </div>
  );
};

export default Picking;
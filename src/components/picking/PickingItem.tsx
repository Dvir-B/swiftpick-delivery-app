import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package2, CheckCircle2 } from "lucide-react";

interface PickingItemProps {
  id: string;
  name: string;
  sku: string;
  size?: string;
  color?: string;
  quantity: number;
  location: string;
  picked: boolean;
  barcode: string;
  onPick: (id: string) => void;
}

export function PickingItemCard({ 
  id, 
  name, 
  sku, 
  size, 
  color, 
  quantity, 
  location, 
  picked, 
  barcode,
  onPick 
}: PickingItemProps) {
  return (
    <Card className={picked ? "bg-gray-50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-medium">{name}</CardTitle>
          <div className="text-sm text-gray-500">
            <span>מק"ט: {sku}</span>
            {size && <span className="mx-2">| מידה: {size}</span>}
            {color && <span className="mx-2">| צבע: {color}</span>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Package2 className="h-4 w-4 text-gray-500 ml-2" />
          <span className="text-sm text-gray-500">מיקום: {location}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">כמות: {quantity}</p>
            <p className="text-sm text-gray-500">ברקוד: {barcode}</p>
          </div>
          {picked ? (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="h-5 w-5 ml-2" />
              <span>נלקט</span>
            </div>
          ) : (
            <Button onClick={() => onPick(id)}>סמן כנלקט</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
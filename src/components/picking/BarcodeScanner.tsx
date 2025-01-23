import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Barcode } from "lucide-react";

interface BarcodeScannerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BarcodeScanner({ value, onChange, onSubmit }: BarcodeScannerProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="סרוק ברקוד..."
          className="pr-10"
          autoFocus
        />
      </div>
      <Button type="submit">סרוק</Button>
    </form>
  );
}
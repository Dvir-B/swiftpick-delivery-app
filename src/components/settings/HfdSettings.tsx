
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Check } from "lucide-react";
import { HfdSettings as HfdSettingsType } from "@/lib/supabase";

interface HfdSettingsProps {
  hfdSettings: Omit<HfdSettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  onSettingsChange: (field: string, value: string) => void;
  onSave: () => void;
  onTest: () => void;
  isTesting: boolean;
}

const HfdSettings = ({ hfdSettings, onSettingsChange, onSave, onTest, isTesting }: HfdSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>חברת HFD</CardTitle>
        <CardDescription>הגדרות חיבור לחברת המשלוחים HFD</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            לחיבור מערכת ה-ERP של HFD, אנא הזן את הפרטים הבאים. 
            אם אין לך את הפרטים, פנה לחברת HFD לקבלת מספר לקוח וטוקן גישה.
          </p>
        </div>
        <div className="space-y-2">
          <Label>מספר לקוח (Client Number)</Label>
          <Input 
            placeholder="לדוגמה: 3399" 
            value={hfdSettings.client_number}
            onChange={(e) => onSettingsChange('client_number', e.target.value)}
          />
          
          <Label>טוקן גישה (API Token)</Label>
          <Input 
            placeholder="הזן את הטוקן שקיבלת מחברת HFD" 
            type="password"
            value={hfdSettings.token}
            onChange={(e) => onSettingsChange('token', e.target.value)}
          />
          
          <Label>קוד סוג משלוח (Shipment Type Code)</Label>
          <Input 
            placeholder="לדוגמה: 35" 
            value={hfdSettings.shipment_type_code}
            onChange={(e) => onSettingsChange('shipment_type_code', e.target.value)}
          />
          
          <Label>קוד סוג מטען (Cargo Type Haloch)</Label>
          <Input 
            placeholder="לדוגמה: 10" 
            value={hfdSettings.cargo_type_haloch}
            onChange={(e) => onSettingsChange('cargo_type_haloch', e.target.value)}
          />
          
          <div className="pt-4 flex items-center justify-between">
            <Button 
              onClick={onSave}
              className="flex items-center"
            >
              <Truck className="mr-2 h-4 w-4" />
              שמור הגדרות HFD
            </Button>
            
            <Button 
              variant="outline"
              onClick={onTest}
              disabled={isTesting || !hfdSettings.client_number || !hfdSettings.token}
              className="flex items-center"
            >
              {isTesting ? (
                <>טוען...</>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  בדיקת חיבור
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HfdSettings;

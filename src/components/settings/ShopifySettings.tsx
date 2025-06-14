
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";

interface ShopifySettingsProps {
  onApiConnection: (service: string) => void;
}

const ShopifySettings = ({ onApiConnection }: ShopifySettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopify</CardTitle>
        <CardDescription>חיבור חנות Shopify</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              על מנת לחבר את החנות שלך, פשוט העתק את כתובת החנות שלך והזן אותה כאן.
              אנחנו נדריך אותך בתהליך החיבור צעד אחר צעד.
            </p>
          </div>
          <Input 
            placeholder="לדוגמה: my-store.myshopify.com" 
            className="mb-4"
          />
          <Button 
            onClick={() => window.open('https://admin.shopify.com/store-login', '_blank')}
            variant="outline"
            className="w-full mb-2"
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            כניסה לפאנל הניהול של Shopify
          </Button>
          <Button 
            onClick={() => onApiConnection("Shopify")}
            className="w-full"
          >
            התחל תהליך חיבור
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifySettings;

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "הקובץ הועלה בהצלחה",
        description: `${file.name} נקלט במערכת`,
      });
    }
  };

  const handleApiConnection = (service: string) => {
    toast({
      title: "החיבור בוצע בהצלחה",
      description: `החיבור ל-${service} הושלם`,
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="ml-4">
          <ArrowLeft className="ml-2" />
          חזרה
        </Button>
        <h1 className="text-4xl font-bold">הגדרות מערכת</h1>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipping">חברות משלוחים</TabsTrigger>
          <TabsTrigger value="ecommerce">חיבור לאתר</TabsTrigger>
          <TabsTrigger value="excel">העלאת הזמנות</TabsTrigger>
        </TabsList>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות חברות משלוחים</CardTitle>
              <CardDescription>חבר את המערכת לחברות המשלוחים שלך</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>חברת שליחויות</Label>
                <Input placeholder="מזהה API" />
                <Input placeholder="מפתח API" type="password" />
                <Button onClick={() => handleApiConnection("חברת שליחויות")}>
                  התחבר
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecommerce">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shopify</CardTitle>
                <CardDescription>חיבור חנות Shopify</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 mb-4">
                    <li>היכנס לפאנל הניהול של Shopify</li>
                    <li>לך להגדרות (Settings) ובחר ב-Apps and sales channels</li>
                    <li>לחץ על Develop apps</li>
                    <li>צור app חדש ע"י לחיצה על Create an app</li>
                    <li>הגדר את הרשאות הגישה הבאות:
                      <ul className="list-disc list-inside ml-4">
                        <li>read_orders</li>
                        <li>write_orders</li>
                        <li>read_products</li>
                      </ul>
                    </li>
                  </ol>
                  <Input placeholder="חנות URL" />
                  <Input placeholder="Access Token" type="password" />
                  <Button onClick={() => handleApiConnection("Shopify")}>
                    התחבר
                  </Button>
                  <Button variant="outline" className="mt-2" onClick={() => window.open('https://shopify.dev/docs/apps/auth/admin-app-access-tokens', '_blank')}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    מדריך מפורט
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wix</CardTitle>
                <CardDescription>חיבור אתר Wix</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 mb-4">
                    <li>היכנס לפאנל הניהול של Wix</li>
                    <li>לך ל-Dev Tools ובחר ב-API Keys</li>
                    <li>צור מפתח API חדש</li>
                    <li>הגדר את ההרשאות הבאות:
                      <ul className="list-disc list-inside ml-4">
                        <li>Stores Orders - Read & Write</li>
                        <li>Stores Products - Read</li>
                        <li>Stores Inventory - Read</li>
                      </ul>
                    </li>
                  </ol>
                  <Input placeholder="Site ID" />
                  <Input placeholder="API Key" type="password" />
                  <Button onClick={() => handleApiConnection("Wix")}>
                    התחבר
                  </Button>
                  <Button variant="outline" className="mt-2" onClick={() => window.open('https://dev.wix.com/api/rest/getting-started', '_blank')}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    מדריך מפורט
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle>העלאת הזמנות מאקסל</CardTitle>
              <CardDescription>העלה קובץ אקסל עם פרטי ההזמנות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="excel-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">לחץ להעלאת קובץ</span> או גרור לכאן
                    </p>
                    <p className="text-xs text-gray-500">XLSX, XLS</p>
                  </div>
                  <input
                    id="excel-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
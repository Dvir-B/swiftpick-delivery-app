
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HfdSettings from "@/components/settings/HfdSettings";
import WixSettings from "@/components/settings/WixSettings";
import ShopifySettings from "@/components/settings/ShopifySettings";
import FileUpload from "@/components/settings/FileUpload";
import { processOrdersFile } from "@/services/fileProcessing";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleApiConnection = (service: string) => {
    toast({
      title: "חיבור API",
      description: `תחילת תהליך חיבור ל-${service}`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const results = await processOrdersFile(file);
      
      if (results.success > 0) {
        toast({
          title: "הצלחה!",
          description: `${results.success} הזמנות עובדו בהצלחה`,
        });
      }
      
      if (results.errors.length > 0) {
        toast({
          title: "שגיאות בעיבוד",
          description: `${results.errors.length} שגיאות אירעו:\n${results.errors.slice(0, 3).join('\n')}`,
          variant: "destructive",
        });
      }
      
      if (results.success === 0 && results.errors.length === 0) {
        toast({
          title: "אין נתונים",
          description: "לא נמצאו הזמנות לעיבוד בקובץ",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעיבוד הקובץ",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">הגדרות</h1>
        <p className="text-gray-600">נהל את החיבורים שלך למערכות השונות</p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platforms">פלטפורמות</TabsTrigger>
          <TabsTrigger value="shipping">משלוחים</TabsTrigger>
          <TabsTrigger value="import">יבוא הזמנות</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <WixSettings onApiConnection={handleApiConnection} />
            <ShopifySettings onApiConnection={handleApiConnection} />
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <HfdSettings />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <FileUpload onFileUpload={handleFileUpload} />
          
          <Card>
            <CardHeader>
              <CardTitle>הוראות לקובץ CSV</CardTitle>
              <CardDescription>
                הקובץ צריך להכיל את העמודות הבאות (שמות העמודות חייבים להיות באנגלית)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>עמודות חובה:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>order_number - מספר הזמנה</li>
                    </ul>
                  </div>
                  <div>
                    <strong>עמודות אופציונליות:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>customer_name - שם לקוח</li>
                      <li>customer_email - אימייל לקוח</li>
                      <li>customer_phone - טלפון לקוח</li>
                      <li>total_amount - סכום הזמנה</li>
                      <li>weight - משקל</li>
                      <li>platform - פלטפורמה (manual/wix/shopify)</li>
                      <li>order_date - תאריך הזמנה</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    <strong>טיפ:</strong> ניתן להוריד דוגמה של קובץ CSV תקין מהמערכת כדי לראות את המבנה הנדרש.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

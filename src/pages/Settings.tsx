
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HfdSettings from "@/components/settings/HfdSettings";
import WixSettings from "@/components/settings/WixSettings";
import ShopifySettings from "@/components/settings/ShopifySettings";
import FileUpload from "@/components/settings/FileUpload";
import { processOrdersFile } from "@/services/fileProcessing";
import { useToast } from "@/hooks/use-toast";
import { getHfdSettings, saveHfdSettings, getWixCredentials, saveWixCredentials } from "@/services/database";
import { startWixIntegration, completeWixIntegration, testWixConnection } from "@/utils/wixIntegration";
import { testHfdConnection, createHfdShipment } from "@/utils/hfdIntegration";
import { WixCredentials, HfdSettings as HfdSettingsType } from "@/lib/supabase";

const Settings = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  // HFD Settings state
  const [hfdSettings, setHfdSettings] = useState<Omit<HfdSettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    client_number: '',
    token: '',
    shipment_type_code: '',
    cargo_type_haloch: '',
    is_active: true
  });
  const [isTestingHfd, setIsTestingHfd] = useState(false);

  // Wix Settings state
  const [wixSettings, setWixSettings] = useState<WixCredentials>({
    user_id: '',
    site_url: '',
    app_id: '',
    api_key: '',
    refresh_token: '',
    access_token: '',
    is_connected: false
  });
  const [wixAuthCode, setWixAuthCode] = useState('');
  const [isStartingWixIntegration, setIsStartingWixIntegration] = useState(false);
  const [isCompletingWixIntegration, setIsCompletingWixIntegration] = useState(false);
  const [isTestingWix, setIsTestingWix] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [hfdData, wixData] = await Promise.all([
        getHfdSettings(),
        getWixCredentials()
      ]);

      if (hfdData) {
        setHfdSettings({
          client_number: hfdData.client_number,
          token: hfdData.token,
          shipment_type_code: hfdData.shipment_type_code,
          cargo_type_haloch: hfdData.cargo_type_haloch,
          is_active: hfdData.is_active ?? true
        });
      }

      if (wixData) {
        setWixSettings(wixData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // HFD Settings handlers
  const handleHfdSettingsChange = (field: string, value: string) => {
    setHfdSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleHfdSave = async () => {
    try {
      await saveHfdSettings(hfdSettings);
      toast({
        title: "הגדרות נשמרו",
        description: "הגדרות HFD נשמרו בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה בשמירה",
        description: "אירעה שגיאה בשמירת ההגדרות",
        variant: "destructive",
      });
    }
  };

  const handleHfdTest = async () => {
    setIsTestingHfd(true);
    try {
      const result = await testHfdConnection(hfdSettings);
      toast({
        title: result.success ? "חיבור תקין" : "שגיאה בחיבור",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "שגיאה בבדיקת חיבור",
        description: "אירעה שגיאה בבדיקת החיבור",
        variant: "destructive",
      });
    } finally {
      setIsTestingHfd(false);
    }
  };

  // Wix Settings handlers
  const handleWixUrlChange = (value: string) => {
    setWixSettings(prev => ({ ...prev, site_url: value }));
  };

  const handleStartWixIntegration = async () => {
    setIsStartingWixIntegration(true);
    try {
      const credentials = await startWixIntegration(wixSettings.site_url);
      const updatedCredentials = await saveWixCredentials(credentials);
      setWixSettings(updatedCredentials);
      
      toast({
        title: "תהליך החיבור התחיל",
        description: "כעת יש להתקין את האפליקציה בחנות Wix שלך",
      });
    } catch (error) {
      toast({
        title: "שגיאה בתחילת תהליך החיבור",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsStartingWixIntegration(false);
    }
  };

  const handleCompleteWixIntegration = async () => {
    setIsCompletingWixIntegration(true);
    try {
      const updatedCredentials = await completeWixIntegration(wixSettings, wixAuthCode);
      const savedCredentials = await saveWixCredentials(updatedCredentials);
      setWixSettings(savedCredentials);
      setWixAuthCode('');
      
      toast({
        title: "חיבור הושלם בהצלחה",
        description: "החנות מחוברת למערכת",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהשלמת החיבור",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsCompletingWixIntegration(false);
    }
  };

  const handleOpenWixAppInstall = () => {
    // Simulate receiving auth code for demo
    setWixAuthCode('demo_auth_code_' + Math.random().toString(36).substring(2, 10));
    toast({
      title: "קוד אימות התקבל",
      description: "כעת ניתן להשלים את תהליך החיבור",
    });
  };

  const handleTestWixConnection = async () => {
    setIsTestingWix(true);
    try {
      const result = await testWixConnection({
        site_url: wixSettings.site_url,
        api_key: wixSettings.api_key || '',
        refresh_token: wixSettings.refresh_token || '',
        is_connected: wixSettings.is_connected,
        app_id: wixSettings.app_id || '',
        user_id: wixSettings.user_id,
        access_token: wixSettings.access_token || ''
      });
      
      toast({
        title: result.success ? "חיבור תקין" : "שגיאה בחיבור",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "שגיאה בבדיקת חיבור",
        description: "אירעה שגיאה בבדיקת החיבור",
        variant: "destructive",
      });
    } finally {
      setIsTestingWix(false);
    }
  };

  const handleCreateShipment = async (shipmentData: any) => {
    try {
      const result = await createHfdShipment(shipmentData, hfdSettings);
      toast({
        title: "משלוח נוצר בהצלחה",
        description: `משלוח מספר ${result.shipmentNumber} נוצר`,
      });
    } catch (error) {
      toast({
        title: "שגיאה ביצירת משלוח",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    }
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
            <WixSettings 
              wixSettings={wixSettings}
              hfdSettings={hfdSettings}
              wixAuthCode={wixAuthCode}
              isStartingWixIntegration={isStartingWixIntegration}
              isCompletingWixIntegration={isCompletingWixIntegration}
              isTestingWix={isTestingWix}
              onUrlChange={handleWixUrlChange}
              onStartIntegration={handleStartWixIntegration}
              onCompleteIntegration={handleCompleteWixIntegration}
              onOpenWixAppInstall={handleOpenWixAppInstall}
              onTestConnection={handleTestWixConnection}
              onCreateShipment={handleCreateShipment}
            />
            <ShopifySettings onApiConnection={() => {}} />
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <HfdSettings 
            hfdSettings={hfdSettings}
            onSettingsChange={handleHfdSettingsChange}
            onSave={handleHfdSave}
            onTest={handleHfdTest}
            isTesting={isTestingHfd}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <FileUpload onFileUpload={handleFileUpload} />
          
          <Card>
            <CardHeader>
              <CardTitle>הוראות לקובץ CSV</CardTitle>
              <CardDescription>
                הקובץ צריך להכיל את העמודות הבאות (שמות העמודות יכולים להיות באנגלית או בעברית)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>עמודות חובה:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Order number - מספר הזמנה</li>
                    </ul>
                  </div>
                  <div>
                    <strong>עמודות אופציונליות:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Contact email - אימייל לקוח</li>
                      <li>Recipient name - שם הלקוח</li>
                      <li>Recipient phone - טלפון לקוח</li>
                      <li>Total - סכום הזמנה</li>
                      <li>Date created - תאריך הזמנה</li>
                      <li>Delivery address - כתובת משלוח</li>
                      <li>Currency - מטבע</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    <strong>טיפ:</strong> המערכת תזהה אוטומטית את העמודות הרלוונטיות מהקובץ שלך ותמפה אותן לשדות הנכונים.
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

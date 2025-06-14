
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { 
  WixCredentials as WixIntegrationCredentials, 
  startWixIntegration, 
  testWixConnection, 
  getWixAppInstallUrl,
  completeWixIntegration
} from "@/utils/wixIntegration";
import { testHfdConnection, createHfdShipment, convertOrderToHfdShipment } from "@/utils/hfdIntegration";
import { saveHfdSettings, getHfdSettings, saveWixCredentials, getWixCredentials } from "@/services/database";
import { HfdSettings as HfdSettingsType, WixCredentials } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import HfdSettings from "@/components/settings/HfdSettings";
import WixSettings from "@/components/settings/WixSettings";
import ShopifySettings from "@/components/settings/ShopifySettings";
import FileUpload from "@/components/settings/FileUpload";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [hfdSettings, setHfdSettings] = useState<Omit<HfdSettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    client_number: "",
    token: "",
    shipment_type_code: "",
    cargo_type_haloch: "",
  });

  const [wixSettings, setWixSettings] = useState<WixCredentials>({
    user_id: "",
    site_url: "",
    app_id: "",
    api_key: "",
    refresh_token: "",
    access_token: "",
    is_connected: false
  });

  const [isTestingHfd, setIsTestingHfd] = useState(false);
  const [isStartingWixIntegration, setIsStartingWixIntegration] = useState(false);
  const [isTestingWix, setIsTestingWix] = useState(false);
  const [wixAuthCode, setWixAuthCode] = useState("");
  const [isCompletingWixIntegration, setIsCompletingWixIntegration] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication and load settings
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // ProtectedRoute should handle non-authenticated users.
      // We proceed assuming user exists.
      if (user) {
        setUser(user);
        await loadSettings();
      }
    };

    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load settings from database
  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load HFD settings
      const hfdData = await getHfdSettings();
      if (hfdData) {
        setHfdSettings({
          client_number: hfdData.client_number,
          token: hfdData.token,
          shipment_type_code: hfdData.shipment_type_code,
          cargo_type_haloch: hfdData.cargo_type_haloch,
        });
      }

      // Load Wix credentials
      const wixData = await getWixCredentials();
      if (wixData) {
        setWixSettings({
          user_id: wixData.user_id,
          site_url: wixData.site_url,
          app_id: wixData.app_id || "",
          api_key: wixData.api_key || "",
          refresh_token: wixData.refresh_token || "",
          access_token: wixData.access_token || "",
          is_connected: wixData.is_connected
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "שגיאה בטעינת הגדרות",
        description: "לא ניתן לטעון את ההגדרות מבסיס הנתונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check for auth code in URL for Wix app installation callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode && wixSettings.app_id && !wixSettings.is_connected) {
      setWixAuthCode(authCode);
      // Clear URL parameters without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [wixSettings]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("Parsed CSV data:", results.data);
            toast({
              title: "קובץ CSV פוענח בהצלחה",
              description: `נמצאו ${results.data.length} רשומות.`,
            });
            // Here you can process the orders, e.g., save them to the database
          },
          error: (error: any) => {
            toast({
              title: "שגיאה בפענוח קובץ CSV",
              description: error.message,
              variant: "destructive",
            });
          }
        });
      } else if (file.type.includes('spreadsheetml') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        // Logic for excel files can be added here
        toast({
          title: "הקובץ הועלה בהצלחה",
          description: `${file.name} נקלט במערכת. עיבוד קבצי אקסל יתווסף בקרוב.`,
        });
      } else {
        toast({
          title: "סוג קובץ לא נתמך",
          description: "אנא העלה קובץ CSV, XLSX או XLS.",
          variant: "destructive",
        });
      }
    }
  };

  const handleApiConnection = (service: string) => {
    toast({
      title: "החיבור בוצע בהצלחה",
      description: `החיבור ל-${service} הושלם`,
    });
  };

  const handleHfdSettingsChange = (field: string, value: string) => {
    setHfdSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveHfdSettings = async () => {
    try {
      await saveHfdSettings(hfdSettings);
      toast({
        title: "הגדרות HFD נשמרו בהצלחה",
        description: "הגדרות חברת HFD נשמרו בבסיס הנתונים",
      });
    } catch (error) {
      console.error('Error saving HFD settings:', error);
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: "לא ניתן לשמור את הגדרות HFD",
        variant: "destructive"
      });
    }
  };

  const handleTestHfdConnection = async () => {
    setIsTestingHfd(true);
    try {
      const result = await testHfdConnection(hfdSettings);
      toast({
        title: result.success ? "בדיקת חיבור הצליחה" : "בדיקת חיבור נכשלה",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "שגיאה בבדיקת החיבור",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsTestingHfd(false);
    }
  };

  const handleWixUrlChange = (value: string) => {
    setWixSettings(prev => ({
      ...prev,
      site_url: value
    }));
  };

  const handleStartWixIntegration = async () => {
    if (!user?.id) return;
    
    setIsStartingWixIntegration(true);
    try {
      const credentials = await startWixIntegration(wixSettings.site_url);
      
      // Convert from WixIntegrationCredentials to WixCredentials format
      const dbCredentials: WixCredentials = {
        user_id: user.id,
        site_url: credentials.siteUrl,
        app_id: credentials.appId,
        api_key: credentials.apiKey,
        refresh_token: credentials.refreshToken || "",
        access_token: "", // WixIntegrationCredentials doesn't have accessToken
        is_connected: credentials.isConnected
      };
      
      setWixSettings(dbCredentials);
      
      // Save to database
      await saveWixCredentials({
        site_url: credentials.siteUrl,
        app_id: credentials.appId,
        api_key: credentials.apiKey,
        refresh_token: credentials.refreshToken,
        access_token: "", // WixIntegrationCredentials doesn't have accessToken
        is_connected: credentials.isConnected
      });
      
      toast({
        title: "תהליך אינטגרציה התחיל",
        description: "כעת יש להתקין את האפליקציה בחנות Wix שלך",
      });
    } catch (error) {
      toast({
        title: "שגיאה בתהליך האינטגרציה",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsStartingWixIntegration(false);
    }
  };

  const handleCompleteWixIntegration = async () => {
    if (!wixAuthCode || !user?.id) {
      toast({
        title: "שגיאה בהשלמת החיבור",
        description: "קוד אימות חסר, נסה להתקין את האפליקציה שוב",
        variant: "destructive",
      });
      return;
    }

    setIsCompletingWixIntegration(true);
    try {
      // Convert WixCredentials to WixIntegrationCredentials format for the integration function
      const integrationCredentials: WixIntegrationCredentials = {
        siteUrl: wixSettings.site_url,
        appId: wixSettings.app_id,
        apiKey: wixSettings.api_key,
        refreshToken: wixSettings.refresh_token,
        isConnected: wixSettings.is_connected
      };
      
      const updatedCredentials = await completeWixIntegration(integrationCredentials, wixAuthCode);
      
      // Save to database
      await saveWixCredentials({
        site_url: updatedCredentials.siteUrl,
        app_id: updatedCredentials.appId,
        api_key: updatedCredentials.apiKey,
        refresh_token: updatedCredentials.refreshToken,
        access_token: "", // WixIntegrationCredentials doesn't have accessToken
        is_connected: updatedCredentials.isConnected
      });
      
      // Convert back to WixCredentials format for state
      const dbCredentials: WixCredentials = {
        user_id: user.id,
        site_url: updatedCredentials.siteUrl,
        app_id: updatedCredentials.appId,
        api_key: updatedCredentials.apiKey,
        refresh_token: updatedCredentials.refreshToken || "",
        access_token: "", // WixIntegrationCredentials doesn't have accessToken
        is_connected: updatedCredentials.isConnected
      };
      
      setWixSettings(dbCredentials);
      toast({
        title: "חיבור Wix הושלם בהצלחה",
        description: "אפליקציית Wix מחוברת כעת למערכת",
      });
      setWixAuthCode("");
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

  const openWixAppInstall = () => {
    if (!wixSettings.app_id) return;
    
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const installUrl = getWixAppInstallUrl(wixSettings.app_id, redirectUrl);
    window.open(installUrl, '_blank');
  };

  const handleTestWixConnection = async () => {
    setIsTestingWix(true);
    try {
      // Convert to WixIntegrationCredentials format for the test function
      const integrationCredentials: WixIntegrationCredentials = {
        siteUrl: wixSettings.site_url,
        appId: wixSettings.app_id,
        apiKey: wixSettings.api_key,
        refreshToken: wixSettings.refresh_token,
        isConnected: wixSettings.is_connected
      };
      
      const result = await testWixConnection(integrationCredentials);
      toast({
        title: result.success ? "בדיקת חיבור Wix הצליחה" : "בדיקת חיבור Wix נכשלה",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "שגיאה בבדיקת החיבור",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsTestingWix(false);
    }
  };

  const handleCreateShipment = async (shipmentData: any) => {
    try {
      // Convert the order data to HFD format using the new utility function
      const hfdShipmentData = convertOrderToHfdShipment(shipmentData, hfdSettings);
      const response = await createHfdShipment(hfdShipmentData);
      toast({
        title: "משלוח נוצר בהצלחה",
        description: `מספר משלוח: ${response.shipmentNumber}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה ביצירת משלוח",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p>טוען הגדרות...</p>
        </div>
      </div>
    );
  }

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
          <div className="space-y-4">
            <HfdSettings 
              hfdSettings={hfdSettings}
              onSettingsChange={handleHfdSettingsChange}
              onSave={handleSaveHfdSettings}
              onTest={handleTestHfdConnection}
              isTesting={isTestingHfd}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>חברות משלוחים נוספות</CardTitle>
                <CardDescription>חבר את המערכת לחברות המשלוחים שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>חברת שליחויות כללית</Label>
                  <Input placeholder="מזהה API" />
                  <Input placeholder="מפתח API" type="password" />
                  <Button onClick={() => handleApiConnection("חברת שליחויות")}>
                    <Package className="mr-2 h-4 w-4" />
                    התחבר
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ecommerce">
          <div className="space-y-4">
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
              onOpenWixAppInstall={openWixAppInstall}
              onTestConnection={handleTestWixConnection}
              onCreateShipment={handleCreateShipment}
            />
            <ShopifySettings onApiConnection={handleApiConnection} />
          </div>
        </TabsContent>

        <TabsContent value="excel">
          <FileUpload onFileUpload={handleFileUpload} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

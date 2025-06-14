import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, ExternalLink, Truck, Package, Check } from "lucide-react";
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
import WixOrdersList from "@/components/WixOrdersList";
import { saveHfdSettings, getHfdSettings, saveWixCredentials, getWixCredentials } from "@/services/database";
import { HfdSettings as HfdSettingsType, WixCredentials } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

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
                    onChange={(e) => handleHfdSettingsChange('client_number', e.target.value)}
                  />
                  
                  <Label>טוקן גישה (API Token)</Label>
                  <Input 
                    placeholder="הזן את הטוקן שקיבלת מחברת HFD" 
                    type="password"
                    value={hfdSettings.token}
                    onChange={(e) => handleHfdSettingsChange('token', e.target.value)}
                  />
                  
                  <Label>קוד סוג משלוח (Shipment Type Code)</Label>
                  <Input 
                    placeholder="לדוגמה: 35" 
                    value={hfdSettings.shipment_type_code}
                    onChange={(e) => handleHfdSettingsChange('shipment_type_code', e.target.value)}
                  />
                  
                  <Label>קוד סוג מטען (Cargo Type Haloch)</Label>
                  <Input 
                    placeholder="לדוגמה: 10" 
                    value={hfdSettings.cargo_type_haloch}
                    onChange={(e) => handleHfdSettingsChange('cargo_type_haloch', e.target.value)}
                  />
                  
                  <div className="pt-4 flex items-center justify-between">
                    <Button 
                      onClick={handleSaveHfdSettings}
                      className="flex items-center"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      שמור הגדרות HFD
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleTestHfdConnection}
                      disabled={isTestingHfd || !hfdSettings.client_number || !hfdSettings.token}
                      className="flex items-center"
                    >
                      {isTestingHfd ? (
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
            <Card>
              <CardHeader>
                <CardTitle>Wix</CardTitle>
                <CardDescription>חיבור אתר Wix</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      לחיבור מערכת זו לחנות Wix שלך, יש לעבור שלושה שלבים:
                      <br />1. הזן את כתובת האתר שלך
                      <br />2. התקן את האפליקציה בחנות Wix שלך
                      <br />3. השלם את תהליך ההרשאה
                    </p>
                  </div>
                  
                  <Input 
                    placeholder="לדוגמה: mysite.wixsite.com/mystore" 
                    className="mb-4"
                    value={wixSettings.site_url}
                    onChange={(e) => handleWixUrlChange(e.target.value)}
                    disabled={!!wixSettings.app_id}
                  />
                  
                  {!wixSettings.app_id ? (
                    <>
                      <Button 
                        onClick={() => window.open('https://www.wix.com/account/sites', '_blank')}
                        variant="outline"
                        className="w-full mb-2"
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        כניסה לפאנל הניהול של Wix
                      </Button>
                      <Button 
                        onClick={handleStartWixIntegration}
                        disabled={isStartingWixIntegration || !wixSettings.site_url}
                        className="w-full"
                      >
                        {isStartingWixIntegration ? "מתחיל תהליך..." : "התחל תהליך חיבור"}
                      </Button>
                    </>
                  ) : wixSettings.is_connected ? (
                    <div className="bg-green-50 p-4 rounded-lg mb-4 flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm text-green-800">
                        החנות מחוברת בהצלחה! ניתן לטעון הזמנות ולהפוך אותן למשלוחים.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`bg-${wixAuthCode ? "yellow" : "blue"}-50 p-4 rounded-lg mb-4`}>
                        <p className="text-sm text-blue-800">
                          {wixAuthCode 
                            ? "קוד אימות התקבל! לחץ על הכפתור למטה להשלמת תהליך החיבור."
                            : "כעת יש להתקין את האפליקציה בחנות Wix שלך. לחץ על הכפתור למטה כדי לפתוח את דף ההתקנה."
                          }
                        </p>
                      </div>
                      
                      {wixAuthCode ? (
                        <Button 
                          onClick={handleCompleteWixIntegration}
                          disabled={isCompletingWixIntegration}
                          className="w-full"
                        >
                          {isCompletingWixIntegration ? "משלים חיבור..." : "השלם את תהליך החיבור"}
                        </Button>
                      ) : (
                        <Button 
                          onClick={openWixAppInstall}
                          className="w-full"
                        >
                          התקן את האפליקציה בחנות Wix שלך
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {wixSettings.is_connected && (
                    <Button 
                      onClick={handleTestWixConnection}
                      variant="outline"
                      disabled={isTestingWix}
                      className="w-full mt-4"
                    >
                      {isTestingWix ? "בודק חיבור..." : "בדוק חיבור"}
                    </Button>
                  )}
                </div>

                {wixSettings.is_connected && (
                  <div className="mt-8">
                    <WixOrdersList 
                      credentials={wixSettings}
                      hfdSettings={hfdSettings}
                      onCreateShipment={handleCreateShipment}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

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
                    onClick={() => handleApiConnection("Shopify")}
                    className="w-full"
                  >
                    התחל תהליך חיבור
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle>העלאת הזמנות מקובץ</CardTitle>
              <CardDescription>העלה קובץ CSV, XLSX או XLS עם פרטי ההזמנות</CardDescription>
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
                    <p className="text-xs text-gray-500">CSV, XLSX, XLS</p>
                  </div>
                  <input
                    id="excel-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, ExternalLink, Truck, Package, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  WixCredentials, 
  startWixIntegration, 
  testWixConnection, 
  getWixAppInstallUrl,
  completeWixIntegration
} from "@/utils/wixIntegration";
import { HfdSettings, testHfdConnection, createHfdShipment } from "@/utils/hfdIntegration";
import WixOrdersList from "@/components/WixOrdersList";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hfdSettings, setHfdSettings] = useState<HfdSettings>({
    clientNumber: "",
    token: "",
    shipmentTypeCode: "",
    cargoTypeHaloch: "",
  });

  const [wixSettings, setWixSettings] = useState<WixCredentials>({
    siteUrl: "",
    apiKey: "",
    refreshToken: "",
    isConnected: false
  });

  const [isTestingHfd, setIsTestingHfd] = useState(false);
  const [isStartingWixIntegration, setIsStartingWixIntegration] = useState(false);
  const [isTestingWix, setIsTestingWix] = useState(false);
  const [wixAuthCode, setWixAuthCode] = useState("");
  const [isCompletingWixIntegration, setIsCompletingWixIntegration] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    const savedHfdSettings = localStorage.getItem('hfd_settings');
    if (savedHfdSettings) {
      setHfdSettings(JSON.parse(savedHfdSettings));
    }
    
    const savedWixSettings = localStorage.getItem('wix_settings');
    if (savedWixSettings) {
      setWixSettings(JSON.parse(savedWixSettings));
    }
  }, []);

  // Check for auth code in URL for Wix app installation callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode && wixSettings.appId && !wixSettings.isConnected) {
      setWixAuthCode(authCode);
      // Clear URL parameters without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [wixSettings]);

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

  const handleHfdSettingsChange = (field: string, value: string) => {
    setHfdSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveHfdSettings = () => {
    // כאן ניתן להוסיף בדיקות תקינות לשדות
    localStorage.setItem('hfd_settings', JSON.stringify(hfdSettings));
    toast({
      title: "הגדרות HFD נשמרו בהצלחה",
      description: "הגדרות חברת HFD נשמרו במערכת",
    });
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
      siteUrl: value
    }));
  };

  const handleStartWixIntegration = async () => {
    setIsStartingWixIntegration(true);
    try {
      const credentials = await startWixIntegration(wixSettings.siteUrl);
      setWixSettings(credentials);
      localStorage.setItem('wix_settings', JSON.stringify(credentials));
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
    if (!wixAuthCode) {
      toast({
        title: "שגיאה בהשלמת החיבור",
        description: "קוד אימות חסר, נסה להתקין את האפליקציה שוב",
        variant: "destructive",
      });
      return;
    }

    setIsCompletingWixIntegration(true);
    try {
      const updatedCredentials = await completeWixIntegration(wixSettings, wixAuthCode);
      setWixSettings(updatedCredentials);
      localStorage.setItem('wix_settings', JSON.stringify(updatedCredentials));
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
    if (!wixSettings.appId) return;
    
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const installUrl = getWixAppInstallUrl(wixSettings.appId, redirectUrl);
    window.open(installUrl, '_blank');
  };

  const handleTestWixConnection = async () => {
    setIsTestingWix(true);
    try {
      const result = await testWixConnection(wixSettings);
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
      const response = await createHfdShipment(shipmentData, hfdSettings);
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
                    value={hfdSettings.clientNumber}
                    onChange={(e) => handleHfdSettingsChange('clientNumber', e.target.value)}
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
                    value={hfdSettings.shipmentTypeCode}
                    onChange={(e) => handleHfdSettingsChange('shipmentTypeCode', e.target.value)}
                  />
                  
                  <Label>קוד סוג מטען (Cargo Type Haloch)</Label>
                  <Input 
                    placeholder="לדוגמה: 10" 
                    value={hfdSettings.cargoTypeHaloch}
                    onChange={(e) => handleHfdSettingsChange('cargoTypeHaloch', e.target.value)}
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
                      disabled={isTestingHfd || !hfdSettings.clientNumber || !hfdSettings.token}
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
                    value={wixSettings.siteUrl}
                    onChange={(e) => handleWixUrlChange(e.target.value)}
                    disabled={!!wixSettings.appId}
                  />
                  
                  {!wixSettings.appId ? (
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
                        disabled={isStartingWixIntegration || !wixSettings.siteUrl}
                        className="w-full"
                      >
                        {isStartingWixIntegration ? "מתחיל תהליך..." : "התחל תהליך חיבור"}
                      </Button>
                    </>
                  ) : wixSettings.isConnected ? (
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
                  
                  {wixSettings.isConnected && (
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

                {wixSettings.isConnected && (
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


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Check } from "lucide-react";
import { WixCredentials, HfdSettings as HfdSettingsType } from "@/lib/supabase";
import WixOrdersList from "@/components/WixOrdersList";

interface WixSettingsProps {
  wixSettings: WixCredentials;
  hfdSettings: Omit<HfdSettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  wixAuthCode: string;
  isStartingWixIntegration: boolean;
  isCompletingWixIntegration: boolean;
  isTestingWix: boolean;
  onUrlChange: (value: string) => void;
  onStartIntegration: () => void;
  onCompleteIntegration: () => void;
  onOpenWixAppInstall: () => void;
  onTestConnection: () => void;
  onCreateShipment: (shipmentData: any) => void;
}

const WixSettings = ({
  wixSettings,
  hfdSettings,
  wixAuthCode,
  isStartingWixIntegration,
  isCompletingWixIntegration,
  isTestingWix,
  onUrlChange,
  onStartIntegration,
  onCompleteIntegration,
  onOpenWixAppInstall,
  onTestConnection,
  onCreateShipment
}: WixSettingsProps) => {
  return (
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
            onChange={(e) => onUrlChange(e.target.value)}
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
                onClick={onStartIntegration}
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
                  onClick={onCompleteIntegration}
                  disabled={isCompletingWixIntegration}
                  className="w-full"
                >
                  {isCompletingWixIntegration ? "משלים חיבור..." : "השלם את תהליך החיבור"}
                </Button>
              ) : (
                <Button 
                  onClick={onOpenWixAppInstall}
                  className="w-full"
                >
                  התקן את האפליקציה בחנות Wix שלך
                </Button>
              )}
            </div>
          )}
          
          {wixSettings.is_connected && (
            <Button 
              onClick={onTestConnection}
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
              onCreateShipment={onCreateShipment}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WixSettings;

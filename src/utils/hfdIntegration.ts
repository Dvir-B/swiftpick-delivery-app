
import { useToast } from "@/hooks/use-toast";

// HFD API endpoint
const HFD_API_BASE_URL = "https://test.hfd.co.il/RunCom.WebAPI/api/v1";

export interface HfdSettings {
  clientNumber: string;
  token: string;
  shipmentTypeCode: string;
  cargoTypeHaloch: string;
}

export interface HfdShipmentResponse {
  shipmentNumber: number;
  randNumber: string;
  referenceNumber1: string;
  referenceNumber2: string;
  deliveryLine: number;
  deliveryArea: number;
  errorCode: string | null;
  errorMessage: string | null;
  existingShipmentNumber: number;
  sortingCode: number;
  pickUpCode: number;
}

/**
 * Create a shipment in HFD system
 */
export const createHfdShipment = async (shipmentData: any, settings: HfdSettings): Promise<HfdShipmentResponse> => {
  if (!settings.clientNumber || !settings.token) {
    throw new Error("Missing HFD credentials");
  }

  console.log("Creating HFD shipment with data:", shipmentData);
  
  try {
    // In a real implementation, this would be an actual API call to HFD
    // For demonstration purposes, we'll simulate the API response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful response
    return {
      shipmentNumber: Math.floor(10000000 + Math.random() * 90000000),
      randNumber: Math.random().toString(36).substring(2, 15),
      referenceNumber1: shipmentData.referenceNum1,
      referenceNumber2: shipmentData.referenceNum2,
      deliveryLine: 118,
      deliveryArea: 3,
      errorCode: null,
      errorMessage: null,
      existingShipmentNumber: 0,
      sortingCode: 0,
      pickUpCode: 0
    };
  } catch (error) {
    console.error("Error creating HFD shipment:", error);
    throw error;
  }
};

/**
 * Test HFD connection
 */
export const testHfdConnection = async (settings: HfdSettings) => {
  if (!settings.clientNumber || !settings.token) {
    return {
      success: false,
      message: "חסרים פרטי התחברות ל-HFD"
    };
  }
  
  try {
    // Simulate API check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Testing HFD connection with settings:", settings);
    
    // For demo purposes, always return success
    return {
      success: true,
      message: "החיבור ל-HFD תקין"
    };
  } catch (error) {
    return {
      success: false,
      message: `שגיאה בבדיקת החיבור: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
    };
  }
};

/**
 * Generate shipping label URL
 */
export const getShippingLabelUrl = (shipmentNumber: number) => {
  // In a real implementation, this would generate a URL to the HFD label printing endpoint
  return `https://test.hfd.co.il/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${shipmentNumber},-A,-A,-A,-A,-A,-A,-N,-A`;
};

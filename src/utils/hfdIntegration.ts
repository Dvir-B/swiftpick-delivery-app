
import { useToast } from "@/hooks/use-toast";

// HFD API endpoint
const HFD_API_BASE_URL = "https://test.hfd.co.il/RunCom.WebAPI/api/v1";

export interface HfdSettings {
  client_number: string;
  token: string;
  shipment_type_code: string;
  cargo_type_haloch: string;
}

export interface HfdShipmentRequest {
  client_number: string;
  token: string;
  shipment_type_code: string;
  cargo_type_haloch: string;
  reference_num_1?: string;
  reference_num_2?: string;
  sender_name: string;
  sender_address: string;
  sender_city: string;
  sender_zip: string;
  sender_phone: string;
  recipient_name: string;
  recipient_address: string;
  recipient_city: string;
  recipient_zip: string;
  recipient_phone: string;
  weight?: number;
  pieces?: number;
  remarks?: string;
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
export const createHfdShipment = async (shipmentData: HfdShipmentRequest): Promise<HfdShipmentResponse> => {
  if (!shipmentData.client_number || !shipmentData.token) {
    throw new Error("Missing HFD credentials");
  }

  console.log("Creating HFD shipment with data:", shipmentData);
  
  try {
    const response = await fetch(`${HFD_API_BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shipmentData.token}`,
      },
      body: JSON.stringify(shipmentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HFD API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Map the API response to our interface
    return {
      shipmentNumber: result.shipment_number || result.shipmentNumber,
      randNumber: result.rand_number || result.randNumber || '',
      referenceNumber1: result.reference_number_1 || result.referenceNumber1 || '',
      referenceNumber2: result.reference_number_2 || result.referenceNumber2 || '',
      deliveryLine: result.delivery_line || result.deliveryLine || 0,
      deliveryArea: result.delivery_area || result.deliveryArea || 0,
      errorCode: result.error_code || result.errorCode || null,
      errorMessage: result.error_message || result.errorMessage || null,
      existingShipmentNumber: result.existing_shipment_number || result.existingShipmentNumber || 0,
      sortingCode: result.sorting_code || result.sortingCode || 0,
      pickUpCode: result.pickup_code || result.pickUpCode || 0
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
  if (!settings.client_number || !settings.token) {
    return {
      success: false,
      message: "חסרים פרטי התחברות ל-HFD"
    };
  }
  
  try {
    const response = await fetch(`${HFD_API_BASE_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.token}`,
      },
      body: JSON.stringify({
        client_number: settings.client_number,
        token: settings.token
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `שגיאה בבדיקת החיבור: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    
    if (result.success === false || result.error_code) {
      return {
        success: false,
        message: result.error_message || result.message || "שגיאה לא ידועה בבדיקת החיבור"
      };
    }
    
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
  return `https://test.hfd.co.il/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${shipmentNumber},-A,-A,-A,-A,-A,-A,-N,-A`;
};

/**
 * Convert order data to HFD shipment format
 */
export const convertOrderToHfdShipment = (orderData: any, hfdSettings: HfdSettings): HfdShipmentRequest => {
  console.log('Converting order to HFD shipment:', { orderData, hfdSettings });
  
  // Handle different order data formats (from Wix, CSV import, or manual entry)
  let recipientName = '';
  let recipientAddress = '';
  let recipientCity = '';
  let recipientZip = '';
  let recipientPhone = '';
  let orderNumber = '';
  let weight = 500; // Default weight
  
  // Handle Wix order format
  if (orderData.customerInfo) {
    recipientName = `${orderData.customerInfo.firstName || ''} ${orderData.customerInfo.lastName || ''}`.trim();
    recipientPhone = orderData.customerInfo.phone || '';
    
    if (orderData.shippingInfo?.shipmentDetails?.address) {
      const addr = orderData.shippingInfo.shipmentDetails.address;
      recipientAddress = addr.addressLine1 || '';
      recipientCity = addr.city || '';
      recipientZip = addr.postalCode || '';
    }
    
    orderNumber = orderData.number || orderData.id || '';
    weight = orderData.totals?.weight || 500;
  }
  // Handle database order format
  else {
    recipientName = orderData.customer_name || '';
    recipientPhone = orderData.customer_phone || '';
    
    if (orderData.shipping_address) {
      recipientAddress = orderData.shipping_address.address || orderData.shipping_address.addressLine1 || '';
      recipientCity = orderData.shipping_address.city || '';
      recipientZip = orderData.shipping_address.zipCode || orderData.shipping_address.postalCode || '';
    }
    
    orderNumber = orderData.order_number || orderData.external_id || '';
    weight = orderData.weight || 500;
  }

  return {
    client_number: hfdSettings.client_number,
    token: hfdSettings.token,
    shipment_type_code: hfdSettings.shipment_type_code,
    cargo_type_haloch: hfdSettings.cargo_type_haloch,
    reference_num_1: orderNumber,
    reference_num_2: orderData.external_id || orderData.id || '',
    sender_name: "החנות שלי", // This should come from business settings
    sender_address: "כתובת השולח", // This should come from business settings
    sender_city: "תל אביב", // This should come from business settings
    sender_zip: "1234567", // This should come from business settings
    sender_phone: "03-1234567", // This should come from business settings
    recipient_name: recipientName,
    recipient_address: recipientAddress,
    recipient_city: recipientCity,
    recipient_zip: recipientZip,
    recipient_phone: recipientPhone,
    weight: weight,
    pieces: 1,
    remarks: orderData.notes || orderData.remarks || ''
  };
};

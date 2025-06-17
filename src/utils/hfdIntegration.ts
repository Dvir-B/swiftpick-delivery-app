
import { supabase } from "@/integrations/supabase/client";

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

const invokeHfdProxy = async (endpoint: string, payload: any, retries: number = 3) => {
  console.log(`Invoking HFD proxy for endpoint: ${endpoint}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`HFD Integration: Attempt ${attempt}/${retries}`);
      
      const { data, error } = await supabase.functions.invoke('hfd-proxy', {
        body: { endpoint, payload },
      });

      if (error) {
        console.error('Supabase function invocation error:', error);
        throw new Error(`שגיאה בחיבור למערכת HFD: ${error.message}`);
      }

      if (data?.error) {
        console.error('HFD API error:', data.error);
        throw new Error(`שגיאה מ-HFD: ${data.error}`);
      }

      console.log('HFD proxy response:', JSON.stringify(data, null, 2));
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`HFD Integration: Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = 2000 * attempt; // 2s, 4s, 6s delays
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Create a shipment in HFD system
 */
export const createHfdShipment = async (shipmentData: HfdShipmentRequest): Promise<HfdShipmentResponse> => {
  if (!shipmentData.client_number || !shipmentData.token) {
    throw new Error("חסרים פרטי התחברות ל-HFD");
  }

  // Validate required fields
  if (!shipmentData.recipient_name || !shipmentData.recipient_address || !shipmentData.recipient_city) {
    throw new Error("חסרים פרטי נמען חובה (שם, כתובת, עיר)");
  }

  console.log("Creating HFD shipment via proxy with data:", shipmentData);
  
  try {
    const result = await invokeHfdProxy('shipments', shipmentData);

    // Handle various response formats from HFD
    if (result.errorCode || result.error_code || result.errorMessage || result.error_message) {
      const errorMessage = result.errorMessage || result.error_message || `קוד שגיאה: ${result.errorCode || result.error_code}`;
      throw new Error(errorMessage);
    }
    
    // Map the API response to our interface
    const response: HfdShipmentResponse = {
      shipmentNumber: result.shipment_number || result.shipmentNumber || 0,
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

    // Validate that we got a shipment number
    if (!response.shipmentNumber || response.shipmentNumber === 0) {
      throw new Error("לא התקבל מספר משלוח מ-HFD");
    }

    return response;
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
    const payload = {
      client_number: settings.client_number,
      token: settings.token
    };

    const result = await invokeHfdProxy('test', payload, 2); // Less retries for test
    
    if (result.success === false || result.error_code || result.errorCode) {
      return {
        success: false,
        message: result.error_message || result.errorMessage || result.message || "שגיאה לא ידועה בבדיקת החיבור"
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

export const convertOrderToHfdShipment = (orderData: any, hfdSettings: HfdSettings): HfdShipmentRequest => {
  console.log('Converting order to HFD shipment:', { orderData, hfdSettings });
  
  // Handle different order data formats
  let recipientName = '';
  let recipientAddress = '';
  let recipientCity = '';
  let recipientZip = '';
  let recipientPhone = '';
  let orderNumber = '';
  let weight = 500; // Default weight
  
  // Handle Wix order format
  if (orderData.customerInfo || orderData.buyerInfo) {
    const customerInfo = orderData.customerInfo || orderData.buyerInfo;
    recipientName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
    recipientPhone = customerInfo.phone || '';
    
    if (orderData.shippingInfo?.shipmentDetails?.address) {
      const addr = orderData.shippingInfo.shipmentDetails.address;
      recipientAddress = addr.addressLine || addr.addressLine1 || '';
      recipientCity = addr.city || '';
      recipientZip = addr.postalCode || addr.zipCode || '';
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

  // Clean up phone and zip code (remove quotes if present)
  recipientPhone = recipientPhone.replace(/"/g, '');
  recipientZip = recipientZip.replace(/"/g, '');

  // Validate required fields
  if (!recipientName) {
    throw new Error("חסר שם נמען");
  }
  if (!recipientAddress) {
    throw new Error("חסרה כתובת נמען");
  }
  if (!recipientCity) {
    throw new Error("חסרה עיר נמען");
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
    weight: Number(weight),
    pieces: 1,
    remarks: orderData.notes || orderData.remarks || `הזמנה מ-${orderData.platform || 'המערכת'}: ${orderNumber}`
  };
};

export const checkShipmentStatus = async (shipmentNumber: number, hfdSettings: HfdSettings) => {
  try {
    const payload = {
      client_number: hfdSettings.client_number,
      token: hfdSettings.token,
      shipment_number: shipmentNumber
    };

    const result = await invokeHfdProxy('shipments/status', payload);
    return result;
  } catch (error) {
    console.error('Error checking shipment status:', error);
    throw error;
  }
};

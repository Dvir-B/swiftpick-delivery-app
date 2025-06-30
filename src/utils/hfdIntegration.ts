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

const invokeHfdProxy = async (endpoint: string, payload: any, retries: number = 2) => {
  console.log(`HFD Integration: Invoking proxy for endpoint: ${endpoint}`);
  console.log('HFD Integration: Payload being sent:', JSON.stringify(payload, null, 2));

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`HFD Integration: Attempt ${attempt}/${retries}`);
      
      const startTime = Date.now();
      
      // Extract token from payload if it exists
      const { token, ...payloadWithoutToken } = payload;
      
      const { data, error } = await supabase.functions.invoke('hfd-proxy', {
        body: { 
          endpoint, 
          payload: payloadWithoutToken,
          token: token || payload.token // Support both formats
        },
      });
      const endTime = Date.now();

      console.log(`HFD Integration: Function call took ${endTime - startTime}ms`);

      if (error) {
        console.error('HFD Integration: Supabase function invocation error:', error);
        console.error('HFD Integration: Error details:', JSON.stringify(error, null, 2));
        throw new Error(`שגיאה בחיבור למערכת HFD: ${error.message}`);
      }

      console.log('HFD Integration: Raw function response:', JSON.stringify(data, null, 2));

      if (data?.error) {
        console.error('HFD Integration: HFD API error from response:', data.error);
        console.error('HFD Integration: Error details:', data.details);
        console.error('HFD Integration: Error suggestion:', data.suggestion);
        throw new Error(`שגיאה מ-HFD: ${data.error}`);
      }

      console.log('HFD Integration: Successfully received response from HFD proxy');
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`HFD Integration: Attempt ${attempt} failed:`, error.message);
      console.error('HFD Integration: Error type:', error.constructor.name);
      
      if (attempt < retries) {
        const delay = 3000 * attempt; // 3s, 6s delays
        console.log(`HFD Integration: Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('HFD Integration: All attempts failed, throwing last error');
  throw lastError;
}

/**
 * Create a shipment in HFD system
 */
export const createHfdShipment = async (shipmentData: HfdShipmentRequest): Promise<HfdShipmentResponse> => {
  console.log("HFD Integration: Starting shipment creation");
  console.log("HFD Integration: Input data:", JSON.stringify(shipmentData, null, 2));

  if (!shipmentData.client_number || !shipmentData.token) {
    throw new Error("חסרים פרטי התחברות ל-HFD");
  }

  // Validate required fields
  if (!shipmentData.recipient_name || !shipmentData.recipient_address || !shipmentData.recipient_city) {
    throw new Error("חסרים פרטי נמען חובה (שם, כתובת, עיר)");
  }

  try {
    // Convert to new API format
    const newApiPayload = {
      clientNumber: parseInt(shipmentData.client_number),
      shipmentTypeCode: parseInt(shipmentData.shipment_type_code) || 50,
      cargoTypeHaloch: parseInt(shipmentData.cargo_type_haloch) || 1,
      nameTo: shipmentData.recipient_name,
      cityName: shipmentData.recipient_city,
      streetName: shipmentData.recipient_address,
      houseNum: "1", // Default if not provided
      telFirst: shipmentData.recipient_phone,
      shipmentRemarks: shipmentData.remarks || "",
      referenceNum1: shipmentData.reference_num_1 || "",
      referenceNum2: shipmentData.reference_num_2 || "",
      productsPrice: 0,
      productPriceCurrency: "ILS",
      shipmentWeight: shipmentData.weight || 1000,
      token: shipmentData.token
    };

    const result = await invokeHfdProxy('/shipments', newApiPayload);
    console.log("HFD Integration: Received result from proxy:", JSON.stringify(result, null, 2));

    // Handle various response formats from HFD
    if (result.success === false || result.error) {
      const errorMessage = result.error || result.message || "שגיאה לא ידועה";
      console.error("HFD Integration: API returned error:", errorMessage);
      throw new Error(errorMessage);
    }
    
    // Map the API response to our interface
    const response: HfdShipmentResponse = {
      shipmentNumber: result.shipmentNumber || result.parcel_id || 0,
      randNumber: result.randNumber || result.random_code || '',
      referenceNumber1: result.referenceNum1 || result.reference_number_1 || '',
      referenceNumber2: result.referenceNum2 || result.reference_number_2 || '',
      deliveryLine: result.deliveryLine || result.delivery_line || 0,
      deliveryArea: result.deliveryArea || 0,
      errorCode: result.errorCode || result.error_code || null,
      errorMessage: result.errorMessage || result.error_message || null,
      existingShipmentNumber: result.existingShipmentNumber || result.existing_shipment_number || 0,
      sortingCode: result.sortingCode || result.sorting_code || 0,
      pickUpCode: result.pickUpCode || result.pickup_code || 0
    };

    console.log("HFD Integration: Mapped response:", JSON.stringify(response, null, 2));

    // Validate that we got a shipment number
    if (!response.shipmentNumber || response.shipmentNumber === 0) {
      console.error("HFD Integration: No shipment number received");
      throw new Error("לא התקבל מספר משלוח מ-HFD");
    }

    console.log("HFD Integration: Shipment created successfully with number:", response.shipmentNumber);
    return response;
  } catch (error) {
    console.error("HFD Integration: Error creating shipment:", error.message);
    console.error("HFD Integration: Error stack:", error.stack);
    throw error;
  }
};

/**
 * Test HFD connection
 */
export const testHfdConnection = async (settings: HfdSettings) => {
  console.log("HFD Integration: Testing connection with settings:", {
    client_number: settings.client_number,
    shipment_type_code: settings.shipment_type_code,
    cargo_type_haloch: settings.cargo_type_haloch,
    token: settings.token ? `${settings.token.substring(0, 20)}...` : 'missing'
  });

  if (!settings.client_number || !settings.token) {
    return {
      success: false,
      message: "חסרים פרטי התחברות ל-HFD"
    };
  }
  
  try {
    // Test with a minimal shipment creation request
    const testPayload = {
      clientNumber: parseInt(settings.client_number),
      shipmentTypeCode: parseInt(settings.shipment_type_code) || 50,
      cargoTypeHaloch: parseInt(settings.cargo_type_haloch) || 1,
      nameTo: "בדיקה",
      cityName: "תל אביב",
      streetName: "דיזנגוף",
      houseNum: "1",
      telFirst: "050-1234567",
      shipmentRemarks: "בדיקת חיבור - לא לשליחה",
      referenceNum1: "TEST-" + Date.now(),
      productsPrice: 0,
      productPriceCurrency: "ILS",
      shipmentWeight: 100,
      token: settings.token // Add token to payload
    };

    console.log("HFD Integration: Testing with payload:", { 
      ...testPayload,
      clientNumber: testPayload.clientNumber,
      shipmentTypeCode: testPayload.shipmentTypeCode,
      cargoTypeHaloch: testPayload.cargoTypeHaloch,
      token: testPayload.token ? `${testPayload.token.substring(0, 20)}...` : 'missing'
    });

    const result = await invokeHfdProxy('/shipments', testPayload, 1); // Single attempt for test
    console.log("HFD Integration: Test result:", JSON.stringify(result, null, 2));
    
    if (result.success === false || result.error) {
      return {
        success: false,
        message: result.error || result.message || "שגיאה לא ידועה בבדיקת החיבור"
      };
    }
    
    return {
      success: true,
      message: "החיבור ל-HFD תקין"
    };
  } catch (error) {
    console.error("HFD Integration: Test connection error:", error.message);
    return {
      success: false,
      message: error.message || "שגיאה בבדיקת החיבור"
    };
  }
};

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

    const result = await invokeHfdProxy('/shipments/status', payload);
    return result;
  } catch (error) {
    console.error('Error checking shipment status:', error);
    throw error;
  }
};

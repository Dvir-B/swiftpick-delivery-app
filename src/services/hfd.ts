import { supabase } from '@/lib/supabase';
import { createHfdShipment as createHfdShipmentOld, HfdSettings as HfdSettingsOld } from '@/utils/hfdIntegration';

export interface HFDAddress {
  nameTo: string;
  cityCode?: string;
  cityName: string;
  streetCode?: string;
  streetName: string;
  houseNum: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  telFirst: string;
  telSecond?: string;
  addressRemarks?: string;
  zipCode?: string;
}

export interface HFDOrderItem {
  itemName: string;
  itemQuantity: number;
  itemPrice?: number;
  itemWeight?: number;
}

export interface HFDShipmentData {
  clientNumber: number;
  shipmentTypeCode: number;
  cargoTypeHaloch: number;
  nameTo: string;
  cityName: string;
  streetName: string;
  houseNum: string;
  telFirst: string;
  shipmentRemarks?: string;
  referenceNum1?: string;
  email?: string;
  productsPrice?: number;
  productPriceCurrency?: string;
  shipmentWeight?: number;
  orderItems?: HFDOrderItem[];
  // Additional optional fields
  entrance?: string;
  floor?: string;
  apartment?: string;
  telSecond?: string;
  addressRemarks?: string;
  zipCode?: string;
  futureDate?: string;
  futureTime?: string;
}

export interface HFDShipmentResponse {
  success: boolean;
  shipmentNumber?: string;
  trackingNumber?: string;
  error?: string;
  details?: any;
}

export async function createHFDShipment(shipmentData: HFDShipmentData): Promise<HFDShipmentResponse> {
  try {
    // Get HFD settings from database
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      throw new Error('HFD settings not found or not configured');
    }

    // Convert to old format for compatibility
    const oldFormatData = {
      client_number: hfdSettings.client_number,
      token: hfdSettings.token,
      shipment_type_code: hfdSettings.shipment_type_code,
      cargo_type_haloch: hfdSettings.cargo_type_haloch,
      sender_name: "החנות", // Default sender name
      sender_address: "כתובת החנות", // Default sender address
      sender_city: "תל אביב", // Default sender city
      sender_zip: "00000", // Default sender zip
      sender_phone: "050-0000000", // Default sender phone
      recipient_name: shipmentData.nameTo,
      recipient_address: shipmentData.streetName,
      recipient_city: shipmentData.cityName,
      recipient_zip: shipmentData.zipCode || "00000",
      recipient_phone: shipmentData.telFirst,
      reference_num_1: shipmentData.referenceNum1,
      weight: shipmentData.shipmentWeight,
      remarks: shipmentData.shipmentRemarks
    };

    console.log('Creating HFD shipment with old format data:', JSON.stringify(oldFormatData, null, 2));

    // Use the updated function from hfdIntegration
    const result = await createHfdShipmentOld(oldFormatData);

    console.log('HFD response:', result);

    // Convert response to new format
    return {
      success: true,
      shipmentNumber: result.shipmentNumber?.toString(),
      trackingNumber: result.randNumber,
      details: result
    };

  } catch (error) {
    console.error('Error creating HFD shipment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getHFDShipmentStatus(shipmentNumber: string): Promise<any> {
  try {
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      throw new Error('HFD settings not found');
    }

    const { data, error } = await supabase.functions.invoke('hfd-proxy', {
      body: {
        endpoint: `/shipments/${shipmentNumber}`,
        payload: {},
        token: hfdSettings.token
      }
    });

    if (error) {
      throw new Error(`HFD API Error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting HFD shipment status:', error);
    throw error;
  }
} 
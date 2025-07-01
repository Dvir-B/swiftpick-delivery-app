import { supabase } from '@/lib/supabase';

export interface DeliveryRequest {
  orderData: any;
}

export interface DeliveryResponse {
  success: boolean;
  shipment?: {
    id: string;
    hfd_shipment_number: string;
    tracking_number: string;
    status: string;
  };
  message?: string;
  error?: string;
}

export interface DeliveryStatusRequest {
  shipmentNumber: string;
}

export interface DeliveryStatusResponse {
  success: boolean;
  status?: any;
  error?: string;
}

export interface DeliveryUpdateRequest {
  shipmentId: string;
  status: string;
  details?: any;
}

export interface DeliveryUpdateResponse {
  success: boolean;
  shipment?: any;
  error?: string;
}

export interface DeliveryTestResponse {
  success: boolean;
  message?: string;
  test_shipment_number?: string;
  error?: string;
}

/**
 * Create a new delivery for an order
 */
export const createDelivery = async (orderData: any): Promise<DeliveryResponse> => {
  try {
    console.log('Delivery Service: Creating HFD delivery for order:', orderData);

    console.log('Invoking hfd-create-shipment with payload:', { order_id: orderData.id });

    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    const { data, error } = await supabase.functions.invoke('hfd-create-shipment', {
      body: { order_id: orderData.id },
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }
    });

    if (error) {
      console.error('Delivery Service: Function invocation error:', error);
      throw new Error(`שגיאת API ביצירת משלוח: ${error.message}`);
    }

    console.log('Delivery Service: Function response:', data);

    if (!data.success) {
      // The function now returns a more detailed error message
      throw new Error(data.error || 'אירעה שגיאה לא ידועה ביצירת המשלוח');
    }

    // The new function returns a different structure
    return {
        success: true,
        shipment: {
            id: data.shipment.id,
            hfd_shipment_number: data.shipment.hfdShipmentNumber,
            tracking_number: data.shipment.hfdShipmentNumber, // HFD uses the same for tracking
            status: data.shipment.status,
        },
        message: data.message,
    };

  } catch (error) {
    console.error('Delivery Service: Error creating delivery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה ביצירת המשלוח'
    };
  }
};

/**
 * Get delivery status for a shipment
 */
export const getDeliveryStatus = async (shipmentNumber: string): Promise<DeliveryStatusResponse> => {
  try {
    console.log('Delivery Service: Getting status for shipment:', shipmentNumber);

    const { data, error } = await supabase.functions.invoke('delivery', {
      body: {
        action: 'status',
        data: { shipmentNumber }
      }
    });

    if (error) {
      console.error('Delivery Service: Function invocation error:', error);
      throw new Error(`Delivery API Error: ${error.message}`);
    }

    console.log('Delivery Service: Status response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data;
  } catch (error) {
    console.error('Delivery Service: Error getting delivery status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Update delivery status
 */
export const updateDeliveryStatus = async (
  shipmentId: string, 
  status: string, 
  details?: any
): Promise<DeliveryUpdateResponse> => {
  try {
    console.log('Delivery Service: Updating delivery status:', { shipmentId, status, details });

    const { data, error } = await supabase.functions.invoke('delivery', {
      body: {
        action: 'update',
        data: { shipmentId, status, details }
      }
    });

    if (error) {
      console.error('Delivery Service: Function invocation error:', error);
      throw new Error(`Delivery API Error: ${error.message}`);
    }

    console.log('Delivery Service: Update response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data;
  } catch (error) {
    console.error('Delivery Service: Error updating delivery status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Test delivery connection
 */
export const testDeliveryConnection = async (): Promise<DeliveryTestResponse> => {
  try {
    console.log('Delivery Service: Testing delivery connection');

    const { data, error } = await supabase.functions.invoke('delivery', {
      body: {
        action: 'test'
      }
    });

    if (error) {
      console.error('Delivery Service: Function invocation error:', error);
      throw new Error(`Delivery API Error: ${error.message}`);
    }

    console.log('Delivery Service: Test response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data;
  } catch (error) {
    console.error('Delivery Service: Error testing delivery connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 
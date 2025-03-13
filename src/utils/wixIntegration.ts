import { useToast } from "@/hooks/use-toast";

// Wix API endpoints
const WIX_API_BASE_URL = "https://www.wixapis.com/stores/v1";

export interface WixCredentials {
  siteUrl: string;
  apiKey: string;
  refreshToken: string;
  isConnected: boolean;
  appId?: string;
}

export interface WixOrder {
  id: string;
  number: string;
  dateCreated: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  shippingInfo: {
    deliveryOption: string;
    shipmentDetails: {
      address: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        country: string;
        postalCode: string;
      };
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  totals: {
    subtotal: number;
    total: number;
    weight: number;
  };
  status: string;
}

/**
 * Fetch orders from Wix API
 */
export const fetchWixOrders = async (credentials: WixCredentials): Promise<WixOrder[]> => {
  if (!credentials.apiKey || !credentials.refreshToken || !credentials.siteUrl) {
    throw new Error("Missing Wix API credentials");
  }

  try {
    // In a real implementation, we would make an actual API call to Wix
    // For demo purposes, we'll return mock data
    console.log("Fetching orders with credentials:", credentials);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: "12345",
        number: "10001",
        dateCreated: new Date().toISOString(),
        customerInfo: {
          email: "customer@example.com",
          firstName: "ישראל",
          lastName: "ישראלי",
          phone: "0501234567"
        },
        shippingInfo: {
          deliveryOption: "Standard",
          shipmentDetails: {
            address: {
              addressLine1: "רחוב דיזנגוף 114",
              city: "תל אביב",
              country: "IL",
              postalCode: "6120201"
            },
            firstName: "ישראל",
            lastName: "ישראלי",
            email: "customer@example.com",
            phone: "0501234567"
          }
        },
        totals: {
          subtotal: 199.99,
          total: 234.99,
          weight: 500
        },
        status: "PAID"
      },
      {
        id: "12346",
        number: "10002",
        dateCreated: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        customerInfo: {
          email: "another@example.com",
          firstName: "יעקב",
          lastName: "לוי",
          phone: "0507654321"
        },
        shippingInfo: {
          deliveryOption: "Express",
          shipmentDetails: {
            address: {
              addressLine1: "רחוב ביאליק 22",
              city: "רמת גן",
              country: "IL",
              postalCode: "5259207"
            },
            firstName: "יעקב",
            lastName: "לוי",
            email: "another@example.com",
            phone: "0507654321"
          }
        },
        totals: {
          subtotal: 349.99,
          total: 399.99,
          weight: 1200
        },
        status: "PAID"
      }
    ];
  } catch (error) {
    console.error("Error fetching Wix orders:", error);
    throw error;
  }
};

/**
 * Convert Wix order to HFD shipment format
 */
export const convertWixOrderToHfdShipment = (order: WixOrder, hfdSettings: any) => {
  const { shippingInfo, customerInfo, totals } = order;
  const { shipmentDetails } = shippingInfo;
  const { address } = shipmentDetails;
  
  // Extract street name and house number
  const addressParts = address.addressLine1.split(' ');
  const houseNum = addressParts.pop() || '';
  const streetName = addressParts.join(' ');
  
  return {
    clientNumber: hfdSettings.clientNumber,
    mesiraIsuf: "מסירה", // Delivery
    shipmentTypeCode: hfdSettings.shipmentTypeCode,
    cargoTypeHaloch: hfdSettings.cargoTypeHaloch,
    packsHaloch: "1",
    nameTo: `${shipmentDetails.firstName} ${shipmentDetails.lastName}`,
    cityName: address.city,
    streetName,
    houseNum,
    telFirst: shipmentDetails.phone,
    email: shipmentDetails.email,
    referenceNum1: order.number,
    referenceNum2: order.id,
    productsPrice: totals.total,
    productPriceCurrency: "ILS",
    shipmentWeight: totals.weight || 500, // Default to 500g if no weight provided
  };
};

/**
 * Get Wix App installation URL
 */
export const getWixAppInstallUrl = (appId: string, redirectUrl: string): string => {
  // In a real implementation, this would be the URL to install your Wix app
  const baseUrl = "https://www.wix.com/installer/install";
  return `${baseUrl}?appId=${appId}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
};

/**
 * Start the Wix integration process
 */
export const startWixIntegration = async (siteUrl: string) => {
  if (!siteUrl) {
    throw new Error("אנא הזן את כתובת האתר שלך ב-Wix");
  }
  
  // For demo purposes, we'll just simulate a successful connection
  console.log("Starting Wix integration for site:", siteUrl);
  
  // In a real implementation, the flow would be:
  // 1. Redirect to Wix app installation page
  // 2. User installs the app in their Wix account
  // 3. Wix redirects back to our app with an authorization code
  // 4. We exchange the authorization code for an access token and refresh token
  
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock credentials
  return {
    siteUrl,
    appId: "wix_app_" + Math.random().toString(36).substring(2, 10),
    apiKey: "wix_mock_api_key_" + Math.random().toString(36).substring(2, 10),
    refreshToken: "wix_mock_refresh_token_" + Math.random().toString(36).substring(2, 10),
    isConnected: false // Initially false until app is installed
  };
};

/**
 * Test the Wix connection
 */
export const testWixConnection = async (credentials: WixCredentials) => {
  try {
    const orders = await fetchWixOrders(credentials);
    return {
      success: true,
      message: `החיבור תקין. נמצאו ${orders.length} הזמנות.`,
      ordersCount: orders.length
    };
  } catch (error) {
    return {
      success: false,
      message: `שגיאה בבדיקת החיבור: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
      ordersCount: 0
    };
  }
};

/**
 * Complete the Wix integration process (after app installation)
 */
export const completeWixIntegration = async (credentials: WixCredentials, authCode: string) => {
  // In a real implementation, this would exchange the auth code for tokens
  console.log("Completing Wix integration with auth code:", authCode);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return updated credentials with isConnected=true
  return {
    ...credentials,
    isConnected: true,
    apiKey: "wix_api_key_" + Math.random().toString(36).substring(2, 10),
    refreshToken: "wix_refresh_token_" + Math.random().toString(36).substring(2, 10),
  };
};

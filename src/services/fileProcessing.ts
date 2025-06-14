import Papa from 'papaparse';
import { saveOrder } from './database';
import { Order } from '@/lib/supabase';

export interface OrderImportData {
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount?: number;
  currency?: string;
  weight?: number;
  platform: 'manual' | 'wix' | 'shopify';
  order_date?: string;
  shipping_address?: any;
}

// Column mapping for the specific CSV format provided
const COLUMN_MAPPING: Record<string, string> = {
  'Order number': 'order_number',
  'Date created': 'order_date',
  'Contact email': 'customer_email',
  'Recipient name': 'customer_name',
  'Recipient phone': 'customer_phone',
  'Total': 'total_amount',
  'Currency': 'currency',
  'Delivery address': 'delivery_address',
  'Delivery city': 'delivery_city',
  'Delivery state': 'delivery_state',
  'Delivery country': 'delivery_country',
  'Delivery zip/postal code': 'delivery_zip',
  'Billing name': 'billing_name',
  'Billing address': 'billing_address',
  'Billing city': 'billing_city',
  'Billing state': 'billing_state',
  'Billing country': 'billing_country',
  'Billing zip/postal code': 'billing_zip',
  'Payment status': 'payment_status',
  'Payment method': 'payment_method',
  'Fulfillment status': 'fulfillment_status',
  'Tracking number': 'tracking_number'
};

export const processOrdersFile = async (file: File): Promise<{ success: number; errors: string[] }> => {
  const results = { success: 0, errors: [] as string[] };

  try {
    if (file.name.endsWith('.csv')) {
      return await processCSVFile(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // For Excel files, we'll need to convert them to CSV first
      // For now, let's handle CSV and show a message for Excel files
      results.errors.push('קבצי Excel אינם נתמכים כרגע. אנא המר לקובץ CSV');
      return results;
    } else {
      results.errors.push('סוג קובץ לא נתמך. אנא השתמש בקובץ CSV');
      return results;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    results.errors.push('שגיאה בעיבוד הקובץ');
    return results;
  }
};

const processCSVFile = async (file: File): Promise<{ success: number; errors: string[] }> => {
  const results = { success: 0, errors: [] as string[] };

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        console.log('Parsed CSV data:', parseResults.data);

        for (let i = 0; i < parseResults.data.length; i++) {
          const row = parseResults.data[i] as any;
          
          try {
            // Map the row data using the column mapping
            const mappedData = mapRowData(row);
            
            // Validate required fields
            if (!mappedData.order_number) {
              results.errors.push(`שורה ${i + 1}: חסר מספר הזמנה`);
              continue;
            }

            // Build shipping address from available fields
            const shippingAddress = buildShippingAddress(mappedData);

            // Map CSV columns to order data
            const orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
              external_id: mappedData.order_number,
              order_number: mappedData.order_number,
              platform: 'manual' as const,
              customer_name: mappedData.customer_name,
              customer_email: mappedData.customer_email,
              customer_phone: mappedData.customer_phone,
              total_amount: mappedData.total_amount ? parseFloat(mappedData.total_amount.toString().replace(/[^\d.-]/g, '')) : undefined,
              currency: mappedData.currency || 'ILS',
              weight: undefined,
              status: 'pending',
              order_date: mappedData.order_date ? parseOrderDate(mappedData.order_date) : new Date().toISOString(),
              shipping_address: shippingAddress,
            };

            await saveOrder(orderData);
            results.success++;
          } catch (error) {
            console.error(`Error saving order from row ${i + 1}:`, error);
            results.errors.push(`שורה ${i + 1}: שגיאה בשמירת ההזמנה - ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
          }
        }

        resolve(results);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        results.errors.push('שגיאה בפענוח קובץ CSV');
        resolve(results);
      }
    });
  });
};

// Helper function to map row data using column mapping
const mapRowData = (row: any): any => {
  const mappedData: any = {};
  
  // Map known columns
  Object.keys(row).forEach(key => {
    const mappedKey = COLUMN_MAPPING[key];
    if (mappedKey) {
      mappedData[mappedKey] = row[key];
    }
  });
  
  // Also keep original keys for backward compatibility
  Object.keys(row).forEach(key => {
    if (!mappedData[key.toLowerCase().replace(/[^a-z0-9]/g, '_')]) {
      mappedData[key.toLowerCase().replace(/[^a-z0-9]/g, '_')] = row[key];
    }
  });
  
  return mappedData;
};

// Helper function to build shipping address from available fields
const buildShippingAddress = (data: any): any => {
  const address = {
    name: data.customer_name || data.billing_name,
    address: data.delivery_address || data.billing_address,
    city: data.delivery_city || data.billing_city,
    state: data.delivery_state || data.billing_state,
    country: data.delivery_country || data.billing_country,
    zipCode: data.delivery_zip || data.billing_zip,
  };
  
  // Only return address if at least one field is present
  if (Object.values(address).some(value => value && value.trim())) {
    return address;
  }
  
  return undefined;
};

// Helper function to parse order date
const parseOrderDate = (dateString: string): string => {
  try {
    // Try to parse the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If parsing fails, return current date
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return new Date().toISOString();
  }
};

// Helper function to validate order data
export const validateOrderData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.order_number) {
    errors.push('מספר הזמנה הוא שדה חובה');
  }

  if (data.total_amount && isNaN(parseFloat(data.total_amount))) {
    errors.push('סכום ההזמנה חייב להיות מספר');
  }

  if (data.weight && isNaN(parseFloat(data.weight))) {
    errors.push('משקל חייב להיות מספר');
  }

  if (data.platform && !['manual', 'wix', 'shopify'].includes(data.platform)) {
    errors.push('פלטפורמה חייבת להיות manual, wix או shopify');
  }

  return errors;
};

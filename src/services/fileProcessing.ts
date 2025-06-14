
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
            // Validate required fields
            if (!row.order_number) {
              results.errors.push(`שורה ${i + 1}: חסר מספר הזמנה`);
              continue;
            }

            // Map CSV columns to order data
            const orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
              external_id: row.external_id || row.order_number,
              order_number: row.order_number,
              platform: (row.platform || 'manual') as 'manual' | 'wix' | 'shopify',
              customer_name: row.customer_name || row.name,
              customer_email: row.customer_email || row.email,
              customer_phone: row.customer_phone || row.phone,
              total_amount: row.total_amount ? parseFloat(row.total_amount) : undefined,
              currency: row.currency || 'ILS',
              weight: row.weight ? parseFloat(row.weight) : undefined,
              status: 'pending',
              order_date: row.order_date ? new Date(row.order_date).toISOString() : new Date().toISOString(),
              shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : undefined,
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

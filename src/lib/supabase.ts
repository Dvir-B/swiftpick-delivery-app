export { supabase } from '@/integrations/supabase/client';

// Database types
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface HfdSettings {
  id?: string;
  user_id: string;
  client_number: string;
  token: string;
  shipment_type_code: string;
  cargo_type_haloch: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WixCredentials {
  id?: string;
  user_id: string;
  site_url: string;
  app_id?: string;
  api_key?: string;
  refresh_token?: string;
  access_token?: string;
  is_connected: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  user_id: string;
  external_id: string;
  order_number: string;
  platform: 'wix' | 'shopify' | 'manual';
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: any;
  total_amount?: number;
  currency?: string;
  weight?: number;
  status: 'pending' | 'processed' | 'shipped' | 'delivered' | 'error';
  order_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderLog {
  id?: string;
  user_id: string;
  order_id: string;
  activity_type: string;
  details?: any;
  created_at?: string;
}

export interface Shipment {
  id?: string;
  user_id: string;
  order_id: string;
  hfd_shipment_number?: string;
  tracking_number?: string;
  shipment_data?: any;
  status: 'created' | 'sent_to_hfd' | 'in_transit' | 'delivered' | 'failed';
  created_at?: string;
  updated_at?: string;
}

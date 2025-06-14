
import { supabase, HfdSettings, WixCredentials, Order, Shipment } from '@/lib/supabase';

// HFD Settings functions
export const saveHfdSettings = async (settings: Omit<HfdSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First check if settings already exist
  const { data: existing } = await supabase
    .from('hfd_settings')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (existing) {
    // Update existing settings
    const { data, error } = await supabase
      .from('hfd_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('hfd_settings')
      .insert({
        ...settings,
        user_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const getHfdSettings = async (): Promise<HfdSettings | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('hfd_settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Wix Credentials functions
export const saveWixCredentials = async (credentials: Omit<WixCredentials, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First check if credentials already exist
  const { data: existing } = await supabase
    .from('wix_credentials')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Update existing credentials
    const { data, error } = await supabase
      .from('wix_credentials')
      .update({
        ...credentials,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new credentials
    const { data, error } = await supabase
      .from('wix_credentials')
      .insert({
        ...credentials,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const getWixCredentials = async (): Promise<WixCredentials | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wix_credentials')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Orders functions with soft delete
export const saveOrder = async (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...order,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOrders = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only get non-deleted orders
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const softDeleteOrder = async (orderId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only allow deleting non-deleted orders
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const restoreOrder = async (orderId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only update non-deleted orders
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Shipments functions
export const saveShipment = async (shipment: Omit<Shipment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('shipments')
    .insert({
      ...shipment,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShipment = async (id: string, updates: Partial<Shipment>) => {
  const { data, error } = await supabase
    .from('shipments')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getShipments = async (): Promise<Shipment[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      orders!inner (
        order_number,
        customer_name,
        customer_email
      )
    `)
    .eq('user_id', user.id)
    .eq('orders.deleted_at', null) // Only get shipments for non-deleted orders
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

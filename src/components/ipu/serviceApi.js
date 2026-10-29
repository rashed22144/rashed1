import { supabase } from '@/lib/supabaseClient';

// Public service reads must go through services_public (no phone/email/whatsapp columns).
export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services_public')
    .select('*');

  if (error) {
    console.error('Failed to load services:', error);
    throw error;
  }
  return data;
};

// Writes go to the base table; RLS decides whether the current user may insert.
export const addService = async (serviceData) => {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData]);

  if (error) {
    console.error('Failed to add service:', error);
    throw error;
  }
  return data;
};

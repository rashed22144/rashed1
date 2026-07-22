import { supabase } from './supabaseClient';

// دالة لجلب كل الخدمات
export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*');
  
  if (error) {
    console.error("خطأ عند جلب الخدمات:", error);
    throw error;
  }
  return data;
};

// دالة لإضافة خدمة جديدة (ستحتاجها لاحقاً في AddService.jsx)
export const addService = async (serviceData) => {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData]);

  if (error) {
    console.error("خطأ عند إضافة الخدمة:", error);
    throw error;
  }
  return data;
};
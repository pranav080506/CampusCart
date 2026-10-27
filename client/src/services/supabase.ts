import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://wnftvqqtjjzgpuventan.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 
  env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testSupabaseClientConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error && error.code !== 'PGRST205') {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Supabase client connected successfully.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export default supabase;

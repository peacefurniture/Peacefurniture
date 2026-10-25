import { createClient } from '@supabase/supabase-js';

// Supabase configuration using standard Vite environment variables
// Replace these in your .env file with your actual Supabase URL & Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to check if Supabase is properly configured with real credentials
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('your-supabase-project-id') &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
}

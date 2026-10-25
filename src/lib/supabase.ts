import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'peace_supabase_url';
const STORAGE_KEY_ANON = 'peace_supabase_anon_key';

export function getSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !envUrl.includes('your-supabase-project-id')) {
    return envUrl;
  }
  try {
    const local = localStorage.getItem(STORAGE_KEY_URL);
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }
  return '';
}

export function getSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && !envKey.includes('your-supabase-anon-key')) {
    return envKey;
  }
  try {
    const local = localStorage.getItem(STORAGE_KEY_ANON);
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }
  return '';
}

let clientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl() || 'https://placeholder.supabase.co';
  const key = getSupabaseAnonKey() || 'placeholder-key';

  if (!clientInstance || currentClientUrl !== url || currentClientKey !== key) {
    currentClientUrl = url;
    currentClientKey = key;
    clientInstance = createClient(url, key);
  }
  return clientInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
    if (anonKey && anonKey.trim()) {
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  } catch {
    // ignore
  }
  clientInstance = null; // force recreation on next call
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return (
    Boolean(url) &&
    !url.includes('your-supabase-project-id') &&
    url.startsWith('https://') &&
    Boolean(key) &&
    !key.includes('your-supabase-anon-key') &&
    key.length > 20
  );
}

// Proxy export for backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

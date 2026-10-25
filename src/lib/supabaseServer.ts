import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseServerClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase-project-id')) {
  try {
    supabaseServerClient = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase server client successfully initialized!');
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase server client:', err);
  }
}

export function getSupabaseServerClient(): SupabaseClient | null {
  return supabaseServerClient;
}

export function isServerSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-supabase-project-id') &&
    !supabaseKey.includes('your-supabase-anon-key')
  );
}

// SQL Schema Reference for user table creation in Supabase SQL Editor:
export const SUPABASE_SQL_SCHEMA = `
-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  count INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Products / Items Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  "originalPrice" NUMERIC,
  description TEXT,
  "longDescription" TEXT,
  image TEXT,
  "additionalImages" TEXT[],
  dimensions JSONB,
  material TEXT,
  finish TEXT,
  "seatingCapacity" INTEGER,
  color TEXT,
  rating NUMERIC DEFAULT 5.0,
  "reviewsCount" INTEGER DEFAULT 0,
  "inStock" BOOLEAN DEFAULT true,
  warranty TEXT,
  "isPopular" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security Policies (Allow Public Read/Write for demo/admin)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public all access on categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public all access on products" ON products FOR ALL USING (true);
`;

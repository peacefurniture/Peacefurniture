-- ============================================================================
-- PEACE FURNITURE HOUSE: SUPABASE DATABASE & STORAGE SCHEMA
-- Run this complete script in your Supabase SQL Editor (SQL Editor -> New Query)
-- ============================================================================

-- 1. Create 'categories' table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image TEXT DEFAULT '',
    active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Create 'items' (products) table
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT DEFAULT 'other',
    price NUMERIC DEFAULT 0,
    original_price NUMERIC,
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to allow reading and writing with anon key
DROP POLICY IF EXISTS "Allow public all access on categories" ON public.categories;
CREATE POLICY "Allow public all access on categories" 
ON public.categories FOR ALL 
TO public, anon, authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on items" ON public.items;
CREATE POLICY "Allow public all access on items" 
ON public.items FOR ALL 
TO public, anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Create Storage Bucket for Furniture Images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Images', 'Images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies to allow image uploads
DROP POLICY IF EXISTS "Allow public all on Images storage bucket" ON storage.objects;
CREATE POLICY "Allow public all on Images storage bucket"
ON storage.objects FOR ALL
TO public, anon, authenticated
USING (bucket_id = 'Images')
WITH CHECK (bucket_id = 'Images');

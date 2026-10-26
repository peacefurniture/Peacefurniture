-- Supabase Schema for Furniture Store
-- Tables: categories, items
-- Rules: Soft delete (deleted_at), active (boolean), item_count (auto-updated)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  item_count INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC,
  description TEXT,
  image TEXT,
  active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AUTO-UPDATE ITEM COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE categories SET item_count = item_count + 1 WHERE id = NEW.category_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE categories SET item_count = item_count - 1 WHERE id = OLD.category_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
      IF (OLD.category_id IS NOT NULL) THEN
        UPDATE categories SET item_count = item_count - 1 WHERE id = OLD.category_id;
      END IF;
      IF (NEW.category_id IS NOT NULL) THEN
        UPDATE categories SET item_count = item_count + 1 WHERE id = NEW.category_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_category_item_count ON items;
CREATE TRIGGER trg_update_category_item_count
AFTER INSERT OR DELETE OR UPDATE OF category_id ON items
FOR EACH ROW EXECUTE FUNCTION update_category_item_count();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (deleted_at IS NULL AND active = true);
CREATE POLICY "Public Read Items" ON items FOR SELECT USING (deleted_at IS NULL AND active = true);

-- Allow authenticated write (Admin)
CREATE POLICY "Admin All Categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Items" ON items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. STORAGE BUCKET POLICIES (Run manually or via SQL Editor)
-- Note: Ensure bucket 'Images' exists first.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('Images', 'Images', true) ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'Images');
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'Images');

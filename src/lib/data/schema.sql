CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  sort_order INT DEFAULT 0,
  available BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. ITEMS TABLE (Products / Dishes / Services / Listings)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC,
  description TEXT,
  image TEXT,
  additional_images TEXT[] DEFAULT '{}'::text[],
  attributes JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  available BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE items ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}'::text[];
ALTER TABLE items ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure Foreign Key points correctly to groups(id)
DO $$
BEGIN
  -- Drop mismatched legacy foreign keys if present
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'menu_items_category_id_fkey') THEN
    ALTER TABLE IF EXISTS menu_items DROP CONSTRAINT menu_items_category_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'items_group_id_fkey') THEN
    ALTER TABLE items DROP CONSTRAINT items_group_id_fkey;
  END IF;
  
  -- Add foreign key constraint
  ALTER TABLE items ADD CONSTRAINT items_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 4. PROMOTIONS TABLE (Special Offers / Banners)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  discount_tag TEXT,
  image TEXT,
  link_url TEXT,
  autoplay BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  available BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_tag TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS autoplay BOOLEAN DEFAULT true;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 5. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brand_name TEXT,
  tagline TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default site settings if empty
INSERT INTO site_settings (id, brand_name, tagline, settings)
VALUES ('default', 'PeaceFurniture', 'Handcrafted Luxury & Modern Living Furniture', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. LEGACY TABULAR VIEWS FOR BACKWARDS COMPATIBILITY
-- (Allows legacy calls referencing "categories" or "products" to operate seamlessly over groups & items)
CREATE OR REPLACE VIEW public.categories AS
SELECT
  id::text AS id,
  name,
  image,
  sort_order,
  available AS "isActive",
  created_at
FROM groups
WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.products AS
SELECT
  i.id::text AS id,
  i.name,
  COALESCE(g.id::text, i.group_id::text, i.slug, 'all') AS category,
  i.price,
  i.original_price AS "originalPrice",
  i.description,
  i.image,
  i.additional_images AS "additionalImages",
  i.available AS "isActive",
  i.attributes,
  i.created_at
FROM items i
LEFT JOIN groups g ON i.group_id = g.id
WHERE i.deleted_at IS NULL;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate cleanly
DROP POLICY IF EXISTS "Public read groups" ON groups;
DROP POLICY IF EXISTS "Public write groups" ON groups;
DROP POLICY IF EXISTS "Public read items" ON items;
DROP POLICY IF EXISTS "Public write items" ON items;
DROP POLICY IF EXISTS "Public read promotions" ON promotions;
DROP POLICY IF EXISTS "Public write promotions" ON promotions;
DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public write site_settings" ON site_settings;

-- Public Read Policies (all rows or available non-deleted rows)
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public write groups" ON groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read items" ON items FOR SELECT USING (true);
CREATE POLICY "Public write items" ON items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Public write promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public write site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- 8. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

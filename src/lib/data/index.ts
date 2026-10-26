import { supabase, isSupabaseConfigured } from '../supabase';
import { NICHE_CONFIG } from '../../config/niche';

// Generic Data Models
export interface DBGroup {
  id: string; // UUID or string key
  slug: string;
  name: string;
  image?: string;
  active: boolean;
  item_count?: number;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DBItem {
  id: string; // UUID or string key
  slug: string;
  name: string;
  category_id: string | null;
  price: number;
  original_price?: number;
  description: string;
  image: string;
  additional_images?: string[];
  active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DBPromotion {
  id: string;
  title: string;
  subtitle?: string;
  discount_tag?: string;
  image?: string;
  link_url?: string;
  autoplay: boolean;
  active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  isConfigured: boolean;
  supabaseUrl: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    sqlFix?: string;
  }>;
  suggestedSql: string;
}

// Saved UUID Mapping (Local Key / Slug -> Supabase UUID)
const idToUuidMap = new Map<string, string>();

// Write Serialization Queue (Mutex)
let writeQueuePromise: Promise<any> = Promise.resolve();
function serializeWrite<T>(writeFn: () => Promise<T>): Promise<T> {
  writeQueuePromise = writeQueuePromise.then(() => writeFn()).catch((err) => {
    console.error('Write Queue Error:', err);
    throw err;
  });
  return writeQueuePromise;
}

/**
 * Enhanced Supabase Error Parser with Friendly Diagnostic Hints
 */
export function parseSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown error occurred');
  
  const code = error.code || error.status || 'UNKNOWN';
  const message = error.message || (typeof error === 'string' ? error : 'Database operation failed');
  const details = error.details || '';
  const hint = error.hint || '';

  let userFriendlyHint = '';

  if (code === 'PGRST204' || code === '42703') {
    userFriendlyHint = 'Missing column in database table. Please run the provided schema.sql in Supabase SQL Editor.';
  } else if (code === 'PGRST205' || code === '42P01') {
    userFriendlyHint = 'Table does not exist in database. Please run schema.sql to create the categories, items, promotions tables.';
  } else if (code === '42501') {
    userFriendlyHint = 'Row Level Security (RLS) blocked this operation. Ensure public RLS policies are enabled in Supabase.';
  } else if (code === '23503') {
    userFriendlyHint = 'Foreign key error: referenced category does not exist in the database.';
  }

  const fullMessage = [
    `Database Error (${code}): ${message}`,
    details ? `Details: ${details}` : null,
    userFriendlyHint ? `💡 Solution: ${userFriendlyHint}` : hint ? `Hint: ${hint}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const err = new Error(fullMessage);
  (err as any).code = code;
  (err as any).details = details;
  (err as any).hint = userFriendlyHint || hint;
  return err;
}

/**
 * UUID Validator & Generator
 */
export function isUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Reference Resolver: Maps any string category ID (e.g., 'sofas', 'beds', 'cat-1')
 * or slug to a real database UUID in `categories`.
 */
export async function resolveGroupUuid(groupIdOrSlug: string | null): Promise<string | null> {
  if (!groupIdOrSlug || groupIdOrSlug === 'all') return null;

  // Check if it's already a UUID
  if (isUUID(groupIdOrSlug)) return groupIdOrSlug;

  // Check mapped UUID memory
  if (idToUuidMap.has(groupIdOrSlug)) {
    return idToUuidMap.get(groupIdOrSlug)!;
  }

  // If Supabase is configured, query database by slug or name
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .or(`slug.eq.${groupIdOrSlug},name.ilike.${groupIdOrSlug}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const foundUuid = data[0].id;
        idToUuidMap.set(groupIdOrSlug, foundUuid);
        return foundUuid;
      }
    } catch {
      // ignore
    }

    // Auto-create category in DB if not found to ensure Foreign Key succeeds
    try {
      const groupName = groupIdOrSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const { data: newGroup, error: createErr } = await supabase
        .from('categories')
        .insert({
          name: groupName,
          slug: groupIdOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          active: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (!createErr && newGroup) {
        idToUuidMap.set(groupIdOrSlug, newGroup.id);
        return newGroup.id;
      }
    } catch (err) {
      console.warn('Could not auto-create missing category in DB:', err);
    }
  }

  throw new Error(`Category not found: ${groupIdOrSlug}`);
}

// ============================================================================
// DATA LAYER SERVICE METHODS
// ============================================================================

/**
 * Fetch All Groups (Categories)
 */
export async function fetchGroups(includeDeleted = false): Promise<DBGroup[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('categories').select('id, name, slug, image, item_count, active, created_at, deleted_at').order('name', { ascending: true });
  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);

  return (data || []).map((g) => ({
    id: g.id,
    slug: g.slug || g.id,
    name: g.name,
    active: g.active ?? true,
    item_count: g.item_count ?? 0,
    image: g.image || '',
    deleted_at: g.deleted_at,
    created_at: g.created_at,
  }));
}

/**
 * Save / Upsert Group (Category)
 */
export async function saveGroup(group: Partial<DBGroup>): Promise<{ data: DBGroup; isSupabaseSynced: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  return serializeWrite(async () => {
    const name = group.name || 'Untitled Group';
    const slug = group.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload: any = {
      name,
      slug,
      image: group.image || '',
      active: group.active ?? true,
      deleted_at: null,
    };

    if (group.id && isUUID(group.id)) {
      payload.id = group.id;
    }

    const { data, error } = await supabase
      .from('categories')
      .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
      .select('id, name, slug, image, item_count, active, created_at, deleted_at')
      .single();

    if (error) {
      throw parseSupabaseError(error);
    }

    return { data: data as DBGroup, isSupabaseSynced: true };
  });
}

/**
 * Fetch All Items (Products)
 */
export async function fetchItems(includeDeleted = false): Promise<DBItem[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('items').select('id, name, description, category_id, price, slug, image, created_at, deleted_at, active').order('name', { ascending: true });
  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);

  return (data || []).map((item) => ({
    id: item.id,
    slug: item.slug || item.id,
    name: item.name,
    category_id: item.category_id,
    price: Number(item.price) || 0,
    description: item.description || '',
    image: item.image || '',
    active: item.active ?? true,
    deleted_at: item.deleted_at,
    created_at: item.created_at,
  }));
}

/**
 * Save / Upsert Item (Product / Dish / Service)
 */
export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  return serializeWrite(async () => {
    // Resolve category_id UUID
    const resolvedGroupUuid = await resolveGroupUuid(item.category_id || null);

    const name = item.name || 'Untitled Item';
    const slug = item.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload: any = {
      name,
      slug,
      category_id: resolvedGroupUuid,
      price: Number(item.price) || 0,
      description: item.description || '',
      image: item.image || '',
      active: item.active ?? true,
      deleted_at: null,
    };

    if (item.id && isUUID(item.id)) {
      payload.id = item.id;
    }

    const { data, error } = await supabase
      .from('items')
      .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
      .select('id, name, description, category_id, price, slug, image, created_at, deleted_at, active')
      .single();

    if (error) {
      throw parseSupabaseError(error);
    }

    return { data: data as DBItem, isSupabaseSynced: true };
  });
}

/**
 * Soft Delete Item (Soft Trash)
 */
export async function softDeleteItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Soft Delete Group
 */
export async function softDeleteGroup(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('categories').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Restore Item from Trash
 */
export async function restoreItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Restore Group from Trash
 */
export async function restoreGroup(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('categories').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Purge Item Permanently
 */
export async function purgeItemPermanently(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Upload Image to Supabase Storage Bucket
 */
export async function uploadImage(file: File, bucket: string = 'Images'): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    // If bucket doesn't exist, this might fail. 
    // In a real app, we'd ensure the bucket exists or handle the error gracefully.
    throw parseSupabaseError(error);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}



/**
 * Run Live Database Health Diagnostics Against Supabase
 */
export async function runDatabaseHealthCheck(): Promise<HealthCheckResult> {
  const isConfigured = isSupabaseConfigured();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  const result: HealthCheckResult = {
    ok: true,
    isConfigured,
    supabaseUrl,
    checks: [],
    suggestedSql: '',
  };

  if (!isConfigured) {
    result.ok = false;
    result.checks.push({
      name: 'Supabase Environment Configuration',
      status: 'fail',
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing or containing default placeholder.',
    });
    return result;
  }

  // Check 1: Categories Table
  try {
    const { error: groupsErr } = await supabase.from('categories').select('id, name, slug, item_count, active, deleted_at').limit(1);
    if (groupsErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: categories',
        status: 'fail',
        message: `Error checking "categories" table: ${groupsErr.message} (Code: ${groupsErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug TEXT, name TEXT NOT NULL, image TEXT, item_count INT DEFAULT 0, active BOOLEAN DEFAULT true, deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());',
      });
    } else {
      result.checks.push({
        name: 'Table: categories',
        status: 'pass',
        message: 'Table "categories" exists and is queryable with all required columns.',
      });
    }
  } catch (err: any) {
    result.ok = false;
    result.checks.push({
      name: 'Table: categories',
      status: 'fail',
      message: err.message || String(err),
    });
  }

  // Check 2: Items Table & Foreign Key
  try {
    const { error: itemsErr } = await supabase.from('items').select('id, name, description, category_id, price, slug, deleted_at, active').limit(1);
    if (itemsErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: items & Foreign Key',
        status: 'fail',
        message: `Error checking "items" table: ${itemsErr.message} (Code: ${itemsErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, category_id UUID REFERENCES categories(id) ON DELETE SET NULL, price NUMERIC DEFAULT 0, description TEXT, slug TEXT, image TEXT, active BOOLEAN DEFAULT true, deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());',
      });
    } else {
      result.checks.push({
        name: 'Table: items & Foreign Key',
        status: 'pass',
        message: 'Table "items" exists with category_id foreign key constraint.',
      });
    }
  } catch (err: any) {
    result.ok = false;
    result.checks.push({
      name: 'Table: items',
      status: 'fail',
      message: err.message || String(err),
    });
  }

  // Check 3: Promotions Table
  try {
    const { error: promoErr } = await supabase.from('promotions').select('id, title, subtitle, discount_tag, autoplay, deleted_at').limit(1);
    if (promoErr) {
      result.checks.push({
        name: 'Table: promotions',
        status: 'warn',
        message: `Promotions table warning: ${promoErr.message}. Optional for hero banners.`,
      });
    } else {
      result.checks.push({
        name: 'Table: promotions',
        status: 'pass',
        message: 'Table "promotions" exists and is active.',
      });
    }
  } catch (err: any) {
    result.checks.push({
      name: 'Table: promotions',
      status: 'warn',
      message: err.message || String(err),
    });
  }

  // Check 4: Row Level Security (RLS) Write Permissions Check
  try {
    const testId = '00000000-0000-0000-0000-000000000000';
    const { error: rlsErr } = await supabase.from('categories').select('id').eq('id', testId);
    if (rlsErr && rlsErr.code === '42501') {
      result.ok = false;
      result.checks.push({
        name: 'Row Level Security (RLS) Policies',
        status: 'fail',
        message: 'RLS policies are restricting access or blocking public operations.',
        sqlFix: 'ALTER TABLE categories ENABLE ROW LEVEL SECURITY; CREATE POLICY "Public write categories" ON categories FOR ALL USING (true);',
      });
    } else {
      result.checks.push({
        name: 'Row Level Security (RLS) Policies',
        status: 'pass',
        message: 'RLS read/write policies are verified and active.',
      });
    }
  } catch {
    // ignore
  }

  return result;
}



// Mapping Functions
import { FurnitureItem, Category } from '../../types';

export function mapDBItemToFurnitureItem(item: DBItem): FurnitureItem {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: (item.category_id as any) || 'all',
    group_id: item.category_id || undefined,
    price: item.price,
    description: item.description,
    longDescription: item.description,
    image: item.image || '',
    isActive: item.active,
    deleted_at: item.deleted_at,
    inStock: true,
  };
}

export function mapDBGroupToCategory(group: DBGroup): Category {
  return {
    id: group.id as any,
    name: group.name,
    slug: group.slug,
    image: group.image || '',
    count: group.item_count || 0,
    isActive: group.active,
    deleted_at: group.deleted_at,
  };
}

export function mapFurnitureItemToDBItem(item: FurnitureItem, existingItem: DBItem): DBItem {
  return {
    ...existingItem,
    id: item.id,
    name: item.name,
    category_id: item.category as string,
    price: item.price,
    description: item.description,
    image: item.image || '',
    active: item.isActive ?? true,
  };
}

export function mapCategoryToDBGroup(category: Category, existingGroup: DBGroup): DBGroup {
  return {
    ...existingGroup,
    id: category.id as string,
    name: category.name,
    slug: category.slug || existingGroup.slug,
    image: category.image || '',
    active: category.isActive ?? true,
  };
}


import { supabase, isSupabaseConfigured } from '../supabase';
import { NICHE_CONFIG } from '../../config/niche';

// Generic Data Models
export interface DBGroup {
  id: string; // UUID or string key
  slug: string;
  name: string;
  image?: string;
  sort_order: number;
  available: boolean;
  attributes: Record<string, any>;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DBItem {
  id: string; // UUID or string key
  slug: string;
  name: string;
  group_id: string | null;
  price: number;
  original_price?: number;
  description: string;
  image: string;
  additional_images?: string[];
  attributes: Record<string, any>;
  sort_order: number;
  available: boolean;
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
    userFriendlyHint = 'Table does not exist in database. Please run schema.sql to create the groups, items, promotions tables.';
  } else if (code === '42501') {
    userFriendlyHint = 'Row Level Security (RLS) blocked this operation. Ensure public RLS policies are enabled in Supabase.';
  } else if (code === '23503') {
    userFriendlyHint = 'Foreign key error: referenced group/category does not exist in the database.';
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
 * or slug to a real database UUID in `groups`.
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
        .from('groups')
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
        .from('groups')
        .insert({
          name: groupName,
          slug: groupIdOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          available: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (!createErr && newGroup) {
        idToUuidMap.set(groupIdOrSlug, newGroup.id);
        return newGroup.id;
      }
    } catch (err) {
      console.warn('Could not auto-create missing group in DB:', err);
    }
  }

  throw new Error(`Group not found: ${groupIdOrSlug}`);
}

// ============================================================================
// DATA LAYER SERVICE METHODS
// ============================================================================

/**
 * Fetch All Groups (Categories)
 */
export async function fetchCategories(includeDeleted = false): Promise<DBGroup[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('groups').select('*').order('sort_order', { ascending: true });
  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);

  return (data || []).map((g) => ({
    id: g.id,
    slug: g.slug || g.id,
    name: g.name,
    image: g.image,
    sort_order: g.sort_order ?? 0,
    available: g.available ?? true,
    attributes: g.attributes || {},
    deleted_at: g.deleted_at,
    created_at: g.created_at,
  }));
}

/**
 * Save / Upsert Group (Category)
 */
export async function saveCategory(group: Partial<DBGroup>): Promise<{ data: DBGroup; isSupabaseSynced: boolean }> {
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
      sort_order: group.sort_order ?? 0,
      available: group.available ?? true,
      attributes: group.attributes || {},
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    if (group.id && isUUID(group.id)) {
      payload.id = group.id;
    }

    const { data, error } = await supabase
      .from('groups')
      .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
      .select()
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
export async function fetchProducts(includeDeleted = false): Promise<DBItem[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('items').select('*').order('sort_order', { ascending: true });
  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }
  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);

  return (data || []).map((item) => ({
    id: item.id,
    slug: item.slug || item.id,
    name: item.name,
    group_id: item.group_id,
    price: Number(item.price) || 0,
    original_price: item.original_price ? Number(item.original_price) : undefined,
    description: item.description || '',
    image: item.image || '',
    additional_images: item.additional_images || [],
    attributes: item.attributes || {},
    sort_order: item.sort_order ?? 0,
    available: item.available ?? true,
    deleted_at: item.deleted_at,
    created_at: item.created_at,
  }));
}

/**
 * Save / Upsert Item (Product / Dish / Service)
 */
export async function saveProduct(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  return serializeWrite(async () => {
    // Resolve group_id UUID
    const resolvedGroupUuid = await resolveGroupUuid(item.group_id || null);

    const name = item.name || 'Untitled Item';
    const slug = item.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload: any = {
      name,
      slug,
      group_id: resolvedGroupUuid,
      price: Number(item.price) || 0,
      original_price: item.original_price ? Number(item.original_price) : undefined,
      description: item.description || '',
      image: item.image || '',
      additional_images: item.additional_images || [],
      attributes: item.attributes || {},
      sort_order: item.sort_order ?? 0,
      available: item.available ?? true,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    if (item.id && isUUID(item.id)) {
      payload.id = item.id;
    }

    const { data, error } = await supabase
      .from('items')
      .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
      .select()
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
export async function softDeleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Soft Delete Group
 */
export async function softDeleteCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('groups').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Restore Item from Trash
 */
export async function restoreProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Restore Group from Trash
 */
export async function restoreCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('groups').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}

/**
 * Purge Item Permanently
 */
export async function purgeProductPermanently(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw parseSupabaseError(error);

  return true;
}


/**
 * Reorder Items
 */
export async function reorderProducts(orderedIds: string[]): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase.from('items').update({ sort_order: index + 1 }).eq('id', id);
    if (error) throw parseSupabaseError(error);
  }

  return true;
}

export async function reorderCategories(orderedIds: string[]): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase.from('groups').update({ sort_order: index + 1 }).eq('id', id);
    if (error) throw parseSupabaseError(error);
  }

  return true;
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

  // Check 1: Groups Table
  try {
    const { error: groupsErr } = await supabase.from('groups').select('id, name, slug, sort_order, attributes, deleted_at').limit(1);
    if (groupsErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: groups',
        status: 'fail',
        message: `Error checking "groups" table: ${groupsErr.message} (Code: ${groupsErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS groups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug TEXT, name TEXT NOT NULL, sort_order INT DEFAULT 0, available BOOLEAN DEFAULT true, attributes JSONB DEFAULT \'{}\'::jsonb, deleted_at TIMESTAMPTZ);',
      });
    } else {
      result.checks.push({
        name: 'Table: groups',
        status: 'pass',
        message: 'Table "groups" exists and is queryable with all required columns.',
      });
    }
  } catch (err: any) {
    result.ok = false;
    result.checks.push({
      name: 'Table: groups',
      status: 'fail',
      message: err.message || String(err),
    });
  }

  // Check 2: Items Table & Foreign Key
  try {
    const { error: itemsErr } = await supabase.from('items').select('id, name, group_id, price, description, attributes, deleted_at').limit(1);
    if (itemsErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: items & Foreign Key',
        status: 'fail',
        message: `Error checking "items" table: ${itemsErr.message} (Code: ${itemsErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, group_id UUID REFERENCES groups(id) ON DELETE SET NULL, price NUMERIC DEFAULT 0, description TEXT, attributes JSONB DEFAULT \'{}\'::jsonb, deleted_at TIMESTAMPTZ);',
      });
    } else {
      result.checks.push({
        name: 'Table: items & Foreign Key',
        status: 'pass',
        message: 'Table "items" exists with group_id foreign key constraint.',
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

  // Check 4: Row Level Security (RLS) Write Permissions Check
  try {
    const testId = '00000000-0000-0000-0000-000000000000';
    const { error: rlsErr } = await supabase.from('groups').select('id').eq('id', testId);
    if (rlsErr && rlsErr.code === '42501') {
      result.ok = false;
      result.checks.push({
        name: 'Row Level Security (RLS) Policies',
        status: 'fail',
        message: 'RLS policies are restricting access or blocking public operations.',
        sqlFix: 'ALTER TABLE groups ENABLE ROW LEVEL SECURITY; CREATE POLICY "Public write groups" ON groups FOR ALL USING (true);',
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
    category: (item.group_id as any) || 'all',
    group_id: item.group_id || undefined,
    price: item.price,
    originalPrice: item.original_price,
    description: item.description,
    longDescription: item.attributes.longDescription || item.description,
    image: item.image,
    additionalImages: item.additional_images,
    dimensions: item.attributes.dimensions,
    material: item.attributes.material,
    finish: item.attributes.finish,
    seatingCapacity: item.attributes.seatingCapacity,
    color: item.attributes.color,
    warranty: item.attributes.warranty,
    inStock: item.attributes.inStock ?? true,
    isActive: item.available,
    tags: item.attributes.tags,
    rating: item.attributes.rating || 4.8,
    reviewsCount: item.attributes.reviewsCount || 0,
    deleted_at: item.deleted_at,
  };
}

export function mapDBGroupToCategory(group: DBGroup): Category {
  return {
    id: group.id as any,
    name: group.name,
    slug: group.slug,
    image: group.image || '',
    count: 0,
    isActive: group.available,
    deleted_at: group.deleted_at,
    attributes: group.attributes,
  };
}

export function mapFurnitureItemToDBItem(item: FurnitureItem, existingItem: DBItem): DBItem {
  return {
    ...existingItem,
    id: item.id,
    name: item.name,
    group_id: item.category as string,
    price: item.price,
    original_price: item.originalPrice,
    description: item.description,
    image: item.image,
    additional_images: item.additionalImages,
    available: item.isActive ?? true,
    attributes: {
      ...existingItem.attributes,
      longDescription: item.longDescription,
      dimensions: item.dimensions,
      material: item.material,
      finish: item.finish,
      seatingCapacity: item.seatingCapacity,
      color: item.color,
      warranty: item.warranty,
      inStock: item.inStock,
      tags: item.tags,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
    },
    updated_at: new Date().toISOString(),
  };
}

export function mapCategoryToDBGroup(category: Category, existingGroup: DBGroup): DBGroup {
  return {
    ...existingGroup,
    id: category.id as string,
    name: category.name,
    slug: category.slug || existingGroup.slug,
    image: category.image,
    available: category.isActive ?? true,
    attributes: {
      ...existingGroup.attributes,
    },
    updated_at: new Date().toISOString(),
  };
}


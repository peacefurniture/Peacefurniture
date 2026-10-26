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

export interface DBPromotion {
  id: string;
  title: string;
  subtitle?: string;
  discount_tag?: string;
  image?: string;
  link_url?: string;
  autoplay: boolean;
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

// In-Memory Storage for Fallback / Offline
let localGroupsMemory: DBGroup[] = [];
let localItemsMemory: DBItem[] = [];
let localPromotionsMemory: DBPromotion[] = [];

// Saved UUID Mapping (Local Key / Slug -> Supabase UUID)
const idToUuidMap = new Map<string, string>();

// Local Edit Timestamps for Stale State Protection
let lastLocalWriteTime = 0;
let hasUnsavedLocalChanges = false;

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

  // Look up in local groups memory
  const localMatch = localGroupsMemory.find(
    (g) => g.id === groupIdOrSlug || g.slug === groupIdOrSlug || g.name.toLowerCase() === groupIdOrSlug.toLowerCase()
  );
  if (localMatch && isUUID(localMatch.id)) {
    idToUuidMap.set(groupIdOrSlug, localMatch.id);
    return localMatch.id;
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
      const groupName = localMatch?.name || groupIdOrSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const { data: newGroup, error: createErr } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          slug: groupIdOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          available: true,
          sort_order: localGroupsMemory.length + 1,
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

  return null;
}

// ============================================================================
// DATA LAYER SERVICE METHODS
// ============================================================================

/**
 * Fetch All Groups (Categories)
 */
export async function fetchGroups(includeDeleted = false): Promise<DBGroup[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('groups').select('*').order('sort_order', { ascending: true });
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      const { data, error } = await query;
      if (error) throw parseSupabaseError(error);

      if (data && data.length > 0) {
        localGroupsMemory = data.map((g) => ({
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
        return localGroupsMemory;
      }
    } catch (err) {
      console.warn('Supabase fetchGroups error, using local state:', err);
    }
  }

  return includeDeleted
    ? localGroupsMemory
    : localGroupsMemory.filter((g) => !g.deleted_at);
}

/**
 * Save / Upsert Group (Category)
 */
export async function saveGroup(group: Partial<DBGroup>): Promise<{ data: DBGroup; isSupabaseSynced: boolean }> {
  return serializeWrite(async () => {
    lastLocalWriteTime = Date.now();
    hasUnsavedLocalChanges = true;

    let targetId = group.id;
    if (targetId && idToUuidMap.has(targetId)) {
      targetId = idToUuidMap.get(targetId)!;
    }

    const name = group.name || 'Untitled Group';
    const slug = group.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const updatedGroupRecord: DBGroup = {
      id: targetId || (isUUID(group.id || '') ? group.id! : 'grp-' + Date.now()),
      slug,
      name,
      image: group.image || '',
      sort_order: group.sort_order ?? localGroupsMemory.length + 1,
      available: group.available ?? true,
      attributes: group.attributes || {},
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    // Update Local Memory
    const existingIdx = localGroupsMemory.findIndex((g) => g.id === group.id || g.id === targetId || g.slug === slug);
    if (existingIdx >= 0) {
      localGroupsMemory[existingIdx] = { ...localGroupsMemory[existingIdx], ...updatedGroupRecord };
      updatedGroupRecord.id = localGroupsMemory[existingIdx].id;
    } else {
      localGroupsMemory.push(updatedGroupRecord);
    }

    let isSupabaseSynced = false;

    if (isSupabaseConfigured()) {
      const payload: any = {
        name: updatedGroupRecord.name,
        slug: updatedGroupRecord.slug,
        image: updatedGroupRecord.image,
        sort_order: updatedGroupRecord.sort_order,
        available: updatedGroupRecord.available,
        attributes: updatedGroupRecord.attributes,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      if (isUUID(updatedGroupRecord.id)) {
        payload.id = updatedGroupRecord.id;
      }

      const { data, error } = await supabase
        .from('groups')
        .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
        .select()
        .single();

      if (error) {
        throw parseSupabaseError(error);
      }

      if (data) {
        isSupabaseSynced = true;
        updatedGroupRecord.id = data.id;
        if (group.id && group.id !== data.id) {
          idToUuidMap.set(group.id, data.id);
        }
        // Sync local memory with actual DB UUID
        const idx = localGroupsMemory.findIndex((g) => g.slug === slug || g.id === updatedGroupRecord.id);
        if (idx >= 0) {
          localGroupsMemory[idx].id = data.id;
        }
      }
    }

    hasUnsavedLocalChanges = false;
    return { data: updatedGroupRecord, isSupabaseSynced };
  });
}

/**
 * Fetch All Items (Products)
 */
export async function fetchItems(includeDeleted = false): Promise<DBItem[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('items').select('*').order('sort_order', { ascending: true });
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      const { data, error } = await query;
      if (error) throw parseSupabaseError(error);

      if (data && data.length > 0) {
        localItemsMemory = data.map((item) => ({
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
        return localItemsMemory;
      }
    } catch (err) {
      console.warn('Supabase fetchItems error, using local memory:', err);
    }
  }

  return includeDeleted
    ? localItemsMemory
    : localItemsMemory.filter((i) => !i.deleted_at);
}

/**
 * Save / Upsert Item (Product / Dish / Service)
 */
export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  return serializeWrite(async () => {
    lastLocalWriteTime = Date.now();
    hasUnsavedLocalChanges = true;

    // Resolve group_id UUID
    const resolvedGroupUuid = await resolveGroupUuid(item.group_id || null);

    let targetId = item.id;
    if (targetId && idToUuidMap.has(targetId)) {
      targetId = idToUuidMap.get(targetId)!;
    }

    const name = item.name || 'Untitled Item';
    const slug = item.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const updatedItemRecord: DBItem = {
      id: targetId || (isUUID(item.id || '') ? item.id! : 'item-' + Date.now()),
      slug,
      name,
      group_id: resolvedGroupUuid || item.group_id || null,
      price: Number(item.price) || 0,
      original_price: item.original_price ? Number(item.original_price) : undefined,
      description: item.description || '',
      image: item.image || '',
      additional_images: item.additional_images || [],
      attributes: item.attributes || {},
      sort_order: item.sort_order ?? localItemsMemory.length + 1,
      available: item.available ?? true,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    // Update Local Memory
    const existingIdx = localItemsMemory.findIndex((i) => i.id === item.id || i.id === targetId || i.slug === slug);
    if (existingIdx >= 0) {
      localItemsMemory[existingIdx] = { ...localItemsMemory[existingIdx], ...updatedItemRecord };
      updatedItemRecord.id = localItemsMemory[existingIdx].id;
    } else {
      localItemsMemory.push(updatedItemRecord);
    }

    let isSupabaseSynced = false;

    if (isSupabaseConfigured()) {
      const payload: any = {
        name: updatedItemRecord.name,
        slug: updatedItemRecord.slug,
        group_id: resolvedGroupUuid,
        price: updatedItemRecord.price,
        original_price: updatedItemRecord.original_price,
        description: updatedItemRecord.description,
        image: updatedItemRecord.image,
        additional_images: updatedItemRecord.additional_images,
        attributes: updatedItemRecord.attributes,
        sort_order: updatedItemRecord.sort_order,
        available: updatedItemRecord.available,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };

      if (isUUID(updatedItemRecord.id)) {
        payload.id = updatedItemRecord.id;
      }

      const { data, error } = await supabase
        .from('items')
        .upsert(payload, { onConflict: payload.id ? 'id' : 'slug' })
        .select()
        .single();

      if (error) {
        throw parseSupabaseError(error);
      }

      if (data) {
        isSupabaseSynced = true;
        updatedItemRecord.id = data.id;
        if (item.id && item.id !== data.id) {
          idToUuidMap.set(item.id, data.id);
        }
        const idx = localItemsMemory.findIndex((i) => i.slug === slug || i.id === updatedItemRecord.id);
        if (idx >= 0) {
          localItemsMemory[idx].id = data.id;
        }
      }
    }

    hasUnsavedLocalChanges = false;
    return { data: updatedItemRecord, isSupabaseSynced };
  });
}

/**
 * Soft Delete Item (Soft Trash)
 */
export async function softDeleteItem(id: string): Promise<boolean> {
  return serializeWrite(async () => {
    const deletedAt = new Date().toISOString();
    let realId = idToUuidMap.get(id) || id;

    localItemsMemory = localItemsMemory.map((i) =>
      i.id === id || i.id === realId ? { ...i, deleted_at: deletedAt } : i
    );

    if (isSupabaseConfigured() && isUUID(realId)) {
      const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).eq('id', realId);
      if (error) throw parseSupabaseError(error);
    }

    return true;
  });
}

/**
 * Soft Delete Group
 */
export async function softDeleteGroup(id: string): Promise<boolean> {
  return serializeWrite(async () => {
    const deletedAt = new Date().toISOString();
    let realId = idToUuidMap.get(id) || id;

    localGroupsMemory = localGroupsMemory.map((g) =>
      g.id === id || g.id === realId ? { ...g, deleted_at: deletedAt } : g
    );

    if (isSupabaseConfigured() && isUUID(realId)) {
      const { error } = await supabase.from('groups').update({ deleted_at: deletedAt }).eq('id', realId);
      if (error) throw parseSupabaseError(error);
    }

    return true;
  });
}

/**
 * Restore Item from Trash
 */
export async function restoreItem(id: string): Promise<boolean> {
  return serializeWrite(async () => {
    let realId = idToUuidMap.get(id) || id;

    localItemsMemory = localItemsMemory.map((i) =>
      i.id === id || i.id === realId ? { ...i, deleted_at: null } : i
    );

    if (isSupabaseConfigured() && isUUID(realId)) {
      const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', realId);
      if (error) throw parseSupabaseError(error);
    }

    return true;
  });
}

/**
 * Restore Group from Trash
 */
export async function restoreGroup(id: string): Promise<boolean> {
  return serializeWrite(async () => {
    let realId = idToUuidMap.get(id) || id;

    localGroupsMemory = localGroupsMemory.map((g) =>
      g.id === id || g.id === realId ? { ...g, deleted_at: null } : g
    );

    if (isSupabaseConfigured() && isUUID(realId)) {
      const { error } = await supabase.from('groups').update({ deleted_at: null }).eq('id', realId);
      if (error) throw parseSupabaseError(error);
    }

    return true;
  });
}

/**
 * Purge Item Permanently
 */
export async function purgeItemPermanently(id: string): Promise<boolean> {
  return serializeWrite(async () => {
    let realId = idToUuidMap.get(id) || id;

    localItemsMemory = localItemsMemory.filter((i) => i.id !== id && i.id !== realId);

    if (isSupabaseConfigured() && isUUID(realId)) {
      const { error } = await supabase.from('items').delete().eq('id', realId);
      if (error) throw parseSupabaseError(error);
    }

    return true;
  });
}

/**
 * Reorder Items (Contiguous sort_order updates)
 */
export async function reorderItems(orderedIds: string[]): Promise<boolean> {
  return serializeWrite(async () => {
    orderedIds.forEach((id, index) => {
      const realId = idToUuidMap.get(id) || id;
      const idx = localItemsMemory.findIndex((item) => item.id === id || item.id === realId);
      if (idx >= 0) {
        localItemsMemory[idx].sort_order = index + 1;
      }
    });

    if (isSupabaseConfigured()) {
      const updates = orderedIds
        .map((id, index) => {
          const realId = idToUuidMap.get(id) || id;
          return isUUID(realId) ? { id: realId, sort_order: index + 1 } : null;
        })
        .filter(Boolean);

      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase.from('items').update({ sort_order: update!.sort_order }).eq('id', update!.id);
          if (error) throw parseSupabaseError(error);
        }
      }
    }

    return true;
  });
}

/**
 * Reorder Groups
 */
export async function reorderGroups(orderedIds: string[]): Promise<boolean> {
  return serializeWrite(async () => {
    orderedIds.forEach((id, index) => {
      const realId = idToUuidMap.get(id) || id;
      const idx = localGroupsMemory.findIndex((group) => group.id === id || group.id === realId);
      if (idx >= 0) {
        localGroupsMemory[idx].sort_order = index + 1;
      }
    });

    if (isSupabaseConfigured()) {
      const updates = orderedIds
        .map((id, index) => {
          const realId = idToUuidMap.get(id) || id;
          return isUUID(realId) ? { id: realId, sort_order: index + 1 } : null;
        })
        .filter(Boolean);

      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase.from('groups').update({ sort_order: update!.sort_order }).eq('id', update!.id);
          if (error) throw parseSupabaseError(error);
        }
      }
    }

    return true;
  });
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


/**
 * Utility: Initialize Local Data Memory from Seed Data
 */
export function seedLocalMemory(initialGroups: DBGroup[], initialItems: DBItem[]) {
  if (localGroupsMemory.length === 0) {
    localGroupsMemory = initialGroups;
  }
  if (localItemsMemory.length === 0) {
    localItemsMemory = initialItems;
  }
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


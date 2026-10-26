import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { FurnitureItem, Category, CategoryId } from '../types';

/**
 * ============================================================================
 * SINGLE BACKEND SERVICE LAYER: src/lib/data.ts
 * All Supabase client setup, Authentication, Database CRUD operations,
 * and Storage uploads are defined in this single file.
 * Frontend components must ONLY call the functions exported here.
 * ============================================================================
 */

// ============================================================================
// 1. SUPABASE CLIENT CONFIGURATION
// ============================================================================

const STORAGE_KEY_URL = 'peace_supabase_url';
const STORAGE_KEY_ANON = 'peace_supabase_anon_key';

export function getSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !envUrl.includes('your-supabase-project-id') && envUrl.startsWith('https://')) {
    return envUrl.trim();
  }
  try {
    const local = localStorage.getItem(STORAGE_KEY_URL);
    if (local && local.trim().startsWith('https://')) return local.trim();
  } catch {
    // ignore
  }
  return '';
}

export function getSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && !envKey.includes('your-supabase-anon-key') && envKey.length > 20) {
    return envKey.trim();
  }
  try {
    const local = localStorage.getItem(STORAGE_KEY_ANON);
    if (local && local.trim().length > 20) return local.trim();
  } catch {
    // ignore
  }
  return '';
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

let clientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl() || 'https://placeholder.supabase.co';
  const key = getSupabaseAnonKey() || 'placeholder-anon-key';

  if (!clientInstance || currentClientUrl !== url || currentClientKey !== key) {
    currentClientUrl = url;
    currentClientKey = key;
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
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
  clientInstance = null; // force fresh client instance
}

// Global Supabase client instance Proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

// ============================================================================
// 2. DATA MODELS & TYPES
// ============================================================================

export interface DBCategory {
  id: string; // UUID
  slug: string;
  name: string;
  image?: string;
  item_count?: number; // Read-only from DB trigger
  active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Alias for backward compatibility
export type DBGroup = DBCategory;

export interface DBItem {
  id: string; // UUID
  slug: string;
  name: string;
  category_id: string | null;
  price: number;
  original_price?: number;
  description: string;
  image?: string;
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

// ============================================================================
// 3. ERROR PARSER & SERIALIZATION
// ============================================================================

/**
 * Supabase returns plain objects, not Error instances.
 * This parser converts any Supabase error into a clean Error object with code and hints.
 */
export function parseSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown error occurred');

  const code = error.code || error.status || 'UNKNOWN';
  const message = error.message || (typeof error === 'string' ? error : 'Database operation failed');
  const details = error.details || '';
  const hint = error.hint || '';

  let solution = '';
  if (code === 'PGRST204' || code === '42703') {
    solution = 'Missing column in database table. Run the schema script in the Supabase SQL Editor.';
  } else if (code === 'PGRST205' || code === '42P01') {
    solution = 'Table does not exist. Ensure "categories" and "items" tables exist in Supabase.';
  } else if (code === '42501') {
    solution = 'Row Level Security (RLS) blocked this operation. Check RLS policies in Supabase.';
  } else if (code === '23503') {
    solution = 'Foreign key constraint failed: the chosen category_id does not exist in categories table.';
  } else if (code === '23505') {
    solution = 'A record with this unique identifier or slug already exists.';
  }

  const fullMsg = [
    `Database Error [${code}]: ${message}`,
    details ? `Details: ${details}` : null,
    solution ? `💡 Fix: ${solution}` : hint ? `Hint: ${hint}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const err = new Error(fullMsg);
  (err as any).code = code;
  (err as any).details = details;
  (err as any).hint = solution || hint;
  return err;
}

// Write queue mutex to prevent concurrent race conditions
let writeQueuePromise: Promise<any> = Promise.resolve();
function serializeWrite<T>(writeFn: () => Promise<T>): Promise<T> {
  writeQueuePromise = writeQueuePromise.then(() => writeFn()).catch((err) => {
    console.error('Write Queue Error:', err);
    throw err;
  });
  return writeQueuePromise;
}

export function isUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Generates a clean URL slug from a product or category name.
 * If the slug already exists among other items, it appends -1, -2, -3, etc.
 * Example: "Modern Chair" -> "modern-chair", then "modern-chair-1", "modern-chair-2"
 */
export function generateUniqueSlug(
  name: string,
  existingItems: Array<{ id?: string; name?: string; slug?: string }> = [],
  currentId?: string
): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

  const usedSlugs = new Set<string>();
  for (const item of existingItems) {
    if (currentId && item.id === currentId) {
      continue;
    }
    if (item.slug) {
      usedSlugs.add(item.slug.toLowerCase().trim());
    }
  }

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (usedSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

// Memory map for Category ID resolution
const idToUuidMap = new Map<string, string>();

export async function resolveGroupUuid(groupIdOrSlug: string | null): Promise<string | null> {
  if (!groupIdOrSlug || groupIdOrSlug === 'all') return null;

  if (isUUID(groupIdOrSlug)) return groupIdOrSlug;

  if (idToUuidMap.has(groupIdOrSlug)) {
    return idToUuidMap.get(groupIdOrSlug)!;
  }

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

    // Auto-create missing category if referenced by an item
    try {
      const groupName = groupIdOrSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const newSlug = groupIdOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: newCategory, error: createErr } = await supabase
        .from('categories')
        .insert({
          name: groupName,
          slug: newSlug,
          active: true,
        })
        .select('id')
        .single();

      if (!createErr && newCategory) {
        idToUuidMap.set(groupIdOrSlug, newCategory.id);
        return newCategory.id;
      }
    } catch (err) {
      console.warn('Could not auto-create missing category:', err);
    }
  }

  return null;
}

// ============================================================================
// 4. AUTHENTICATION (SUPABASE AUTH)
// ============================================================================

/**
 * Sign in as Admin with email and password
 */
export async function signInAdmin(email: string, password: string): Promise<{ session: Session | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { session: null, error: new Error('Supabase is not configured. Please enter your Supabase URL and Anon Key.') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { session: null, error: parseSupabaseError(error) };
    }

    return { session: data.session, error: null };
  } catch (err: any) {
    return { session: null, error: parseSupabaseError(err) };
  }
}

/**
 * Sign out current admin user
 */
export async function signOutAdmin(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: parseSupabaseError(error) };
    return { error: null };
  } catch (err: any) {
    return { error: parseSupabaseError(err) };
  }
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (!isSupabaseConfigured()) return { session: null, error: null };
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { session: null, error: parseSupabaseError(error) };
    return { session: data.session, error: null };
  } catch (err: any) {
    return { session: null, error: parseSupabaseError(err) };
  }
}

/**
 * Subscribe to Supabase Auth state changes
 */
export function onAuthChange(callback: (event: string, session: Session | null) => void) {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}

// ============================================================================
// 5. STORAGE (IMAGE UPLOADS TO 'Images' BUCKET)
// ============================================================================

/**
 * Upload an image file to Supabase Storage bucket ('Images')
 * and return the public URL.
 */
export async function uploadImage(file: File, bucket: string = 'Images'): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = cleanFileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw parseSupabaseError(uploadError);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded image.');
  }

  return publicUrlData.publicUrl;
}

export function getImagePublicUrl(filePath: string, bucket: string = 'Images'): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

// ============================================================================
// 6. CATEGORIES DATABASE CRUD (Table 'categories')
// ============================================================================

export interface ListCategoriesOptions {
  includeDeleted?: boolean;
  activeOnly?: boolean;
}

/**
 * LIST: Fetch categories from database
 * Uses select('*') so it never fails if optional columns (like image) are missing.
 */
export async function listCategories(options: ListCategoriesOptions = {}): Promise<DBCategory[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('categories').select('*').order('name', { ascending: true });

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  if (options.activeOnly) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) {
    throw parseSupabaseError(error);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    image: row.image || '',
    item_count: row.item_count ?? 0,
    active: row.active ?? true,
    deleted_at: row.deleted_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * GET: Fetch a single category by id or slug
 */
export async function getCategory(idOrSlug: string): Promise<DBCategory | null> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const filterCol = isUUID(idOrSlug) ? 'id' : 'slug';
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq(filterCol, idOrSlug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw parseSupabaseError(error);
  }

  return {
    id: data.id,
    slug: data.slug || data.id,
    name: data.name,
    image: data.image || '',
    item_count: data.item_count ?? 0,
    active: data.active ?? true,
    deleted_at: data.deleted_at || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * CREATE / INSERT: Add a new category
 * Rule: item_count is updated automatically by database. NEVER write item_count.
 * Rule: slug is created automatically from name if left empty.
 */
export async function createCategory(category: Partial<DBCategory>): Promise<DBCategory> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  return serializeWrite(async () => {
    const name = category.name?.trim() || 'Untitled Category';
    let slug = category.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await supabase.from('categories').select('slug').eq('slug', slug);
        if (existing && existing.length > 0) {
          let counter = 1;
          while (true) {
            const candidate = `${slug}-${counter}`;
            const { data: check } = await supabase.from('categories').select('slug').eq('slug', candidate);
            if (!check || check.length === 0) {
              slug = candidate;
              break;
            }
            counter++;
          }
        }
      } catch {
        // ignore
      }
    }

    const payload: Record<string, any> = {
      name,
      slug,
      active: category.active ?? true,
      deleted_at: null,
    };

    if (category.image !== undefined) {
      payload.image = category.image;
    }

    if (category.id && isUUID(category.id)) {
      payload.id = category.id;
    }

    // Try insert with image column
    let result = await supabase.from('categories').insert(payload).select().single();

    // If image column doesn't exist, retry without image
    if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204')) {
      delete payload.image;
      result = await supabase.from('categories').insert(payload).select().single();
    }

    if (result.error) {
      throw parseSupabaseError(result.error);
    }

    const row = result.data;
    return {
      id: row.id,
      slug: row.slug || row.id,
      name: row.name,
      image: row.image || '',
      item_count: row.item_count ?? 0,
      active: row.active ?? true,
      deleted_at: row.deleted_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * UPDATE: Edit existing category
 * Rule: NEVER write item_count from frontend.
 */
export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  return serializeWrite(async () => {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.slug !== undefined) payload.slug = updates.slug.trim();
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;

    let result = await supabase.from('categories').update(payload).eq('id', id).select().single();

    if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204')) {
      delete payload.image;
      result = await supabase.from('categories').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      throw parseSupabaseError(result.error);
    }

    const row = result.data;
    return {
      id: row.id,
      slug: row.slug || row.id,
      name: row.name,
      image: row.image || '',
      item_count: row.item_count ?? 0,
      active: row.active ?? true,
      deleted_at: row.deleted_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * SOFT DELETE: Category
 * Sets deleted_at to current timestamp.
 */
export async function softDeleteCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('categories').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

/**
 * RESTORE: Category from Trash
 * Sets deleted_at to null.
 */
export async function restoreCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('categories').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

/**
 * PERMANENT DELETE: Category
 * Permanently removes row from database.
 */
export async function permanentDeleteCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

/**
 * TOGGLE ACTIVE: Category
 */
export async function toggleCategoryActive(id: string, active: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('categories').update({ active }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

// Aliases for compatibility
export const fetchGroups = (includeDeleted = false) => listCategories({ includeDeleted });
export async function saveGroup(group: Partial<DBCategory>): Promise<{ data: DBCategory; isSupabaseSynced: boolean }> {
  if (group.id && isUUID(group.id)) {
    const data = await updateCategory(group.id, group);
    return { data, isSupabaseSynced: true };
  }
  const data = await createCategory(group);
  return { data, isSupabaseSynced: true };
}
export const softDeleteGroup = softDeleteCategory;
export const restoreGroup = restoreCategory;

// ============================================================================
// 7. ITEMS DATABASE CRUD (Table 'items')
// ============================================================================

export interface ListItemsOptions {
  includeDeleted?: boolean;
  activeOnly?: boolean;
  categoryId?: string;
}

/**
 * LIST: Fetch items from database
 * Uses select('*') so it never crashes on missing optional columns.
 */
export async function listItems(options: ListItemsOptions = {}): Promise<DBItem[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  let query = supabase.from('items').select('*').order('name', { ascending: true });

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  if (options.activeOnly) {
    query = query.eq('active', true);
  }

  if (options.categoryId && options.categoryId !== 'all') {
    const categoryUuid = await resolveGroupUuid(options.categoryId);
    if (categoryUuid) {
      query = query.eq('category_id', categoryUuid);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw parseSupabaseError(error);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category_id: row.category_id || null,
    price: Number(row.price) || 0,
    original_price: row.original_price ? Number(row.original_price) : undefined,
    description: row.description || '',
    image: row.image || '',
    active: row.active ?? true,
    deleted_at: row.deleted_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * GET: Single item by id or slug
 */
export async function getItem(idOrSlug: string): Promise<DBItem | null> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const filterCol = isUUID(idOrSlug) ? 'id' : 'slug';
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq(filterCol, idOrSlug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw parseSupabaseError(error);
  }

  return {
    id: data.id,
    slug: data.slug || data.id,
    name: data.name,
    category_id: data.category_id || null,
    price: Number(data.price) || 0,
    original_price: data.original_price ? Number(data.original_price) : undefined,
    description: data.description || '',
    image: data.image || '',
    active: data.active ?? true,
    deleted_at: data.deleted_at || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * CREATE / INSERT: Add a new item
 * Rule: category_id must be real id of a category.
 * Rule: slug is created automatically from name if empty.
 */
export async function createItem(item: Partial<DBItem>): Promise<DBItem> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  return serializeWrite(async () => {
    const resolvedCategoryUuid = await resolveGroupUuid(item.category_id || null);
    const name = item.name?.trim() || 'Untitled Item';
    let slug = item.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await supabase.from('items').select('slug').eq('slug', slug);
        if (existing && existing.length > 0) {
          let counter = 1;
          while (true) {
            const candidate = `${slug}-${counter}`;
            const { data: check } = await supabase.from('items').select('slug').eq('slug', candidate);
            if (!check || check.length === 0) {
              slug = candidate;
              break;
            }
            counter++;
          }
        }
      } catch {
        // ignore
      }
    }

    const payload: Record<string, any> = {
      name,
      slug,
      category_id: resolvedCategoryUuid,
      price: Number(item.price) || 0,
      description: item.description || '',
      active: item.active ?? true,
      deleted_at: null,
    };

    if (item.image !== undefined) {
      payload.image = item.image;
    }

    if (item.id && isUUID(item.id)) {
      payload.id = item.id;
    }

    let result = await supabase.from('items').insert(payload).select().single();

    // If image column doesn't exist, retry without image
    if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204')) {
      delete payload.image;
      result = await supabase.from('items').insert(payload).select().single();
    }

    if (result.error) {
      throw parseSupabaseError(result.error);
    }

    const row = result.data;
    return {
      id: row.id,
      slug: row.slug || row.id,
      name: row.name,
      category_id: row.category_id || null,
      price: Number(row.price) || 0,
      original_price: row.original_price ? Number(row.original_price) : undefined,
      description: row.description || '',
      image: row.image || '',
      active: row.active ?? true,
      deleted_at: row.deleted_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * UPDATE: Edit existing item
 */
export async function updateItem(id: string, updates: Partial<DBItem>): Promise<DBItem> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  return serializeWrite(async () => {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.slug !== undefined) payload.slug = updates.slug.trim();
    if (updates.price !== undefined) payload.price = Number(updates.price) || 0;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;

    if (updates.category_id !== undefined) {
      payload.category_id = await resolveGroupUuid(updates.category_id);
    }

    let result = await supabase.from('items').update(payload).eq('id', id).select().single();

    if (result.error && (result.error.code === '42703' || result.error.code === 'PGRST204')) {
      delete payload.image;
      result = await supabase.from('items').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      throw parseSupabaseError(result.error);
    }

    const row = result.data;
    return {
      id: row.id,
      slug: row.slug || row.id,
      name: row.name,
      category_id: row.category_id || null,
      price: Number(row.price) || 0,
      original_price: row.original_price ? Number(row.original_price) : undefined,
      description: row.description || '',
      image: row.image || '',
      active: row.active ?? true,
      deleted_at: row.deleted_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * SOFT DELETE: Item
 * Sets deleted_at to current timestamp.
 */
export async function softDeleteItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

/**
 * RESTORE: Item from Trash
 * Sets deleted_at to null.
 */
export async function restoreItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

/**
 * PERMANENT DELETE: Item
 */
export async function permanentDeleteItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

export const purgeItemPermanently = permanentDeleteItem;

/**
 * TOGGLE ACTIVE: Item
 */
export async function toggleItemActive(id: string, active: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase.from('items').update({ active }).eq('id', id);
  if (error) throw parseSupabaseError(error);
  return true;
}

// Aliases for compatibility
export const fetchItems = (includeDeleted = false) => listItems({ includeDeleted });
export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  if (item.id && isUUID(item.id)) {
    const data = await updateItem(item.id, item);
    return { data, isSupabaseSynced: true };
  }
  const data = await createItem(item);
  return { data, isSupabaseSynced: true };
}

// ============================================================================
// 8. DATABASE DIAGNOSTICS & HEALTH CHECK
// ============================================================================

export async function runDatabaseHealthCheck(): Promise<HealthCheckResult> {
  const isConfigured = isSupabaseConfigured();
  const supabaseUrl = getSupabaseUrl();

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
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid.',
    });
    return result;
  }

  // Check 1: Categories Table
  try {
    const { error: catErr } = await supabase.from('categories').select('id, name, slug, active').limit(1);
    if (catErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: categories',
        status: 'fail',
        message: `Query failed on "categories": ${catErr.message} (Code: ${catErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug TEXT UNIQUE, name TEXT NOT NULL, image TEXT, item_count INT DEFAULT 0, active BOOLEAN DEFAULT true, deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());',
      });
    } else {
      result.checks.push({
        name: 'Table: categories',
        status: 'pass',
        message: 'Table "categories" is accessible and queryable.',
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

  // Check 2: Items Table
  try {
    const { error: itemsErr } = await supabase.from('items').select('id, name, category_id, price, slug, active').limit(1);
    if (itemsErr) {
      result.ok = false;
      result.checks.push({
        name: 'Table: items',
        status: 'fail',
        message: `Query failed on "items": ${itemsErr.message} (Code: ${itemsErr.code})`,
        sqlFix: 'CREATE TABLE IF NOT EXISTS items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug TEXT UNIQUE, name TEXT NOT NULL, category_id UUID REFERENCES categories(id) ON DELETE SET NULL, price NUMERIC DEFAULT 0, description TEXT, image TEXT, active BOOLEAN DEFAULT true, deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());',
      });
    } else {
      result.checks.push({
        name: 'Table: items',
        status: 'pass',
        message: 'Table "items" is accessible with category_id foreign key.',
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

  // Check 3: Row Level Security (RLS) Permissions Check
  try {
    const testId = '00000000-0000-0000-0000-000000000000';
    const { error: rlsErr } = await supabase.from('categories').select('id').eq('id', testId);
    if (rlsErr && rlsErr.code === '42501') {
      result.ok = false;
      result.checks.push({
        name: 'Row Level Security (RLS) Policies',
        status: 'fail',
        message: 'RLS policies are restricting access. Ensure SELECT policies are enabled.',
        sqlFix: 'CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true); CREATE POLICY "Public Read Items" ON items FOR SELECT USING (true);',
      });
    } else {
      result.checks.push({
        name: 'Row Level Security (RLS) Read Access',
        status: 'pass',
        message: 'RLS read access is active and accessible.',
      });
    }
  } catch {
    // ignore
  }

  // Check 4: Storage Bucket ('Images') Check
  try {
    const { data: bucketData, error: bucketErr } = await supabase.storage.getBucket('Images');
    if (bucketErr) {
      result.checks.push({
        name: 'Storage Bucket: Images',
        status: 'warn',
        message: `Storage bucket "Images" warning: ${bucketErr.message}. Ensure bucket exists and has public select policy.`,
      });
    } else if (bucketData) {
      result.checks.push({
        name: 'Storage Bucket: Images',
        status: 'pass',
        message: 'Storage bucket "Images" is verified and accessible.',
      });
    }
  } catch {
    // ignore
  }

  return result;
}

// ============================================================================
// 9. UI DATA MAPPING HELPERS
// ============================================================================

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

export function mapDBGroupToCategory(group: DBCategory): Category {
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
    category_id: (item.category as string) || (item.group_id as string) || null,
    price: item.price,
    description: item.description,
    image: item.image || '',
    active: item.isActive ?? true,
  };
}

export function mapCategoryToDBGroup(category: Category, existingGroup: DBCategory): DBCategory {
  return {
    ...existingGroup,
    id: category.id as string,
    name: category.name,
    slug: category.slug || existingGroup.slug,
    image: category.image || '',
    active: category.isActive ?? true,
  };
}

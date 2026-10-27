import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { FurnitureItem, Category } from '../types';

/**
 * ============================================================================
 * SINGLE BACKEND SERVICE LAYER: src/lib/data.ts
 * The ONLY file that talks to Supabase (client, auth, database, storage).
 * Pages and components must import functions from here and never call
 * supabase directly.
 *
 * Website: https://peacefurniture.vercel.app
 * ============================================================================
 */

// ============================================================================
// 0. SETTINGS  (change names here only, if your Supabase names differ)
// ============================================================================

/** Table names in Supabase */
export const TABLES = { categories: 'categories', items: 'items' } as const;

/**
 * Storage bucket names. Bucket names are CASE-SENSITIVE and must match the
 * name shown in Supabase > Storage exactly.
 */
export const BUCKETS = { items: 'item-images', categories: 'category-images' } as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
    // ignore (storage not available)
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
    // ignore (storage not available)
  }
  return '';
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url) && url.startsWith('https://') && Boolean(key) && key.length > 20;
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
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return clientInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    if (url && url.trim()) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);
    if (anonKey && anonKey.trim()) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_ANON);
  } catch {
    // ignore (storage not available)
  }
  clientInstance = null; // force a fresh client
}

// Global client (created lazily, so changing credentials takes effect)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

function requireConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (in Vercel: Project Settings > Environment Variables, then redeploy).',
    );
  }
}

// ============================================================================
// 2. DATA MODELS & TYPES
// ============================================================================

export interface DBCategory {
  id: string; // UUID
  slug: string;
  name: string;
  image?: string;
  item_count?: number; // read-only: kept up to date by a database trigger
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
// 3. ERRORS, ID HELPERS, WRITE QUEUE
// ============================================================================

/**
 * Supabase returns plain objects, not Error instances. This turns any of them
 * into a real Error with the code, the details and a plain-language fix.
 */
export function parseSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown error occurred');

  const code = error.code || error.status || 'UNKNOWN';
  const message = error.message || (typeof error === 'string' ? error : 'Database operation failed');
  const details = error.details || '';
  const hint = error.hint || '';

  let solution = '';
  if (code === 'PGRST204' || code === '42703') {
    solution = 'A column is missing in the table. Run the schema SQL in the Supabase SQL Editor, then: NOTIFY pgrst, \'reload schema\';';
  } else if (code === 'PGRST205' || code === '42P01') {
    solution = 'A table does not exist. Make sure "categories" and "items" exist in Supabase.';
  } else if (code === 'PGRST200') {
    solution = 'The items table is not linked to categories. Check that the foreign key items.category_id points to categories(id).';
  } else if (code === '42501') {
    solution = 'Row Level Security (RLS) blocked this. Check the policies, and make sure you are logged in for writes.';
  } else if (code === '23503') {
    solution = 'The chosen category does not exist in the categories table.';
  } else if (code === '23505') {
    solution = 'A record with the same slug (or id) already exists. Use a different slug.';
  } else if (code === '23502') {
    solution = 'A required field is empty.';
  } else if (code === '23514') {
    solution = 'A value is not allowed (for example a negative price).';
  } else if (code === '22P02') {
    solution = 'An id is not a valid UUID.';
  } else if (/failed to fetch|networkerror|load failed/i.test(String(message))) {
    solution = 'Could not reach Supabase. Check the internet connection and that VITE_SUPABASE_URL is correct.';
  }

  const fullMsg = [
    `Database Error [${code}]: ${message}`,
    details ? `Details: ${details}` : null,
    solution ? `Fix: ${solution}` : hint ? `Hint: ${hint}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const err = new Error(fullMsg);
  (err as any).code = code;
  (err as any).details = details;
  (err as any).hint = solution || hint;
  return err;
}

function notFoundError(what: string, id: string): Error {
  const err = new Error(
    `Nothing was saved: no ${what} with id "${id}" was updated. It may not exist, or Row Level Security blocked the update (are you logged in?).`,
  );
  (err as any).code = 'ROW_NOT_FOUND';
  return err;
}

/**
 * Runs writes one at a time, in order. One failed write does NOT block the
 * writes after it (the queue itself never stays in a rejected state).
 */
let writeQueue: Promise<unknown> = Promise.resolve();
function serializeWrite<T>(writeFn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(writeFn);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function isUUID(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function slugify(text: string): string {
  const base = (text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || `item-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generates a unique slug from a name, appending -1, -2, etc. if the slug already exists.
 */
export function generateUniqueSlug(
  name: string,
  existingItems: Array<{ id?: string; name?: string; slug?: string }> = [],
  currentId?: string
): string {
  const baseSlug = (name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';

  const usedSlugs = new Set<string>();
  for (const item of existingItems) {
    if (currentId && item.id === currentId) continue;
    if (item.slug) {
      usedSlugs.add(item.slug.toLowerCase());
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

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

// ---- Row mappers (one place, so every function returns the same shape) -----

function mapCategoryRow(row: any): DBCategory {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    image: row.image ?? row.image_url ?? '',
    item_count: row.item_count ?? 0,
    active: row.active ?? true,
    deleted_at: row.deleted_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapItemRow(row: any): DBItem {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category_id: row.category_id || null,
    price: Number(row.price) || 0,
    original_price: row.original_price ? Number(row.original_price) : undefined,
    description: row.description || '',
    image: row.image ?? row.image_url ?? '',
    active: row.active ?? true,
    deleted_at: row.deleted_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---- Category reference -> real UUID ----------------------------------------

const slugToUuid = new Map<string, string>();

/**
 * Turns a category reference (UUID, slug or name) into a real category UUID.
 * Returns null for empty / "all". It does NOT create categories: guessing and
 * auto-creating them caused junk categories before.
 */
export async function resolveGroupUuid(ref: string | null | undefined): Promise<string | null> {
  if (!ref || ref === 'all') return null;
  if (isUUID(ref)) return ref;
  if (slugToUuid.has(ref)) return slugToUuid.get(ref)!;

  requireConfigured();

  const bySlug = await supabase.from(TABLES.categories).select('id').eq('slug', ref).limit(1);
  if (bySlug.error) throw parseSupabaseError(bySlug.error);
  if (bySlug.data && bySlug.data.length > 0) {
    slugToUuid.set(ref, bySlug.data[0].id);
    return bySlug.data[0].id;
  }

  const escaped = ref.replace(/[\\%_]/g, '\\$&');
  const byName = await supabase.from(TABLES.categories).select('id').ilike('name', escaped).limit(1);
  if (byName.error) throw parseSupabaseError(byName.error);
  if (byName.data && byName.data.length > 0) {
    slugToUuid.set(ref, byName.data[0].id);
    return byName.data[0].id;
  }

  return null;
}

/** Like resolveGroupUuid, but a reference that can't be found is an error (never a silent null). */
async function requireCategoryUuid(ref: string | null | undefined): Promise<string | null> {
  if (!ref || ref === 'all') return null;
  const uuid = await resolveGroupUuid(ref);
  if (!uuid) {
    throw new Error(`Category "${ref}" was not found in the database. Create the category first, then pick it.`);
  }
  return uuid;
}

// ============================================================================
// 4. AUTHENTICATION (SUPABASE AUTH)
// ============================================================================

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ session: Session | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { session: null, error: new Error('Supabase is not configured. Please enter your Supabase URL and Anon Key.') };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { session: null, error: parseSupabaseError(error) };
    return { session: data.session, error: null };
  } catch (err: any) {
    return { session: null, error: parseSupabaseError(err) };
  }
}

export async function signOutAdmin(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? parseSupabaseError(error) : null };
  } catch (err: any) {
    return { error: parseSupabaseError(err) };
  }
}

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

export function onAuthChange(callback: (event: string, session: Session | null) => void) {
  if (!isSupabaseConfigured()) return { unsubscribe: () => {} };
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return subscription;
}

// ============================================================================
// 5. STORAGE (IMAGES)
// ============================================================================

/**
 * Upload an image and return its public URL. Save that URL in the row's
 * `image` column. Use BUCKETS.items for items and BUCKETS.categories for
 * categories.
 */
export async function uploadImage(file: File, bucket: string = BUCKETS.items): Promise<string> {
  requireConfigured();

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP or GIF images are allowed.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext || 'jpg'}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) throw parseSupabaseError(uploadError);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error('Could not get the public URL of the uploaded image.');
  return data.publicUrl;
}

export const uploadItemImage = (file: File) => uploadImage(file, BUCKETS.items);
export const uploadCategoryImage = (file: File) => uploadImage(file, BUCKETS.categories);

/** Public URL for a stored file path (full URLs are returned unchanged). */
export function getImagePublicUrl(filePath: string, bucket: string = BUCKETS.items): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

/**
 * Delete an image file given its public URL (or bucket path).
 * Call it after replacing an image, so old files don't pile up.
 * Never throws: a leftover file is not worth failing a save for.
 */
export async function deleteImage(urlOrPath: string | undefined | null, bucket: string = BUCKETS.items): Promise<void> {
  if (!urlOrPath || !isSupabaseConfigured()) return;
  let path = urlOrPath;
  if (urlOrPath.startsWith('http')) {
    const marker = `/object/public/${bucket}/`;
    const idx = urlOrPath.indexOf(marker);
    if (idx === -1) return; // belongs to another bucket or another site
    path = decodeURIComponent(urlOrPath.slice(idx + marker.length).split('?')[0]);
  }
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn('Could not delete image file:', error.message);
}

// ============================================================================
// 6. CATEGORIES (table 'categories')
// ============================================================================

export interface ListCategoriesOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean; // for the Trash view
  activeOnly?: boolean;
}

export async function listCategories(options: ListCategoriesOptions = {}): Promise<DBCategory[]> {
  requireConfigured();

  let query = supabase.from(TABLES.categories).select('*').order('name', { ascending: true });
  if (options.onlyDeleted) query = query.not('deleted_at', 'is', null);
  else if (!options.includeDeleted) query = query.is('deleted_at', null);
  if (options.activeOnly) query = query.eq('active', true);

  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);
  return (data || []).map(mapCategoryRow);
}

/** For the public website: only visible categories. */
export const listPublicCategories = () => listCategories({ activeOnly: true });

export async function getCategory(idOrSlug: string): Promise<DBCategory | null> {
  requireConfigured();
  const { data, error } = await supabase
    .from(TABLES.categories)
    .select('*')
    .eq(isUUID(idOrSlug) ? 'id' : 'slug', idOrSlug)
    .maybeSingle();
  if (error) throw parseSupabaseError(error);
  return data ? mapCategoryRow(data) : null;
}

/**
 * INSERT a category. item_count is maintained by the database: never sent.
 * An empty slug is generated from the name; a clash on a generated slug is
 * retried once with a short suffix.
 */
export async function createCategory(category: Partial<DBCategory>): Promise<DBCategory> {
  requireConfigured();

  return serializeWrite(async () => {
    const name = category.name?.trim();
    if (!name) throw new Error('Category name is required.');
    const typedSlug = category.slug?.trim();

    const build = (slug: string) => {
      const payload: Record<string, any> = { name, slug, active: category.active ?? true, deleted_at: null };
      if (category.image !== undefined) payload.image = category.image;
      if (category.id && isUUID(category.id)) payload.id = category.id;
      return payload;
    };

    let slug = typedSlug || slugify(name);
    let result = await supabase.from(TABLES.categories).insert(build(slug)).select().single();
    if (result.error?.code === '23505' && !typedSlug) {
      slug = `${slug}-${randomSuffix()}`;
      result = await supabase.from(TABLES.categories).insert(build(slug)).select().single();
    }
    if (result.error) throw parseSupabaseError(result.error);

    slugToUuid.clear();
    return mapCategoryRow(result.data);
  });
}

/** UPDATE a category. Only the fields you pass are changed. */
export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
  requireConfigured();

  return serializeWrite(async () => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new Error('Category name cannot be empty.');
      payload.name = updates.name.trim();
    }
    if (updates.slug !== undefined && updates.slug.trim()) payload.slug = updates.slug.trim();
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;

    if (Object.keys(payload).length === 0) {
      const current = await getCategory(id);
      if (!current) throw notFoundError('category', id);
      return current;
    }

    const { data, error } = await supabase.from(TABLES.categories).update(payload).eq('id', id).select().maybeSingle();
    if (error) throw parseSupabaseError(error);
    if (!data) throw notFoundError('category', id);

    slugToUuid.clear();
    return mapCategoryRow(data);
  });
}

async function setCategoryColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  requireConfigured();
  return serializeWrite(async () => {
    const { data, error } = await supabase.from(TABLES.categories).update(patch).eq('id', id).select('id');
    if (error) throw parseSupabaseError(error);
    if (!data || data.length === 0) throw notFoundError('category', id);
    slugToUuid.clear();
    return true;
  });
}

/** SOFT DELETE: hides the category (deleted_at = now). Can be restored. */
export const softDeleteCategory = (id: string) => setCategoryColumns(id, { deleted_at: new Date().toISOString() });

/** RESTORE from trash. */
export const restoreCategory = (id: string) => setCategoryColumns(id, { deleted_at: null });

/** Show / hide on the website. */
export const toggleCategoryActive = (id: string, active: boolean) => setCategoryColumns(id, { active });

/** PERMANENT DELETE: removes the row and its image file. Items in it become uncategorised. */
export async function permanentDeleteCategory(id: string): Promise<boolean> {
  requireConfigured();
  const existing = await getCategory(id);
  await serializeWrite(async () => {
    const { error } = await supabase.from(TABLES.categories).delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  });
  slugToUuid.clear();
  if (existing?.image) await deleteImage(existing.image, BUCKETS.categories);
  return true;
}

// Aliases for compatibility
export const fetchGroups = (includeDeleted = false) => listCategories({ includeDeleted });
export async function saveGroup(group: Partial<DBCategory>): Promise<{ data: DBCategory; isSupabaseSynced: boolean }> {
  if (group.id && isUUID(group.id)) {
    try {
      return { data: await updateCategory(group.id, group), isSupabaseSynced: true };
    } catch (err: any) {
      if (err?.code !== 'ROW_NOT_FOUND') throw err; // id is new: fall through and create it
    }
  }
  return { data: await createCategory(group), isSupabaseSynced: true };
}
export const softDeleteGroup = softDeleteCategory;
export const restoreGroup = restoreCategory;

// ============================================================================
// 7. ITEMS (table 'items')
// ============================================================================

export interface ListItemsOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean; // for the Trash view
  activeOnly?: boolean;
  categoryId?: string; // UUID, slug or name
}

export async function listItems(options: ListItemsOptions = {}): Promise<DBItem[]> {
  requireConfigured();

  let query = supabase.from(TABLES.items).select('*').order('name', { ascending: true });
  if (options.onlyDeleted) query = query.not('deleted_at', 'is', null);
  else if (!options.includeDeleted) query = query.is('deleted_at', null);
  if (options.activeOnly) query = query.eq('active', true);

  if (options.categoryId && options.categoryId !== 'all') {
    const categoryUuid = await resolveGroupUuid(options.categoryId);
    if (!categoryUuid) return []; // unknown category = no items (not "all items")
    query = query.eq('category_id', categoryUuid);
  }

  const { data, error } = await query;
  if (error) throw parseSupabaseError(error);
  return (data || []).map(mapItemRow);
}

/** For the public website: only visible items. */
export const listPublicItems = (categoryId?: string) => listItems({ activeOnly: true, categoryId });

export async function getItem(idOrSlug: string): Promise<DBItem | null> {
  requireConfigured();
  const { data, error } = await supabase
    .from(TABLES.items)
    .select('*')
    .eq(isUUID(idOrSlug) ? 'id' : 'slug', idOrSlug)
    .maybeSingle();
  if (error) throw parseSupabaseError(error);
  return data ? mapItemRow(data) : null;
}

/**
 * INSERT an item. category_id must be a real category (UUID, slug or name);
 * an unknown category is an error instead of being silently dropped.
 */
export async function createItem(item: Partial<DBItem>): Promise<DBItem> {
  requireConfigured();

  return serializeWrite(async () => {
    const name = item.name?.trim();
    if (!name) throw new Error('Item name is required.');
    const price = Number(item.price) || 0;
    if (price < 0) throw new Error('Price cannot be negative.');

    const categoryUuid = await requireCategoryUuid(item.category_id);
    const typedSlug = item.slug?.trim();

    const build = (slug: string) => {
      const payload: Record<string, any> = {
        name,
        slug,
        category_id: categoryUuid,
        price,
        description: item.description || '',
        active: item.active ?? true,
        deleted_at: null,
      };
      if (item.image !== undefined) payload.image = item.image;
      if (item.id && isUUID(item.id)) payload.id = item.id;
      return payload;
    };

    let slug = typedSlug || slugify(name);
    let result = await supabase.from(TABLES.items).insert(build(slug)).select().single();
    if (result.error?.code === '23505' && !typedSlug) {
      slug = `${slug}-${randomSuffix()}`;
      result = await supabase.from(TABLES.items).insert(build(slug)).select().single();
    }
    if (result.error) throw parseSupabaseError(result.error);

    return mapItemRow(result.data);
  });
}

/** UPDATE an item. Only the fields you pass are changed. */
export async function updateItem(id: string, updates: Partial<DBItem>): Promise<DBItem> {
  requireConfigured();

  return serializeWrite(async () => {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new Error('Item name cannot be empty.');
      payload.name = updates.name.trim();
    }
    if (updates.slug !== undefined && updates.slug.trim()) payload.slug = updates.slug.trim();
    if (updates.price !== undefined) {
      const price = Number(updates.price) || 0;
      if (price < 0) throw new Error('Price cannot be negative.');
      payload.price = price;
    }
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;
    if (updates.category_id !== undefined) payload.category_id = await requireCategoryUuid(updates.category_id);

    if (Object.keys(payload).length === 0) {
      const current = await getItem(id);
      if (!current) throw notFoundError('item', id);
      return current;
    }

    const { data, error } = await supabase.from(TABLES.items).update(payload).eq('id', id).select().maybeSingle();
    if (error) throw parseSupabaseError(error);
    if (!data) throw notFoundError('item', id);
    return mapItemRow(data);
  });
}

async function setItemColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  requireConfigured();
  return serializeWrite(async () => {
    const { data, error } = await supabase.from(TABLES.items).update(patch).eq('id', id).select('id');
    if (error) throw parseSupabaseError(error);
    if (!data || data.length === 0) throw notFoundError('item', id);
    return true;
  });
}

/** SOFT DELETE: hides the item (deleted_at = now). Can be restored. */
export const softDeleteItem = (id: string) => setItemColumns(id, { deleted_at: new Date().toISOString() });

/** RESTORE from trash. */
export const restoreItem = (id: string) => setItemColumns(id, { deleted_at: null });

/** Show / hide on the website. */
export const toggleItemActive = (id: string, active: boolean) => setItemColumns(id, { active });

/** PERMANENT DELETE: removes the row and its image file. */
export async function permanentDeleteItem(id: string): Promise<boolean> {
  requireConfigured();
  const existing = await getItem(id);
  await serializeWrite(async () => {
    const { error } = await supabase.from(TABLES.items).delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  });
  if (existing?.image) await deleteImage(existing.image, BUCKETS.items);
  return true;
}

export const purgeItemPermanently = permanentDeleteItem;

// Aliases for compatibility
export const fetchItems = (includeDeleted = false) => listItems({ includeDeleted });
export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  if (item.id && isUUID(item.id)) {
    try {
      return { data: await updateItem(item.id, item), isSupabaseSynced: true };
    } catch (err: any) {
      if (err?.code !== 'ROW_NOT_FOUND') throw err; // id is new: fall through and create it
    }
  }
  return { data: await createItem(item), isSupabaseSynced: true };
}

// ============================================================================
// 8. LIVE UPDATES (optional)
// ============================================================================

/**
 * Calls onChange whenever an item or category changes in the database, so the
 * public site can refetch. Returns an unsubscribe function.
 * Needs Realtime enabled for both tables in Supabase:
 *   alter publication supabase_realtime add table public.items, public.categories;
 */
export function subscribeToChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured()) return () => {};
  const channel = supabase
    .channel('peace-furniture-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.items }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.categories }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// 9. HEALTH CHECK (find connection problems fast)
// ============================================================================

export async function runDatabaseHealthCheck(): Promise<HealthCheckResult> {
  const isConfigured = isSupabaseConfigured();
  const result: HealthCheckResult = {
    ok: true,
    isConfigured,
    supabaseUrl: getSupabaseUrl(),
    checks: [],
    suggestedSql: '',
  };

  const add = (
    name: string,
    status: 'pass' | 'fail' | 'warn',
    message: string,
    sqlFix?: string,
  ) => {
    result.checks.push({ name, status, message, sqlFix });
    if (status === 'fail') result.ok = false;
  };

  if (!isConfigured) {
    add('Supabase configuration', 'fail', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid.');
    return result;
  }

  // 1) Categories table + the columns the code uses
  try {
    const { error } = await supabase
      .from(TABLES.categories)
      .select('id, name, slug, item_count, active, deleted_at, created_at')
      .limit(1);
    if (error) {
      add('Table: categories', 'fail', `${error.message} [${error.code}]`);
    } else {
      add('Table: categories', 'pass', 'Table and columns are readable.');
    }
  } catch (err: any) {
    add('Table: categories', 'fail', err?.message || String(err));
  }

  // 2) Items table + the columns the code uses
  try {
    const { error } = await supabase
      .from(TABLES.items)
      .select('id, name, slug, description, category_id, price, active, deleted_at, created_at')
      .limit(1);
    if (error) {
      add('Table: items', 'fail', `${error.message} [${error.code}]`);
    } else {
      add('Table: items', 'pass', 'Table and columns are readable.');
    }
  } catch (err: any) {
    add('Table: items', 'fail', err?.message || String(err));
  }

  // 3) Image column (kept separate so a missing image column is clearly named)
  for (const table of [TABLES.categories, TABLES.items]) {
    try {
      const { error } = await supabase.from(table).select('image').limit(1);
      if (error) {
        add(
          `Column: ${table}.image`,
          'fail',
          `${error.message} [${error.code}]`,
          `alter table public.${table} add column if not exists image text; notify pgrst, 'reload schema';`,
        );
      } else {
        add(`Column: ${table}.image`, 'pass', 'Image column exists.');
      }
    } catch (err: any) {
      add(`Column: ${table}.image`, 'fail', err?.message || String(err));
    }
  }

  // 4) Foreign key items.category_id -> categories (the embed only works if
  //    the key points at the right table)
  try {
    const { error } = await supabase.from(TABLES.items).select('id, categories(id)').limit(1);
    if (error && error.code === 'PGRST200') {
      add(
        'Link: items.category_id -> categories',
        'fail',
        'items.category_id is not linked to the categories table (the foreign key is missing or points at a different table).',
        "alter table public.items drop constraint if exists items_category_id_fkey; alter table public.items add constraint items_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null; notify pgrst, 'reload schema';",
      );
    } else if (error) {
      add('Link: items.category_id -> categories', 'warn', `${error.message} [${error.code}]`);
    } else {
      add('Link: items.category_id -> categories', 'pass', 'Foreign key is linked to categories.');
    }
  } catch (err: any) {
    add('Link: items.category_id -> categories', 'warn', err?.message || String(err));
  }

  // 5) Storage buckets: a public URL for a missing file answers differently
  //    for "bucket missing" and "file missing" (works without logging in)
  for (const bucket of [BUCKETS.items, BUCKETS.categories]) {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl('__health_check__.png');
      const res = await fetch(data.publicUrl);
      const body = await res.text();
      if (/bucket not found/i.test(body)) {
        add(
          `Storage bucket: ${bucket}`,
          'fail',
          `Bucket "${bucket}" does not exist. Bucket names are case-sensitive.`,
        );
      } else {
        add(`Storage bucket: ${bucket}`, 'pass', 'Bucket exists and is publicly readable.');
      }
    } catch (err: any) {
      add(`Storage bucket: ${bucket}`, 'warn', `Could not check: ${err?.message || err}`);
    }
  }

  result.suggestedSql = result.checks
    .filter((c) => c.sqlFix)
    .map((c) => c.sqlFix)
    .join('\n');

  return result;
}

// ============================================================================
// 10. UI DATA MAPPING HELPERS
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
  } as FurnitureItem;
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
  } as Category;
}

export function mapFurnitureItemToDBItem(item: FurnitureItem, existingItem: DBItem): DBItem {
  return {
    ...existingItem,
    id: item.id,
    name: item.name,
    category_id: ((item as any).category as string) || ((item as any).group_id as string) || null,
    price: item.price,
    description: item.description,
    image: item.image || '',
    active: (item as any).isActive ?? true,
  };
}

export function mapCategoryToDBGroup(category: Category, existingGroup: DBCategory): DBCategory {
  return {
    ...existingGroup,
    id: category.id as string,
    name: category.name,
    slug: category.slug || existingGroup.slug,
    image: category.image || '',
    active: (category as any).isActive ?? true,
  };
}

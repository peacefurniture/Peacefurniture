import { FurnitureItem, Category } from '../types';
import { createClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * CATALOGUE BACKEND SERVICE LAYER: src/lib/data.ts
 * Dual-engine database architecture:
 * 1. Supabase Cloud Database & Storage (if credentials are provided)
 * 2. Instant Local Storage fallback (guarantees 100% offline uptime)
 * ============================================================================
 */

export const TABLES = { categories: 'categories', items: 'items' } as const;
export const BUCKETS = { items: 'Images', categories: 'Images' } as const;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

let supabaseClientInstance: any = null;

export function getSupabaseUrl(): string {
  try {
    const envUrl = import.meta.env?.VITE_SUPABASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
    const stored = localStorage.getItem('peace_supabase_url') || localStorage.getItem('supabase_url');
    return stored?.trim() || '';
  } catch {
    return '';
  }
}

export function getSupabaseAnonKey(): string {
  try {
    const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
    const stored = localStorage.getItem('peace_supabase_anon_key') || localStorage.getItem('supabase_anon_key');
    return stored?.trim() || '';
  } catch {
    return '';
  }
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.startsWith('http') && key.length > 10);
}

export function getSupabaseClient(): any {
  if (!isSupabaseConfigured()) return null;
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(url, key);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseClientInstance;
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    if (url) localStorage.setItem('peace_supabase_url', url.trim());
    if (anonKey) localStorage.setItem('peace_supabase_anon_key', anonKey.trim());
    supabaseClientInstance = null; // Reset cached client
  } catch {
    // ignore
  }
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (client && prop in client) {
      return typeof client[prop] === 'function' ? client[prop].bind(client) : client[prop];
    }
    return () => ({ data: null, error: new Error('Supabase client is not configured') });
  },
});

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface DBCategory {
  id: string;
  slug: string;
  name: string;
  image?: string;
  item_count?: number;
  active: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type DBGroup = DBCategory;

export interface DBItem {
  id: string;
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

// ---- Default Other Category Image -----------------------------------------
export const DEFAULT_OTHER_CATEGORY_IMAGE =
  '/assets/aistudio/file_00000000ad94820a85e740a448561b67_539794f7.png';

export function isDefaultOtherCategory(
  categoryOrIdOrSlug: { slug?: string; id?: string; name?: string } | string | null | undefined
): boolean {
  if (!categoryOrIdOrSlug) return false;
  if (typeof categoryOrIdOrSlug === 'string') {
    const norm = categoryOrIdOrSlug.trim().toLowerCase();
    return norm === 'other';
  }
  const slug = categoryOrIdOrSlug.slug?.trim().toLowerCase();
  const id = categoryOrIdOrSlug.id?.trim().toLowerCase();
  const name = categoryOrIdOrSlug.name?.trim().toLowerCase();
  return slug === 'other' || id === 'other' || name === 'other';
}

export function sortCategoriesWithOtherLast<T extends { id?: string; slug?: string; name?: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const normal = list.filter((c) => !isDefaultOtherCategory(c));
  const other = list.filter((c) => isDefaultOtherCategory(c));
  return [...normal, ...other];
}

// ============================================================================
// PERSISTENT LOCAL CATALOGUE STORAGE
// ============================================================================

const STORAGE_KEY_ITEMS = 'peace_furniture_items_store_v1';
const STORAGE_KEY_CATEGORIES = 'peace_furniture_categories_store_v1';

const INITIAL_CATEGORIES: DBCategory[] = [
  { id: 'sofas', slug: 'sofas', name: 'Sofas & Seating', active: true, item_count: 1, image: '', deleted_at: null },
  { id: 'beds', slug: 'beds', name: 'Beds & Bedroom', active: true, item_count: 0, image: '', deleted_at: null },
  { id: 'dining', slug: 'dining', name: 'Dining Room', active: true, item_count: 1, image: '', deleted_at: null },
  { id: 'chairs', slug: 'chairs', name: 'Chairs & Benches', active: true, item_count: 0, image: '', deleted_at: null },
  { id: 'wardrobes', slug: 'wardrobes', name: 'Wardrobes', active: true, item_count: 0, image: '', deleted_at: null },
  { id: 'office', slug: 'office', name: 'Work From Home', active: true, item_count: 0, image: '', deleted_at: null },
  { id: 'decor', slug: 'decor', name: 'Home Decor', active: true, item_count: 0, image: '', deleted_at: null },
  {
    id: 'other',
    slug: 'other',
    name: 'Other',
    active: true,
    item_count: 0,
    image: DEFAULT_OTHER_CATEGORY_IMAGE,
    deleted_at: null,
  },
];

const INITIAL_ITEMS: DBItem[] = [];

function readStoredCategories(): DBCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Other category exists and has default image
        let hasOther = false;
        const normalized = parsed.map((cat: DBCategory) => {
          if (isDefaultOtherCategory(cat)) {
            hasOther = true;
            return {
              ...cat,
              id: 'other',
              slug: 'other',
              name: 'Other',
              active: true,
              deleted_at: null,
              image: cat.image || DEFAULT_OTHER_CATEGORY_IMAGE,
            };
          }
          return cat;
        });
        if (!hasOther) {
          normalized.push({
            id: 'other',
            slug: 'other',
            name: 'Other',
            active: true,
            item_count: 0,
            image: DEFAULT_OTHER_CATEGORY_IMAGE,
            deleted_at: null,
          });
        }
        return sortCategoriesWithOtherLast(normalized);
      }
    }
  } catch {
    // ignore
  }

  writeStoredCategories(INITIAL_CATEGORIES);
  return sortCategoriesWithOtherLast(INITIAL_CATEGORIES);
}

function writeStoredCategories(categories: DBCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch {
    // ignore
  }
}

function readStoredItems(): DBItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  writeStoredItems(INITIAL_ITEMS);
  return INITIAL_ITEMS;
}

function writeStoredItems(items: DBItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch {
    // ignore
  }
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

export function generateUniqueSlug(
  name: string,
  existingItems: Array<{ id?: string; name?: string; slug?: string }> = [],
  currentId?: string
): string {
  const baseSlug = slugify(name) || 'item';
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

export async function resolveGroupUuid(ref: string | null | undefined): Promise<string | null> {
  if (!ref || ref === 'all') return null;
  const categories = readStoredCategories();
  const match = categories.find(
    (c) => c.id === ref || c.slug === ref || c.name.toLowerCase() === ref.toLowerCase()
  );
  return match ? match.id : ref;
}

// ============================================================================
// AUTHENTICATION (PURE SUPABASE AUTHENTICATION SERVICE)
// ============================================================================

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ session: any | null; user?: any | null; error: Error | null }> {
  const trimmedEmail = email.trim();
  const client = getSupabaseClient();

  if (!client || !isSupabaseConfigured()) {
    return {
      session: null,
      user: null,
      error: new Error(
        'Supabase is not configured yet. Please configure your Supabase Project URL and Anon Key to log in.'
      ),
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return { session: null, user: null, error };
    }

    if (data?.session) {
      try {
        sessionStorage.setItem('peace_admin_authenticated', 'true');
        sessionStorage.setItem('peace_admin_email', data.session.user?.email || trimmedEmail);
      } catch {
        // ignore
      }
      return { session: data.session, user: data.user, error: null };
    }

    return { session: null, user: null, error: new Error('Failed to retrieve Supabase session.') };
  } catch (err: any) {
    return { session: null, user: null, error: err };
  }
}

export async function signUpAdmin(
  email: string,
  password: string
): Promise<{ session: any | null; user?: any | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      session: null,
      user: null,
      error: new Error('Supabase is not configured yet. Please configure your Supabase Project URL and Anon Key first.'),
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { session: null, user: null, error };
    }

    if (data.session) {
      try {
        sessionStorage.setItem('peace_admin_authenticated', 'true');
        sessionStorage.setItem('peace_admin_email', data.session.user?.email || email.trim());
      } catch {
        // ignore
      }
    }

    return { session: data.session, user: data.user, error: null };
  } catch (err: any) {
    return { session: null, user: null, error: err };
  }
}

export async function signOutAdmin(): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err: any) {
      console.warn('Supabase Auth signOut error:', err);
    }
  }

  try {
    sessionStorage.removeItem('peace_admin_authenticated');
    sessionStorage.removeItem('peace_admin_email');
    localStorage.removeItem('peace_admin_authenticated');
  } catch {
    // ignore
  }

  return { error: null };
}

export async function getAdminSession(): Promise<{ session: any | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data?.session) {
        return { session: data.session, error: null };
      }
    } catch (err) {
      console.warn('Supabase Auth getSession error:', err);
    }
  }

  return { session: null, error: null };
}

export function onAuthChange(callback: (event: string, session: any | null) => void) {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event: string, session: any) => {
        if (session) {
          try {
            sessionStorage.setItem('peace_admin_authenticated', 'true');
            sessionStorage.setItem('peace_admin_email', session.user?.email || '');
          } catch {
            // ignore
          }
        } else if (event === 'SIGNED_OUT') {
          try {
            sessionStorage.removeItem('peace_admin_authenticated');
            sessionStorage.removeItem('peace_admin_email');
          } catch {
            // ignore
          }
        }
        callback(event, session);
      });

      return {
        unsubscribe: () => {
          subscription?.unsubscribe?.();
        },
      };
    } catch (err) {
      console.warn('Supabase Auth onAuthStateChange error:', err);
    }
  }

  return { unsubscribe: () => {} };
}

// ============================================================================
// IMAGE STORAGE (SUPABASE BUCKET WITH LOCAL DATA URL FALLBACK)
// ============================================================================

export async function uploadImage(file: File, bucket: string = BUCKETS.items): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP, GIF, or SVG images are allowed.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
  }

  // Try Supabase Storage if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await client.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!uploadError) {
        const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase image upload failed, falling back to local Data URL:', err);
    }
  }

  // Local Base64 Data URL fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to process image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export const uploadItemImage = (file: File) => uploadImage(file, BUCKETS.items);
export const uploadCategoryImage = (file: File) => uploadImage(file, BUCKETS.categories);

export function getImagePublicUrl(filePath: string, bucket: string = BUCKETS.items): string {
  if (!filePath) return '';
  if (filePath.startsWith('http') || filePath.startsWith('data:')) return filePath;
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = client.storage.from(bucket).getPublicUrl(filePath);
      return data?.publicUrl || filePath;
    } catch {
      return filePath;
    }
  }
  return filePath;
}

export async function deleteImage(urlOrPath: string, bucket: string = BUCKETS.items): Promise<void> {
  const client = getSupabaseClient();
  if (client && urlOrPath && !urlOrPath.startsWith('data:')) {
    try {
      const path = urlOrPath.includes('/') ? urlOrPath.split('/').slice(-2).join('/') : urlOrPath;
      await client.storage.from(bucket).remove([path]);
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// CATEGORIES CRUD (SUPABASE + LOCAL SYNC)
// ============================================================================

export async function ensureDefaultOtherCategory(): Promise<DBCategory> {
  const categories = readStoredCategories();
  const existing = categories.find((c) => isDefaultOtherCategory(c));
  if (existing) {
    existing.active = true;
    existing.deleted_at = null;
    existing.image = existing.image || DEFAULT_OTHER_CATEGORY_IMAGE;
    writeStoredCategories(categories);
    return existing;
  }

  const newOther: DBCategory = {
    id: 'other',
    slug: 'other',
    name: 'Other',
    active: true,
    item_count: 0,
    image: DEFAULT_OTHER_CATEGORY_IMAGE,
    deleted_at: null,
  };
  categories.push(newOther);
  writeStoredCategories(categories);
  return newOther;
}

export function formatSupabaseError(error: any, table: string): string {
  if (!error) return 'Unknown database error';
  const msg = error.message || '';
  if (error.code === '42P01' || msg.includes('does not exist') || error.code === 'PGRST205') {
    return `Table 'public.${table}' does not exist in your Supabase project. Please execute schema.sql in your Supabase SQL Editor.`;
  }
  if (
    error.code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('RLS') ||
    msg.includes('violates row-level security policy')
  ) {
    return `Supabase Row-Level Security (RLS) blocked the operation on '${table}'. Please execute the RLS policies in schema.sql.`;
  }
  if (msg.includes('item_count') || error.code === 'PGRST204') {
    return `Supabase schema error: column 'item_count' does not exist in table 'public.categories'.`;
  }
  return msg || `Supabase error (${error.code || 'UNKNOWN'})`;
}

export interface ListCategoriesOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  activeOnly?: boolean;
}

export async function listCategories(options: ListCategoriesOptions = {}): Promise<DBCategory[]> {
  await ensureDefaultOtherCategory();

  // Check Supabase Cloud first if available
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      let query = client.from(TABLES.categories).select('*');
      if (options.onlyDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options.activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        // If Supabase returned categories
        const items = readStoredItems().filter((item) => !item.deleted_at);
        const mapped = data.map((cat: any) => {
          const isOther = isDefaultOtherCategory(cat);
          const count = items.filter((item) => {
            if (item.category_id === cat.id || item.category_id === cat.slug) return true;
            if (isOther && (!item.category_id || item.category_id === 'other')) return true;
            return false;
          }).length;
          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            active: cat.active !== false,
            image: cat.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : ''),
            item_count: count,
            deleted_at: cat.deleted_at || null,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
          };
        });

        if (mapped.length > 0) {
          writeStoredCategories(mapped);
          return sortCategoriesWithOtherLast(mapped);
        }
      } else if (error) {
        console.warn('Supabase fetch categories error:', error);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage database:', err);
    }
  }

  // Fallback to Local Storage
  let categories = readStoredCategories();
  const items = readStoredItems().filter((item) => !item.deleted_at);

  categories = categories.map((cat) => {
    const isOther = isDefaultOtherCategory(cat);
    const count = items.filter((item) => {
      if (item.category_id === cat.id || item.category_id === cat.slug) return true;
      if (isOther && (!item.category_id || item.category_id === 'other')) return true;
      return false;
    }).length;
    return {
      ...cat,
      item_count: count,
      image: cat.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : ''),
    };
  });

  if (options.onlyDeleted) {
    return sortCategoriesWithOtherLast(categories.filter((c) => c.deleted_at && !isDefaultOtherCategory(c)));
  }
  if (!options.includeDeleted) {
    categories = categories.filter((c) => !c.deleted_at);
  }
  if (options.activeOnly) {
    categories = categories.filter((c) => c.active !== false);
  }

  return sortCategoriesWithOtherLast(categories);
}

export const listPublicCategories = () => listCategories({ activeOnly: true });

export async function getCategory(idOrSlug: string): Promise<DBCategory | null> {
  if (isDefaultOtherCategory(idOrSlug)) {
    return ensureDefaultOtherCategory();
  }
  const categories = readStoredCategories();
  const cat = categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug || c.name.toLowerCase() === idOrSlug.toLowerCase());
  return cat || null;
}

export async function createCategory(category: Partial<DBCategory>): Promise<DBCategory> {
  const name = category.name?.trim();
  if (!name) throw new Error('Category name is required.');
  const typedSlug = category.slug?.trim();

  if ((typedSlug && typedSlug.toLowerCase() === 'other') || name.toLowerCase() === 'other') {
    throw new Error("Category 'Other' is a permanent default category and cannot be recreated.");
  }

  const categories = readStoredCategories();
  const slug = typedSlug || generateUniqueSlug(name, categories);
  const newCatId = category.id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newCat: DBCategory = {
    id: newCatId,
    name,
    slug,
    active: category.active ?? true,
    image: category.image || '',
    item_count: 0,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    // CRITICAL: Clean payload for Supabase - ONLY columns that exist in public.categories!
    // Supabase table schema: id, name, slug, image, active, deleted_at, created_at, updated_at
    // 'item_count' MUST be omitted because PostgREST rejects any payload containing non-existent columns.
    const supabasePayload = {
      id: newCat.id,
      name: newCat.name,
      slug: newCat.slug,
      image: newCat.image || '',
      active: newCat.active,
      deleted_at: null,
    };

    const { error } = await client.from(TABLES.categories).upsert([supabasePayload]);
    if (error) {
      console.error('Supabase createCategory error:', error);
      throw new Error(formatSupabaseError(error, 'categories'));
    }
  }

  // Update local cache only if Supabase succeeded or not configured
  const existingIdx = categories.findIndex((c) => c.id === newCat.id || c.slug === newCat.slug);
  if (existingIdx >= 0) {
    categories[existingIdx] = newCat;
  } else {
    categories.push(newCat);
  }
  writeStoredCategories(categories);

  return newCat;
}

export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
  if (isDefaultOtherCategory(id) || (updates.slug && updates.slug.toLowerCase() === 'other')) {
    throw new Error("Default category 'Other' cannot be edited.");
  }

  const categories = readStoredCategories();
  const index = categories.findIndex((c) => c.id === id || c.slug === id);
  if (index === -1 && !isSupabaseConfigured()) {
    throw new Error(`Category "${id}" was not found.`);
  }

  const current = index !== -1 ? categories[index] : ({} as DBCategory);
  if (current && isDefaultOtherCategory(current)) {
    throw new Error("Default category 'Other' cannot be edited.");
  }

  const updated: DBCategory = {
    ...current,
    ...updates,
    id: current.id || id,
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const supabaseUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) supabaseUpdates.name = updates.name.trim();
    if (updates.slug !== undefined) supabaseUpdates.slug = updates.slug.trim();
    if (updates.image !== undefined) supabaseUpdates.image = updates.image || '';
    if (updates.active !== undefined) supabaseUpdates.active = updates.active;
    if (updates.deleted_at !== undefined) supabaseUpdates.deleted_at = updates.deleted_at;

    const targetId = current.id || id;
    const { error } = await client.from(TABLES.categories).update(supabaseUpdates).eq('id', targetId);
    if (error) {
      console.error('Supabase updateCategory error:', error);
      throw new Error(formatSupabaseError(error, 'categories'));
    }
  }

  if (index !== -1) {
    categories[index] = updated;
    writeStoredCategories(categories);
  }

  return updated;
}

export async function setCategoryColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  if (isDefaultOtherCategory(id)) {
    throw new Error("Default category 'Other' cannot be modified or deleted.");
  }
  const categories = readStoredCategories();
  const index = categories.findIndex((c) => c.id === id || c.slug === id);
  const targetId = index !== -1 ? categories[index].id : id;

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const cleanPatch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if ('active' in patch) cleanPatch.active = patch.active;
    if ('deleted_at' in patch) cleanPatch.deleted_at = patch.deleted_at;

    const { error } = await client.from(TABLES.categories).update(cleanPatch).eq('id', targetId);
    if (error) {
      console.error('Supabase setCategoryColumns error:', error);
      throw new Error(formatSupabaseError(error, 'categories'));
    }
  }

  if (index !== -1) {
    categories[index] = {
      ...categories[index],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    writeStoredCategories(categories);
  }

  return true;
}

export const softDeleteCategory = async (id: string) => {
  if (isDefaultOtherCategory(id)) {
    throw new Error("Default category 'Other' cannot be deleted.");
  }
  return setCategoryColumns(id, { deleted_at: new Date().toISOString() });
};

export const restoreCategory = (id: string) => setCategoryColumns(id, { deleted_at: null });
export const toggleCategoryActive = (id: string, active: boolean) => setCategoryColumns(id, { active });

export async function permanentDeleteCategory(id: string): Promise<boolean> {
  if (isDefaultOtherCategory(id)) {
    throw new Error("Default category 'Other' cannot be deleted.");
  }
  const categories = readStoredCategories();
  const match = categories.find((c) => c.id === id || c.slug === id);
  const targetId = match ? match.id : id;

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const { error } = await client.from(TABLES.categories).delete().eq('id', targetId);
    if (error) {
      console.error('Supabase permanentDeleteCategory error:', error);
      throw new Error(formatSupabaseError(error, 'categories'));
    }
  }

  const filtered = categories.filter((c) => c.id !== id && c.slug !== id);
  writeStoredCategories(filtered);

  return true;
}

export const fetchGroups = (includeDeleted = false) => listCategories({ includeDeleted });

export async function saveGroup(group: Partial<DBCategory>): Promise<{ data: DBCategory; isSupabaseSynced: boolean }> {
  const categories = readStoredCategories();
  const exists = Boolean(group.id && categories.some((c) => c.id === group.id || c.slug === group.id));

  if (exists && group.id) {
    const updated = await updateCategory(group.id, group);
    return { data: updated, isSupabaseSynced: isSupabaseConfigured() };
  }

  const created = await createCategory(group);
  return { data: created, isSupabaseSynced: isSupabaseConfigured() };
}

export const softDeleteGroup = softDeleteCategory;
export const restoreGroup = restoreCategory;
export const purgeGroupPermanently = permanentDeleteCategory;
export const purgeCategoryPermanently = permanentDeleteCategory;

// ============================================================================
// ITEMS / PRODUCTS CRUD (SUPABASE + LOCAL SYNC)
// ============================================================================

export interface ListItemsOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  activeOnly?: boolean;
  categoryId?: string;
}

export async function listItems(options: ListItemsOptions = {}): Promise<DBItem[]> {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      let query = client.from(TABLES.items).select('*');
      if (options.onlyDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options.activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          writeStoredItems(data);
          return data;
        }
      } else if (error) {
        console.warn('Supabase items fetch error:', error);
      }
    } catch (err) {
      console.warn('Supabase items fetch failed, using local storage fallback:', err);
    }
  }

  let items = readStoredItems();

  if (options.onlyDeleted) {
    items = items.filter((item) => item.deleted_at);
  } else if (!options.includeDeleted) {
    items = items.filter((item) => !item.deleted_at);
  }

  if (options.activeOnly) {
    items = items.filter((item) => item.active !== false);
  }

  if (options.categoryId && options.categoryId !== 'all') {
    const targetCat = options.categoryId.toLowerCase();
    items = items.filter((item) => {
      const cat = (item.category_id || '').toLowerCase();
      return cat === targetCat;
    });
  }

  return items;
}

export const listPublicItems = () => listItems({ activeOnly: true });

export async function getItem(idOrSlug: string): Promise<DBItem | null> {
  const items = readStoredItems();
  const item = items.find((i) => i.id === idOrSlug || i.slug === idOrSlug);
  return item || null;
}

export async function createItem(item: Partial<DBItem>): Promise<DBItem> {
  const name = item.name?.trim();
  if (!name) throw new Error('Product name is required.');

  const items = readStoredItems();
  const slug = item.slug || generateUniqueSlug(name, items);
  const newItem: DBItem = {
    id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    name,
    category_id: item.category_id || 'other',
    price: Number(item.price) || 0,
    original_price: item.original_price ? Number(item.original_price) : undefined,
    description: item.description || '',
    image: item.image || '',
    active: item.active ?? true,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const supabasePayload = {
      id: newItem.id,
      slug: newItem.slug,
      name: newItem.name,
      category_id: newItem.category_id,
      price: newItem.price,
      original_price: newItem.original_price ?? null,
      description: newItem.description,
      image: newItem.image,
      active: newItem.active,
      deleted_at: null,
    };
    const { error } = await client.from(TABLES.items).upsert([supabasePayload]);
    if (error) {
      console.error('Supabase createItem error:', error);
      throw new Error(formatSupabaseError(error, 'items'));
    }
  }

  items.unshift(newItem);
  writeStoredItems(items);

  return newItem;
}

export async function updateItem(id: string, updates: Partial<DBItem>): Promise<DBItem> {
  const items = readStoredItems();
  const index = items.findIndex((i) => i.id === id || i.slug === id);
  if (index === -1 && !isSupabaseConfigured()) {
    throw new Error(`Product "${id}" was not found.`);
  }

  const current = index !== -1 ? items[index] : ({} as DBItem);
  const updated: DBItem = {
    ...current,
    ...updates,
    id: current.id || id,
    price: updates.price !== undefined ? Number(updates.price) : current.price,
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const supabaseUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) supabaseUpdates.name = updates.name.trim();
    if (updates.slug !== undefined) supabaseUpdates.slug = updates.slug;
    if (updates.category_id !== undefined) supabaseUpdates.category_id = updates.category_id;
    if (updates.price !== undefined) supabaseUpdates.price = Number(updates.price);
    if (updates.original_price !== undefined)
      supabaseUpdates.original_price = updates.original_price ? Number(updates.original_price) : null;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.image !== undefined) supabaseUpdates.image = updates.image;
    if (updates.active !== undefined) supabaseUpdates.active = updates.active;
    if (updates.deleted_at !== undefined) supabaseUpdates.deleted_at = updates.deleted_at;

    const targetId = current.id || id;
    const { error } = await client.from(TABLES.items).update(supabaseUpdates).eq('id', targetId);
    if (error) {
      console.error('Supabase updateItem error:', error);
      throw new Error(formatSupabaseError(error, 'items'));
    }
  }

  if (index !== -1) {
    items[index] = updated;
    writeStoredItems(items);
  }

  return updated;
}

export async function setItemColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  const items = readStoredItems();
  const index = items.findIndex((i) => i.id === id || i.slug === id);
  const targetId = index !== -1 ? items[index].id : id;

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const cleanPatch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if ('active' in patch) cleanPatch.active = patch.active;
    if ('deleted_at' in patch) cleanPatch.deleted_at = patch.deleted_at;

    const { error } = await client.from(TABLES.items).update(cleanPatch).eq('id', targetId);
    if (error) {
      console.error('Supabase setItemColumns error:', error);
      throw new Error(formatSupabaseError(error, 'items'));
    }
  }

  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    writeStoredItems(items);
  }

  return true;
}

export const softDeleteItem = (id: string) => setItemColumns(id, { deleted_at: new Date().toISOString() });
export const restoreItem = (id: string) => setItemColumns(id, { deleted_at: null });
export const toggleItemActive = (id: string, active: boolean) => setItemColumns(id, { active });

export async function permanentDeleteItem(id: string): Promise<boolean> {
  const items = readStoredItems();
  const match = items.find((i) => i.id === id || i.slug === id);
  const targetId = match ? match.id : id;

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    const { error } = await client.from(TABLES.items).delete().eq('id', targetId);
    if (error) {
      console.error('Supabase permanentDeleteItem error:', error);
      throw new Error(formatSupabaseError(error, 'items'));
    }
  }

  const filtered = items.filter((i) => i.id !== id && i.slug !== id);
  writeStoredItems(filtered);

  return true;
}

export const purgeItemPermanently = permanentDeleteItem;

export const fetchItems = (includeDeleted = false) => listItems({ includeDeleted });

export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  const items = readStoredItems();
  const exists = Boolean(item.id && items.some((i) => i.id === item.id || i.slug === item.id));

  if (exists && item.id) {
    const updated = await updateItem(item.id, item);
    return { data: updated, isSupabaseSynced: isSupabaseConfigured() };
  }

  const created = await createItem(item);
  return { data: created, isSupabaseSynced: isSupabaseConfigured() };
}

export async function syncAllToSupabase(): Promise<{ syncedCategories: number; syncedItems: number; error: string | null }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { syncedCategories: 0, syncedItems: 0, error: 'Supabase is not configured yet. Please configure Supabase URL and Anon Key first.' };
  }

  try {
    const categories = readStoredCategories();
    const items = readStoredItems();

    // Clean categories payload
    const categoriesPayload = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image || '',
      active: c.active !== false,
      deleted_at: c.deleted_at || null,
    }));

    // Clean items payload
    const itemsPayload = items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      category_id: i.category_id || 'other',
      price: Number(i.price) || 0,
      original_price: i.original_price ? Number(i.original_price) : null,
      description: i.description || '',
      image: i.image || '',
      active: i.active !== false,
      deleted_at: i.deleted_at || null,
    }));

    if (categoriesPayload.length > 0) {
      const { error: catErr } = await client.from(TABLES.categories).upsert(categoriesPayload, { onConflict: 'id' });
      if (catErr) {
        throw new Error(formatSupabaseError(catErr, 'categories'));
      }
    }

    if (itemsPayload.length > 0) {
      const { error: itemErr } = await client.from(TABLES.items).upsert(itemsPayload, { onConflict: 'id' });
      if (itemErr) {
        throw new Error(formatSupabaseError(itemErr, 'items'));
      }
    }

    return {
      syncedCategories: categoriesPayload.length,
      syncedItems: itemsPayload.length,
      error: null,
    };
  } catch (err: any) {
    console.error('syncAllToSupabase error:', err);
    return {
      syncedCategories: 0,
      syncedItems: 0,
      error: err.message || 'Failed to sync with Supabase',
    };
  }
}

export function subscribeToChanges(_onChange: () => void): () => void {
  return () => {};
}

export interface HealthCheckResult {
  ok: boolean;
  isConfigured: boolean;
  supabaseUrl: string;
  checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string; sqlFix?: string }>;
  suggestedSql: string;
}

export async function runDatabaseHealthCheck(): Promise<HealthCheckResult> {
  const isConfig = isSupabaseConfigured();
  const url = getSupabaseUrl();

  if (!isConfig) {
    return {
      ok: true,
      isConfigured: false,
      supabaseUrl: '',
      checks: [{ name: 'Catalogue Database', status: 'pass', message: 'Local persistent database active & healthy.' }],
      suggestedSql: '',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      isConfigured: true,
      supabaseUrl: url,
      checks: [{ name: 'Supabase Credentials', status: 'fail', message: 'Invalid Supabase URL or Anon Key.' }],
      suggestedSql: '',
    };
  }

  try {
    const { error } = await client.from(TABLES.categories).select('id').limit(1);
    if (error) {
      return {
        ok: false,
        isConfigured: true,
        supabaseUrl: url,
        checks: [{ name: 'Supabase Query', status: 'fail', message: error.message }],
        suggestedSql: '',
      };
    }
    return {
      ok: true,
      isConfigured: true,
      supabaseUrl: url,
      checks: [{ name: 'Supabase Cloud Database', status: 'pass', message: 'Connected to Supabase PostgreSQL Database.' }],
      suggestedSql: '',
    };
  } catch (err: any) {
    return {
      ok: false,
      isConfigured: true,
      supabaseUrl: url,
      checks: [{ name: 'Network Connection', status: 'fail', message: err.message || 'Could not reach Supabase host.' }],
      suggestedSql: '',
    };
  }
}

// ============================================================================
// UI DATA MAPPING HELPERS
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
  const isOther = isDefaultOtherCategory(group);
  return {
    id: group.id as any,
    name: group.name,
    slug: group.slug,
    image: group.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : ''),
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
  const isOther = isDefaultOtherCategory(category) || isDefaultOtherCategory(existingGroup);
  return {
    ...existingGroup,
    id: category.id as string,
    name: category.name,
    slug: category.slug || existingGroup.slug,
    image: category.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : ''),
    active: (category as any).isActive ?? true,
  };
}

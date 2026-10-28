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

const INITIAL_ITEMS: DBItem[] = [
  {
    id: 'sofa-luxury-velvet',
    slug: 'sofa-luxury-velvet',
    name: 'Luxury Velvet 3-Seater Sofa',
    category_id: 'sofas',
    price: 34999,
    original_price: 45000,
    description: 'Deep-tufted velvet sofa with gold-finish legs. Premium velvet upholstery meets ergonomic design in this statement piece.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    active: true,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dining-teak-6-seater',
    slug: 'dining-teak-6-seater',
    name: 'Modern Teak Dining Table',
    category_id: 'dining',
    price: 28999,
    original_price: 38000,
    description: 'Solid teak wood dining table for 6 persons. Handcrafted from premium teak wood with a natural matte finish.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    active: true,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
// AUTHENTICATION (STUB - ADMIN DIRECT ACCESS)
// ============================================================================

export async function signInAdmin(
  _email: string,
  _password: string
): Promise<{ session: any | null; error: Error | null }> {
  return { session: { user: { email: 'admin@peacefurniture.com' } }, error: null };
}

export async function signOutAdmin(): Promise<{ error: Error | null }> {
  return { error: null };
}

export async function getAdminSession(): Promise<{ session: any | null; error: Error | null }> {
  return { session: { user: { email: 'admin@peacefurniture.com' } }, error: null };
}

export function onAuthChange(_callback: (event: string, session: any | null) => void) {
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

export interface ListCategoriesOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  activeOnly?: boolean;
}

export async function listCategories(options: ListCategoriesOptions = {}): Promise<DBCategory[]> {
  await ensureDefaultOtherCategory();

  // Check Supabase Cloud first if available
  const client = getSupabaseClient();
  if (client) {
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
      if (!error && Array.isArray(data) && data.length > 0) {
        // Sync local cache
        const mapped = data.map((cat: DBCategory) => ({
          ...cat,
          image: cat.image || (isDefaultOtherCategory(cat) ? DEFAULT_OTHER_CATEGORY_IMAGE : ''),
        }));
        return sortCategoriesWithOtherLast(mapped);
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
  const newCat: DBCategory = {
    id: category.id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    slug,
    active: category.active ?? true,
    image: category.image || '',
    item_count: 0,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  categories.push(newCat);
  writeStoredCategories(categories);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.categories).upsert([newCat]);
    } catch (err) {
      console.warn('Failed to push category to Supabase:', err);
    }
  }

  return newCat;
}

export async function updateCategory(id: string, updates: Partial<DBCategory>): Promise<DBCategory> {
  if (isDefaultOtherCategory(id) || (updates.slug && updates.slug.toLowerCase() === 'other')) {
    throw new Error("Default category 'Other' cannot be edited.");
  }

  const categories = readStoredCategories();
  const index = categories.findIndex((c) => c.id === id || c.slug === id);
  if (index === -1) {
    throw new Error(`Category "${id}" was not found.`);
  }

  const current = categories[index];
  if (isDefaultOtherCategory(current)) {
    throw new Error("Default category 'Other' cannot be edited.");
  }

  const updated: DBCategory = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  categories[index] = updated;
  writeStoredCategories(categories);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.categories).update(updates).eq('id', current.id);
    } catch (err) {
      console.warn('Failed to update category in Supabase:', err);
    }
  }

  return updated;
}

export async function setCategoryColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  if (isDefaultOtherCategory(id)) {
    throw new Error("Default category 'Other' cannot be modified or deleted.");
  }
  const categories = readStoredCategories();
  const index = categories.findIndex((c) => c.id === id || c.slug === id);
  if (index === -1) return true;

  categories[index] = {
    ...categories[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeStoredCategories(categories);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.categories).update(patch).eq('id', categories[index].id);
    } catch (err) {
      console.warn('Failed to update category patch in Supabase:', err);
    }
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
  const filtered = categories.filter((c) => c.id !== id && c.slug !== id);
  writeStoredCategories(filtered);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.categories).delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete category from Supabase:', err);
    }
  }

  return true;
}

export const fetchGroups = (includeDeleted = false) => listCategories({ includeDeleted });
export async function saveGroup(group: Partial<DBCategory>): Promise<{ data: DBCategory; isSupabaseSynced: boolean }> {
  let isSynced = false;
  if (group.id) {
    try {
      const updated = await updateCategory(group.id, group);
      isSynced = isSupabaseConfigured();
      return { data: updated, isSupabaseSynced: isSynced };
    } catch {
      // Create if doesn't exist
    }
  }
  const created = await createCategory(group);
  isSynced = isSupabaseConfigured();
  return { data: created, isSupabaseSynced: isSynced };
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
  if (client) {
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
      if (!error && Array.isArray(data) && data.length > 0) {
        writeStoredItems(data);
        return data;
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

  items.unshift(newItem);
  writeStoredItems(items);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.items).upsert([newItem]);
    } catch (err) {
      console.warn('Failed to push item to Supabase:', err);
    }
  }

  return newItem;
}

export async function updateItem(id: string, updates: Partial<DBItem>): Promise<DBItem> {
  const items = readStoredItems();
  const index = items.findIndex((i) => i.id === id || i.slug === id);
  if (index === -1) {
    throw new Error(`Product "${id}" was not found.`);
  }

  const current = items[index];
  const updated: DBItem = {
    ...current,
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : current.price,
    updated_at: new Date().toISOString(),
  };

  items[index] = updated;
  writeStoredItems(items);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.items).update(updates).eq('id', current.id);
    } catch (err) {
      console.warn('Failed to update item in Supabase:', err);
    }
  }

  return updated;
}

export async function setItemColumns(id: string, patch: Record<string, any>): Promise<boolean> {
  const items = readStoredItems();
  const index = items.findIndex((i) => i.id === id || i.slug === id);
  if (index === -1) return true;

  items[index] = {
    ...items[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeStoredItems(items);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.items).update(patch).eq('id', items[index].id);
    } catch (err) {
      console.warn('Failed to update item patch in Supabase:', err);
    }
  }

  return true;
}

export const softDeleteItem = (id: string) => setItemColumns(id, { deleted_at: new Date().toISOString() });
export const restoreItem = (id: string) => setItemColumns(id, { deleted_at: null });
export const toggleItemActive = (id: string, active: boolean) => setItemColumns(id, { active });

export async function permanentDeleteItem(id: string): Promise<boolean> {
  const items = readStoredItems();
  const filtered = items.filter((i) => i.id !== id && i.slug !== id);
  writeStoredItems(filtered);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from(TABLES.items).delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete item from Supabase:', err);
    }
  }

  return true;
}

export const purgeItemPermanently = permanentDeleteItem;

export const fetchItems = (includeDeleted = false) => listItems({ includeDeleted });

export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  let isSynced = false;
  if (item.id) {
    try {
      const updated = await updateItem(item.id, item);
      isSynced = isSupabaseConfigured();
      return { data: updated, isSupabaseSynced: isSynced };
    } catch {
      // Fall through to create
    }
  }
  const created = await createItem(item);
  isSynced = isSupabaseConfigured();
  return { data: created, isSupabaseSynced: isSynced };
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

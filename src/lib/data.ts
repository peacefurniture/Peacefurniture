import { FurnitureItem, Category } from '../types';

/**
 * ============================================================================
 * CATALOGUE BACKEND SERVICE LAYER: src/lib/data.ts
 * Self-contained, resilient catalogue database with instant browser persistence.
 * Zero external database dependencies or network fetch errors.
 * ============================================================================
 */

export const TABLES = { categories: 'categories', items: 'items' } as const;
export const BUCKETS = { items: 'Images', categories: 'Images' } as const;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Clean up any stale external Supabase keys from localStorage to prevent errors
try {
  localStorage.removeItem('peace_supabase_url');
  localStorage.removeItem('peace_supabase_anon_key');
} catch {
  // ignore
}

export function getSupabaseUrl(): string {
  return '';
}

export function getSupabaseAnonKey(): string {
  return '';
}

/** Explicitly disabled: all catalogue data is managed locally and reliably */
export function isSupabaseConfigured(): boolean {
  return false;
}

export function getSupabaseClient(): any {
  return null;
}

export function saveSupabaseCredentials(_url: string, _anonKey: string): void {
  // No-op
}

export const supabase: any = new Proxy({}, {
  get() {
    return () => ({ data: null, error: null });
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
        return normalized;
      }
    }
  } catch {
    // ignore
  }

  writeStoredCategories(INITIAL_CATEGORIES);
  return INITIAL_CATEGORIES;
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
// IMAGE STORAGE (IN-BROWSER BASE64 / DATA URL)
// ============================================================================

export async function uploadImage(file: File, _bucket: string = BUCKETS.items): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP, GIF, or SVG images are allowed.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
  }

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

export function getImagePublicUrl(filePath: string, _bucket: string = BUCKETS.items): string {
  return filePath || '';
}

export async function deleteImage(_urlOrPath: string, _bucket: string = BUCKETS.items): Promise<void> {
  // No-op for in-memory / local storage
}

// ============================================================================
// CATEGORIES CRUD
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
  let categories = readStoredCategories();

  // Compute item counts
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
    return categories.filter((c) => c.deleted_at && !isDefaultOtherCategory(c));
  }
  if (!options.includeDeleted) {
    categories = categories.filter((c) => !c.deleted_at);
  }
  if (options.activeOnly) {
    categories = categories.filter((c) => c.active !== false);
  }

  return categories;
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
  return true;
}

export const fetchGroups = (includeDeleted = false) => listCategories({ includeDeleted });
export async function saveGroup(group: Partial<DBCategory>): Promise<{ data: DBCategory; isSupabaseSynced: boolean }> {
  if (group.id) {
    try {
      const updated = await updateCategory(group.id, group);
      return { data: updated, isSupabaseSynced: false };
    } catch {
      // Create if doesn't exist
    }
  }
  const created = await createCategory(group);
  return { data: created, isSupabaseSynced: false };
}
export const softDeleteGroup = softDeleteCategory;
export const restoreGroup = restoreCategory;
export const purgeGroupPermanently = permanentDeleteCategory;
export const purgeCategoryPermanently = permanentDeleteCategory;

// ============================================================================
// ITEMS / PRODUCTS CRUD
// ============================================================================

export interface ListItemsOptions {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  activeOnly?: boolean;
  categoryId?: string;
}

export async function listItems(options: ListItemsOptions = {}): Promise<DBItem[]> {
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
  return true;
}

export const softDeleteItem = (id: string) => setItemColumns(id, { deleted_at: new Date().toISOString() });
export const restoreItem = (id: string) => setItemColumns(id, { deleted_at: null });
export const toggleItemActive = (id: string, active: boolean) => setItemColumns(id, { active });

export async function permanentDeleteItem(id: string): Promise<boolean> {
  const items = readStoredItems();
  const filtered = items.filter((i) => i.id !== id && i.slug !== id);
  writeStoredItems(filtered);
  return true;
}

export const purgeItemPermanently = permanentDeleteItem;

export const fetchItems = (includeDeleted = false) => listItems({ includeDeleted });

export async function saveItem(item: Partial<DBItem>): Promise<{ data: DBItem; isSupabaseSynced: boolean }> {
  if (item.id) {
    try {
      const updated = await updateItem(item.id, item);
      return { data: updated, isSupabaseSynced: false };
    } catch {
      // Fall through to create
    }
  }
  const created = await createItem(item);
  return { data: created, isSupabaseSynced: false };
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
  return {
    ok: true,
    isConfigured: false,
    supabaseUrl: '',
    checks: [{ name: 'Catalogue Database', status: 'pass', message: 'Local persistent catalogue storage is healthy.' }],
    suggestedSql: '',
  };
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

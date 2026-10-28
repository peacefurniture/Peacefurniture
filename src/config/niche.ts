/**
 * PEACE FURNITURE STORE DATABASE CONFIGURATION
 *
 * Dedicated database schema and field definitions for PeaceFurniture store,
 * including product categories, furniture items, custom attributes, pricing, and promotions.
 */

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'text' | 'select' | 'tags' | 'json' | 'image' | 'array';
  required?: boolean;
  defaultValue?: any;
  showInAdminForm?: boolean;
  livesInAttributes?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  helpText?: string;
}

export interface NicheConfig {
  nicheId: string;
  brand: {
    name: string;
    tagline: string;
    logoSubtitle: string;
    primaryColor: string;
    accentColor: string;
  };
  labels: {
    groupSingular: string;
    groupPlural: string;
    itemSingular: string;
    itemPlural: string;
    promotionSingular: string;
    promotionPlural: string;
    currency: string;
    searchPlaceholder: string;
  };
  tables: {
    groups: string;
    items: string;
    promotions: string;
  };
  groupFields: FieldDefinition[];
  itemFields: FieldDefinition[];
  promotionFields: FieldDefinition[];
}

export const NICHE_CONFIG: NicheConfig = {
  nicheId: 'furniture',
  brand: {
    name: 'Peace Furniture House',
    tagline: 'Handcrafted Luxury & Modern Living Furniture',
    logoSubtitle: 'Furniture Catalogue',
    primaryColor: '#0F1115',
    accentColor: '#E11D2A',
  },
  labels: {
    groupSingular: 'Category',
    groupPlural: 'Categories',
    itemSingular: 'Product',
    itemPlural: 'Products',
    promotionSingular: 'Special Offer',
    promotionPlural: 'Special Offers',
    currency: '₹',
    searchPlaceholder: 'Search dining tables, sofas, king beds, office chairs...',
  },
  tables: {
    groups: 'groups',
    items: 'items',
    promotions: 'promotions',
  },
  groupFields: [
    { name: 'name', label: 'Category Name', type: 'string', required: true, showInAdminForm: true },
    { name: 'slug', label: 'Category Slug', type: 'string', required: false, showInAdminForm: true },
    { name: 'image', label: 'Image URL', type: 'image', required: false, showInAdminForm: true },
    { name: 'available', label: 'Active in Storefront', type: 'boolean', defaultValue: true, showInAdminForm: true },
  ],
  itemFields: [
    { name: 'name', label: 'Product Name', type: 'string', required: true, showInAdminForm: true },
    { name: 'group_id', label: 'Category', type: 'select', required: true, showInAdminForm: true },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, showInAdminForm: true },
    { name: 'original_price', label: 'Original Price', type: 'number', required: false, showInAdminForm: true },
    { name: 'description', label: 'Short Description', type: 'text', required: true, showInAdminForm: true },
    { name: 'image', label: 'Primary Image', type: 'image', required: true, showInAdminForm: true },
    { name: 'available', label: 'Active in Catalogue', type: 'boolean', defaultValue: true, showInAdminForm: true },
    { name: 'material', label: 'Material', type: 'string', showInAdminForm: true, livesInAttributes: true },
    { name: 'dimensions', label: 'Dimensions', type: 'string', showInAdminForm: true, livesInAttributes: true },
  ],
  promotionFields: [
    { name: 'title', label: 'Promo Title', type: 'string', required: true, showInAdminForm: true },
  ],
};

/**
 * Format currency using current niche settings
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return `${NICHE_CONFIG.labels.currency}0`;
  return `${NICHE_CONFIG.labels.currency}${amount.toLocaleString()}`;
}

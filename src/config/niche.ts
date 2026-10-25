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
  nicheId: string; // e.g. 'furniture', 'clothing', 'restaurant', 'salon', 'real_estate'
  brand: {
    name: string;
    tagline: string;
    logoSubtitle: string;
    primaryColor: string; // CSS color string or class accent
    accentColor: string;
  };
  labels: {
    groupSingular: string;      // e.g. "Category", "Collection", "Menu Section"
    groupPlural: string;        // e.g. "Categories", "Collections", "Menu Sections"
    itemSingular: string;       // e.g. "Furniture Item", "Product", "Dish", "Service"
    itemPlural: string;         // e.g. "Furniture Items", "Products", "Dishes", "Services"
    promotionSingular: string;  // e.g. "Special Offer", "Banner", "Deal"
    promotionPlural: string;    // e.g. "Special Offers", "Banners", "Deals"
    currency: string;           // e.g. "₹", "$", "€"
    searchPlaceholder: string;  // e.g. "Search wooden dining table, sofa, bed..."
  };
  groupFields: FieldDefinition[];
  itemFields: FieldDefinition[];
  promotionFields: FieldDefinition[];
}

export const NICHE_CONFIG: NicheConfig = {
  nicheId: 'furniture',
  brand: {
    name: 'PeaceFurniture',
    tagline: 'Handcrafted Luxury & Modern Living Furniture',
    logoSubtitle: 'Modern Living',
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
  groupFields: [
    { name: 'name', label: 'Category Name', type: 'string', required: true, showInAdminForm: true },
    { name: 'slug', label: 'Category Slug', type: 'string', required: false, showInAdminForm: true, helpText: 'Auto-generated if left blank' },
    { name: 'image', label: 'Image URL', type: 'image', required: false, showInAdminForm: true },
    { name: 'isActive', label: 'Active in Storefront', type: 'boolean', defaultValue: true, showInAdminForm: true },
  ],
  itemFields: [
    { name: 'name', label: 'Product Name', type: 'string', required: true, showInAdminForm: true },
    { name: 'group_id', label: 'Category', type: 'select', required: true, showInAdminForm: true },
    { name: 'price', label: 'Selling Price', type: 'number', required: true, showInAdminForm: true, defaultValue: 0 },
    { name: 'originalPrice', label: 'Original Price (MSRP)', type: 'number', required: false, showInAdminForm: true, defaultValue: 0 },
    { name: 'description', label: 'Short Description', type: 'text', required: true, showInAdminForm: true },
    { name: 'longDescription', label: 'Detailed Description', type: 'text', required: false, showInAdminForm: true },
    { name: 'image', label: 'Primary Image URL', type: 'image', required: true, showInAdminForm: true },
    { name: 'additionalImages', label: 'Gallery Images', type: 'array', required: false, showInAdminForm: true },
    { name: 'inStock', label: 'In Stock', type: 'boolean', defaultValue: true, showInAdminForm: true },
    { name: 'isPopular', label: 'Featured / Popular', type: 'boolean', defaultValue: false, showInAdminForm: true },
    { name: 'isActive', label: 'Active in Catalogue', type: 'boolean', defaultValue: true, showInAdminForm: true },

    // Dynamic niche attributes (stored in JSONB attributes column)
    { name: 'material', label: 'Material & Construction', type: 'string', showInAdminForm: true, livesInAttributes: true, defaultValue: 'Solid Hardwood' },
    { name: 'finish', label: 'Surface Finish', type: 'string', showInAdminForm: true, livesInAttributes: true, defaultValue: 'Natural Matte Polish' },
    { name: 'color', label: 'Color / Shade', type: 'string', showInAdminForm: true, livesInAttributes: true, defaultValue: 'Natural Grain' },
    { name: 'seatingCapacity', label: 'Seating Capacity (if applicable)', type: 'number', showInAdminForm: true, livesInAttributes: true },
    { name: 'dimensions', label: 'Dimensions (W x D x H)', type: 'string', showInAdminForm: true, livesInAttributes: true, defaultValue: '48 x 24 x 30 inches' },
    { name: 'warranty', label: 'Warranty Period', type: 'string', showInAdminForm: true, livesInAttributes: true, defaultValue: '5 Years Structural Warranty' },
    { name: 'tags', label: 'Search Keywords / Tags', type: 'tags', showInAdminForm: true, livesInAttributes: true, defaultValue: [] },
  ],
  promotionFields: [
    { name: 'title', label: 'Promo Title', type: 'string', required: true, showInAdminForm: true },
    { name: 'subtitle', label: 'Subtitle / Description', type: 'string', required: false, showInAdminForm: true },
    { name: 'discount_tag', label: 'Discount Tag (e.g. 20% OFF)', type: 'string', required: false, showInAdminForm: true },
    { name: 'image', label: 'Banner Image URL', type: 'image', required: false, showInAdminForm: true },
    { name: 'link_url', label: 'Target Link / Category', type: 'string', required: false, showInAdminForm: true },
    { name: 'autoplay', label: 'Auto-play in Banner', type: 'boolean', defaultValue: true, showInAdminForm: true },
  ],
};

/**
 * Format currency using current niche settings
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return `${NICHE_CONFIG.labels.currency}0`;
  return `${NICHE_CONFIG.labels.currency}${amount.toLocaleString()}`;
}

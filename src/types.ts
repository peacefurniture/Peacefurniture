export type CategoryId =
  | 'all'
  | 'sofas'
  | 'beds'
  | 'dining'
  | 'chairs'
  | 'wardrobes'
  | 'tv-units'
  | 'office'
  | 'storage'
  | 'outdoor'
  | 'kids'
  | 'decor'
  | string;

export interface Category {
  id: CategoryId;
  name: string;
  slug?: string;
  image: string;
  count: number;
  isActive?: boolean; // false means hidden/deactivated from public catalogue
  sort_order?: number;
  deleted_at?: string | null;
  attributes?: Record<string, any>;
}

export interface FurnitureItem {
  id: string;
  slug?: string;
  name: string;
  category: CategoryId;
  group_id?: string;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription?: string;
  image: string;
  additionalImages?: string[];
  dimensions?: {
    width: string;
    depth: string;
    height: string;
  } | string;
  material?: string;
  finish?: string;
  seatingCapacity?: number;
  color?: string;
  colorOptions?: { name: string; hex: string }[];
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  warranty?: string;
  isPopular?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean; // false means hidden/deactivated
  tags?: string[];
  sort_order?: number;
  deleted_at?: string | null;
  attributes?: Record<string, any>;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'super_admin' | 'store_manager';
}

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  material: string;
  seatingCapacity: number | null;
  inStockOnly: boolean;
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

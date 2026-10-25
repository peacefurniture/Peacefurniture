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
  | 'decor';

export interface Category {
  id: CategoryId;
  name: string;
  image: string;
  count: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription?: string;
  image: string;
  additionalImages?: string[];
  dimensions: {
    width: string;
    depth: string;
    height: string;
  };
  material: string;
  finish?: string;
  seatingCapacity?: number;
  color: string;
  colorOptions?: { name: string; hex: string }[];
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  warranty: string;
  isPopular?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean; // false means hidden/deactivated
  tags: string[];
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

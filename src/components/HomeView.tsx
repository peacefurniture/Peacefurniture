import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Category, CategoryId, FilterState, FurnitureItem } from '../types';
import { Hero } from './Hero';
import { CategoryGrid } from './CategoryGrid';
import { ProductCard } from './ProductCard';

interface HomeViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onOpenImageSearch: () => void;
  onFocusSearch: () => void;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  categories: Category[];
  products: FurnitureItem[];
  onViewDetails: (item: FurnitureItem) => void;
  filters: FilterState;
  onSortChange: (sortBy: FilterState['sortBy']) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenImageSearch,
  onFocusSearch,
  selectedCategory,
  onSelectCategory,
  categories,
  products,
  onViewDetails,
  filters,
  onSortChange,
}) => {
  const currentCategoryName =
    selectedCategory === 'all'
      ? 'All Furniture'
      : categories.find((c) => c.id === selectedCategory)?.name || 'All Furniture';

  return (
    <div className="pb-16 bg-[#FAFAFA] min-h-screen">
      {/* Hero with Banner & Floating Search Bar */}
      <Hero
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        onOpenImageSearch={onOpenImageSearch}
        onFocusSearch={onFocusSearch}
      />

      {/* Categories Grid */}
      <div className="mt-4 sm:mt-6">
        <CategoryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Main Furniture Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Section Heading & Sort dropdown */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/80 mb-5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {currentCategoryName}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              ({products.length} {products.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600 hidden xs:inline">
              Sort by
            </span>
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => onSortChange(e.target.value as FilterState['sortBy'])}
                className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-[#E11D2A]/20 cursor-pointer shadow-xs"
              >
                <option value="popular">Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Cards Grid - 2 cols on mobile */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-8 shadow-xs">
            <div className="w-12 h-12 bg-red-50 text-[#E11D2A] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold">∅</span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No products found in this category
            </h3>
            <p className="text-xs text-gray-500">
              Try selecting another category or check back soon for new arrivals!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

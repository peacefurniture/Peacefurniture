import React, { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Category, CategoryId } from '../types';
import { DEFAULT_OTHER_CATEGORY_IMAGE, isDefaultOtherCategory, sortCategoriesWithOtherLast } from '../lib/data';

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: CategoryId;
  onSelectCategory: (categoryId: CategoryId) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const activeCategories = useMemo(() => {
    const active = categories.filter((cat) => cat.isActive !== false);
    return sortCategoriesWithOtherLast(active);
  }, [categories]);

  const allItemsCard = (
    <button
      key="all"
      onClick={() => onSelectCategory('all')}
      className={`flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer select-none group border min-w-[78px] sm:min-w-0 sm:w-auto min-h-[76px] sm:min-h-[88px] shrink-0 snap-start ${
        selectedCategory === 'all'
          ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-md shadow-red-500/20 ring-2 ring-red-400/40'
          : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200/80 hover:border-gray-300 shadow-xs'
      }`}
    >
      <div
        className={`w-11 h-9 sm:w-14 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 ${
          selectedCategory === 'all' ? 'bg-white/20' : 'bg-red-50 text-[#E11D2A]'
        }`}
      >
        <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span
        className={`text-[11px] sm:text-xs font-bold mt-1 tracking-tight text-center truncate w-full ${
          selectedCategory === 'all' ? 'text-white' : 'text-gray-800 group-hover:text-gray-900'
        }`}
      >
        All Items
      </span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-1">
      {/* Mobile view: Swipeable horizontal carousel with snap points */}
      <div className="sm:hidden -mx-3 px-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5 pt-1 px-1 snap-x scroll-smooth">
          {allItemsCard}
          {activeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const isOther = isDefaultOtherCategory(cat);
            const imgSrc = cat.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : '');

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center justify-between p-2 rounded-2xl transition-all cursor-pointer select-none group border min-w-[80px] w-20 min-h-[76px] shrink-0 snap-start ${
                  isSelected
                    ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-md shadow-red-500/20 ring-2 ring-red-400/40'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200/80 shadow-xs'
                }`}
              >
                <div
                  className={`w-11 h-9 rounded-xl overflow-hidden flex items-center justify-center p-0.5 ${
                    isSelected ? 'bg-white/20' : 'bg-gray-50'
                  }`}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {cat.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-1 tracking-tight text-center truncate w-full ${
                    isSelected ? 'text-white font-bold' : 'text-gray-700'
                  }`}
                  title={cat.name}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablet & Desktop: Responsive multi-column grid */}
      <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-9 gap-2.5 sm:gap-3">
        {allItemsCard}
        {activeCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const isOther = isDefaultOtherCategory(cat);
          const imgSrc = cat.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : '');

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer select-none group border min-h-[88px] ${
                isSelected
                  ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-md shadow-red-500/20 ring-2 ring-red-400/40'
                  : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200/80 hover:border-gray-300 shadow-xs'
              }`}
            >
              <div
                className={`w-13 h-10 sm:w-14 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-white/20' : 'bg-gray-50'
                }`}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span
                className={`text-xs font-semibold mt-1 tracking-tight text-center truncate w-full ${
                  isSelected ? 'text-white font-bold' : 'text-gray-700 group-hover:text-gray-900'
                }`}
                title={cat.name}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

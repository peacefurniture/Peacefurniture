import React, { useMemo } from 'react';
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-2">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 sm:gap-3">
        {activeCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const isOther = isDefaultOtherCategory(cat);
          const imgSrc = cat.image || (isOther ? DEFAULT_OTHER_CATEGORY_IMAGE : '');

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer select-none group border min-h-[76px] sm:min-h-[88px] ${
                isSelected
                  ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-md shadow-red-500/20 ring-2 ring-red-400/40'
                  : 'bg-white hover:bg-gray-50/80 text-gray-800 border-gray-100 hover:border-gray-200 shadow-xs'
              }`}
            >
              {/* Category Thumbnail Image */}
              <div
                className={`w-11 h-9 sm:w-14 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-white/15' : 'bg-gray-50'
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
                  <div className="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-1 tracking-tight text-center truncate w-full ${
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

import React from 'react';
import { Category, CategoryId } from '../types';

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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2.5 sm:gap-3.5">
        {categories.filter((cat) => cat.isActive !== false).map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer select-none group border ${
                isSelected
                  ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-md shadow-red-500/20 ring-2 ring-red-400/40'
                  : 'bg-white hover:bg-gray-50/80 text-gray-800 border-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              {/* Category Thumbnail Image */}
              <div
                className={`w-12 h-10 sm:w-14 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-white/15' : 'bg-gray-50'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] sm:text-xs font-semibold mt-1.5 tracking-tight text-center truncate w-full ${
                  isSelected ? 'text-white font-bold' : 'text-gray-700 group-hover:text-gray-900'
                }`}
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

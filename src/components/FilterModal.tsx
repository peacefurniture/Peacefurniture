import React from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Category, FilterState } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: FilterState;
  onUpdateFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  categories,
  filters,
  onUpdateFilters,
  onResetFilters,
  totalFilteredCount,
}) => {
  if (!isOpen) return null;

  const materials = [
    'All Materials',
    'Solid Wood',
    'Solid Teak Wood',
    'Solid Sheesham Wood',
    'Fabric',
    'Mesh',
    'Marble',
    'Engineered Wood',
  ];

  const capacities = [
    { label: 'Any', value: null },
    { label: '2 Seater', value: 2 },
    { label: '3-4 Seater', value: 4 },
    { label: '6 Seater', value: 6 },
    { label: '8 Seater', value: 8 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
            Filter Catalogue
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Category selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories
                .filter((cat) => cat.isActive !== false)
                .slice(0, 9)
                .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onUpdateFilters({ ...filters, category: cat.id })}
                  className={`text-xs py-2 px-2.5 rounded-xl border font-semibold truncate transition-all cursor-pointer ${
                    filters.category === cat.id
                      ? 'bg-[#E11D2A] text-white border-[#E11D2A] shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Max Price
              </label>
              <span className="text-xs font-extrabold text-[#E11D2A]">
                ₹ {filters.maxPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={60000}
              step={1000}
              value={filters.maxPrice}
              onChange={(e) =>
                onUpdateFilters({ ...filters, maxPrice: Number(e.target.value) })
              }
              className="w-full accent-[#E11D2A] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>₹5,000</span>
              <span>₹60,000</span>
            </div>
          </div>

          {/* Material */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2.5">
              Material & Construction
            </label>
            <div className="flex flex-wrap gap-2">
              {materials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => onUpdateFilters({ ...filters, material: mat })}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    filters.material === mat
                      ? 'bg-red-50 text-[#E11D2A] border-red-300 font-bold'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Seating Capacity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2.5">
              Seating Capacity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {capacities.map((cap) => (
                <button
                  key={cap.label}
                  onClick={() =>
                    onUpdateFilters({ ...filters, seatingCapacity: cap.value })
                  }
                  className={`text-xs py-2 px-2 rounded-xl border font-semibold text-center transition-all cursor-pointer ${
                    filters.seatingCapacity === cap.value
                      ? 'bg-[#E11D2A] text-white border-[#E11D2A]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>

          {/* In-Stock Only */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-gray-800 block">In-Stock Only</span>
              <span className="text-[11px] text-gray-500">Show only available items</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateFilters({ ...filters, inStockOnly: !filters.inStockOnly })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                filters.inStockOnly ? 'bg-[#E11D2A]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                  filters.inStockOnly ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={onResetFilters}
            className="text-gray-600 hover:text-gray-900 text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Show {totalFilteredCount} Items</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Trash2, Heart, ArrowRight } from 'lucide-react';
import { FurnitureItem } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: FurnitureItem[];
  onRemove: (item: FurnitureItem) => void;
  onViewDetails: (item: FurnitureItem) => void;
  onClearAll: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  onRemove,
  onViewDetails,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Top header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#E11D2A] fill-[#E11D2A]" />
            <h3 className="font-extrabold text-gray-900 text-base">
              Saved Items ({wishlistItems.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist list */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {wishlistItems.length > 0 ? (
            wishlistItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  onClick={() => {
                    onViewDetails(item);
                    onClose();
                  }}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-100 cursor-pointer flex-shrink-0 hover:opacity-90"
                />

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => {
                      onViewDetails(item);
                      onClose();
                    }}
                    className="font-bold text-gray-900 text-xs sm:text-sm truncate cursor-pointer hover:text-[#E11D2A]"
                  >
                    {item.name}
                  </h4>
                  <div className="text-sm font-extrabold text-[#E11D2A] mt-0.5">
                    ₹ {item.price.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-gray-500 capitalize">{item.category}</span>
                </div>

                <div className="flex flex-col gap-1 items-end">
                  <button
                    onClick={() => onRemove(item)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onViewDetails(item);
                      onClose();
                    }}
                    className="text-[11px] font-bold text-[#E11D2A] hover:underline flex items-center gap-0.5"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#E11D2A] flex items-center justify-center mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <p className="font-bold text-gray-800 text-sm mb-1">Your wishlist is empty</p>
              <p className="text-xs text-gray-500 max-w-xs">
                Tap the heart icon on any sofa, bed, dining table, or chair to save your favorite designs!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
            <button
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                alert(`Your wishlist of ${wishlistItems.length} items has been forwarded to our design consultants.`);
                onClose();
              }}
              className="bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Enquire All Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

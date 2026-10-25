import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FurnitureItem } from '../types';

interface ProductCardProps {
  product: FurnitureItem;
  onViewDetails: (product: FurnitureItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* In-Stock or Tag indicator */}
        {product.originalPrice && (
          <span className="absolute bottom-2.5 left-2.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Card Info Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 hover:text-[#E11D2A] transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base sm:text-lg font-extrabold text-[#E11D2A]">
              ₹ {product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹ {product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* View Details Button */}
        <div className="mt-3.5 pt-1">
          <button
            onClick={() => onViewDetails(product)}
            className="w-full bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm group/btn"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

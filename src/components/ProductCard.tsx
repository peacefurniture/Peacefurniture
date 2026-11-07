import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FurnitureItem } from '../types';
import { formatCurrency } from '../config/niche';

interface ProductCardProps {
  product: FurnitureItem;
  onViewDetails: (product: FurnitureItem) => void;
  aiMatchScore?: number;
  aiMatchReason?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  aiMatchScore,
  aiMatchReason,
}) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* AI Match Badge */}
        {aiMatchScore !== undefined && (
          aiMatchScore >= 99 ? (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 shadow-md border border-amber-300/40">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-200 text-amber-200" />
              <span>🎯 Exact (100%)</span>
            </span>
          ) : aiMatchScore >= 80 ? (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-emerald-600/95 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 shadow-md border border-emerald-400/30">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-emerald-200 text-emerald-200" />
              <span>✨ Similar ({aiMatchScore}%)</span>
            </span>
          ) : (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-amber-600/95 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 shadow-md border border-amber-300/30">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-200 text-amber-200" />
              <span>Match ({aiMatchScore}%)</span>
            </span>
          )
        )}

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 bg-gray-900/85 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md">
            Save {formatCurrency(product.originalPrice - product.price)}
          </span>
        )}
      </div>

      {/* Card Info Body */}
      <div className="p-2.5 sm:p-3.5 md:p-4 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1 sm:space-y-1.5">
          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-gray-900 text-xs sm:text-sm md:text-base leading-snug line-clamp-2 hover:text-[#E11D2A] transition-colors cursor-pointer min-h-[2rem] sm:min-h-[2.5rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg font-black text-[#E11D2A]">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* AI Match Reason callout */}
          {aiMatchReason && (
            <p className="text-[10px] sm:text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-semibold flex items-start gap-1 leading-tight line-clamp-1">
              <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{aiMatchReason}</span>
            </p>
          )}

          {/* Description (desktop & tablet preview) */}
          <p className="hidden sm:block text-[11px] sm:text-xs text-gray-500 leading-relaxed font-normal line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* View Details Button */}
        <div className="pt-1">
          <button
            onClick={() => onViewDetails(product)}
            className="w-full bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white py-2 sm:py-2.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs min-h-[40px] sm:min-h-[44px] group/btn"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

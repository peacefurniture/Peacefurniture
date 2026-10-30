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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
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
            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-amber-300/40">
              <Sparkles className="w-3 h-3 fill-amber-200 text-amber-200" />
              <span>🎯 Exact Match (100%)</span>
            </span>
          ) : aiMatchScore >= 80 ? (
            <span className="absolute top-2.5 left-2.5 bg-emerald-600/95 text-white backdrop-blur-md text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-emerald-400/30">
              <Sparkles className="w-3 h-3 fill-emerald-200 text-emerald-200" />
              <span>✨ Highly Similar ({aiMatchScore}%)</span>
            </span>
          ) : (
            <span className="absolute top-2.5 left-2.5 bg-amber-600/95 text-white backdrop-blur-md text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-amber-300/30">
              <Sparkles className="w-3 h-3 fill-amber-200 text-amber-200" />
              <span>💡 Somewhat Similar ({aiMatchScore}%)</span>
            </span>
          )
        )}

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="absolute bottom-2.5 left-2.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Save {formatCurrency(product.originalPrice - product.price)}
          </span>
        )}
      </div>

      {/* Card Info Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Product Title (Full Title Shown) */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-gray-900 text-sm sm:text-base leading-snug hover:text-[#E11D2A] transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base sm:text-lg font-extrabold text-[#E11D2A]">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* AI Match Reason callout */}
          {aiMatchReason && (
            <p className="text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl mt-2 font-semibold flex items-start gap-1.5 leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{aiMatchReason}</span>
            </p>
          )}

          {/* Description */}
          <p className="text-xs text-gray-600 mt-2 leading-relaxed font-normal">
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

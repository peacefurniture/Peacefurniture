import React, { useState } from 'react';
import { X, Star, ShieldCheck, Truck, Check, ArrowRight, Ruler, Package } from 'lucide-react';
import { FurnitureItem } from '../types';
import { formatCurrency } from '../config/niche';

interface ProductDetailsModalProps {
  product: FurnitureItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentMainImage = product.image;

  const formatDimensions = (dims: any) => {
    if (!dims) return 'Standard Size';
    if (typeof dims === 'string') return dims;
    if (typeof dims === 'object' && dims.width) {
      return `${dims.width} (W) × ${dims.depth || ''} (D) × ${dims.height || ''} (H)`;
    }
    return String(dims);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 sm:backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E11D2A] bg-red-50 px-2.5 py-1 rounded-full">
            Product Specifications
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gallery Left Column */}
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shadow-xs">
                <img
                  src={currentMainImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>

            </div>

            {/* Info Right Column */}
            <div className="space-y-4">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg sm:text-2xl leading-tight">
                  {product.name}
                </h2>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating || 4.8}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    ({product.reviewsCount || 12} Verified Customer Reviews)
                  </span>
                </div>
              </div>

              {/* Price & Badge */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-[#E11D2A]">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through ml-2">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    product.inStock
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.inStock ? '✓ In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Overview & Details
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {product.longDescription || product.description}
                </p>
              </div>

              {/* Specifications Box */}
              <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#E11D2A]" />
                  <span>Product Specifications</span>
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Dimensions</span>
                    <span className="font-semibold text-gray-800">
                      {formatDimensions(product.dimensions)}
                    </span>
                  </div>
                  {product.material && (
                    <div>
                      <span className="text-gray-400 block">Material</span>
                      <span className="font-semibold text-gray-800">{product.material}</span>
                    </div>
                  )}
                  {product.finish && (
                    <div>
                      <span className="text-gray-400 block">Finish</span>
                      <span className="font-semibold text-gray-800">{product.finish}</span>
                    </div>
                  )}
                  {product.seatingCapacity && (
                    <div>
                      <span className="text-gray-400 block">Capacity</span>
                      <span className="font-semibold text-gray-800">
                        {product.seatingCapacity} Persons
                      </span>
                    </div>
                  )}
                  {product.warranty && (
                    <div>
                      <span className="text-gray-400 block">Warranty</span>
                      <span className="font-semibold text-gray-800">{product.warranty}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#E11D2A] hover:bg-[#C51322] text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/20"
          >
            <span>Close Window</span>
          </button>
        </div>
      </div>
    </div>
  );
};

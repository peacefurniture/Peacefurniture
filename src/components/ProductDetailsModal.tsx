import React, { useState } from 'react';
import { X, Heart, Star, ShieldCheck, Ruler, Sparkles, Check, Share2 } from 'lucide-react';
import { FurnitureItem } from '../types';

interface ProductDetailsModalProps {
  product: FurnitureItem | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (item: FurnitureItem) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !product) return null;

  const activeImage = selectedImage || product.image;
  const allImages = [product.image, ...(product.additionalImages || [])];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {product.category}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
              title="Share item"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleWishlist(product)}
              className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
              title="Add to wishlist"
            >
              <Heart
                className={`w-5 h-5 ${
                  isWishlisted ? 'fill-[#E11D2A] text-[#E11D2A]' : 'text-gray-500'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Photo & Thumbnails */}
          <div>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute top-3 left-3 bg-[#E11D2A] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                In Stock & Ready to Ship
              </span>
            </div>

            {/* Thumbnails row if more than 1 image */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 mt-3">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === img
                        ? 'border-[#E11D2A] scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Heading, Rating, Price */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                <span>{product.rating}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                {product.reviewsCount} verified customer reviews
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {product.name}
            </h2>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-[#E11D2A]">
                ₹ {product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    ₹ {product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                    Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color Options */}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                Color Options: <span className="font-semibold text-gray-600">{selectedColor || product.color}</span>
              </label>
              <div className="flex items-center gap-2.5">
                {product.colorOptions.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      (selectedColor || product.color) === c.name
                        ? 'border-[#E11D2A] bg-red-50/50 text-[#E11D2A] font-bold ring-1 ring-[#E11D2A]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Overview & Materials
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
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
                  {product.dimensions.width} (W) × {product.dimensions.depth} (D) × {product.dimensions.height} (H)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Primary Material</span>
                <span className="font-semibold text-gray-800">{product.material}</span>
              </div>
              {product.finish && (
                <div>
                  <span className="text-gray-400 block">Finish</span>
                  <span className="font-semibold text-gray-800">{product.finish}</span>
                </div>
              )}
              {product.seatingCapacity && (
                <div>
                  <span className="text-gray-400 block">Seating Capacity</span>
                  <span className="font-semibold text-gray-800">
                    {product.seatingCapacity} Persons
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400 block">Warranty</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 inline" />
                  {product.warranty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Call to actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center gap-3">
          <button
            onClick={() => onToggleWishlist(product)}
            className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isWishlisted
                ? 'border-[#E11D2A] text-[#E11D2A] bg-red-50/60'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#E11D2A]' : ''}`} />
            <span>{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              alert(`Enquiry submitted for "${product.name}". Our Peace Furniture design advisor will contact you within 2 hours!`);
              onClose();
            }}
            className="flex-1 bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white py-3 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enquire / Book Free Showroom Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

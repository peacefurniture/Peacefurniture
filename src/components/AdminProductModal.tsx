import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Category, CategoryId, FurnitureItem } from '../types';
import { uploadImage, generateUniqueSlug } from '../lib/data';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: FurnitureItem) => void;
  initialProduct?: FurnitureItem | null;
  categories: Category[];
  existingProducts?: FurnitureItem[];
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  categories,
  existingProducts = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<FurnitureItem>>({
    name: '',
    category: 'dining',
    price: 19999,
    originalPrice: 24999,
    description: '',
    longDescription: '',
    image: '',
    dimensions: {
      width: '60 inches',
      depth: '36 inches',
      height: '30 inches',
    },
    material: 'Solid Wood & Premium Cushioning',
    finish: 'Teak Wood Natural Matte',
    color: 'Natural Teak',
    seatingCapacity: 6,
    rating: 4.8,
    reviewsCount: 12,
    inStock: true,
    isActive: true,
    warranty: '5 Years Manufacturer Warranty',
    tags: ['furniture', 'dining table'],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setFormData({ ...initialProduct });
      setTagInput(initialProduct.tags?.join(', ') || '');
      setUploadedImageName(initialProduct.name ? `${initialProduct.name} Photo` : 'Existing Product Image');
      setImageError('');
    } else {
      setFormData({
        name: '',
        category: categories.length > 1 ? categories[1].id : 'dining',
        price: 24999,
        originalPrice: 32000,
        description: '',
        longDescription: '',
        image: '',
        dimensions: {
          width: '60 inches',
          depth: '36 inches',
          height: '30 inches',
        },
        material: 'Solid Teak Wood',
        finish: 'Natural Matte Polish',
        color: 'Natural Wood',
        seatingCapacity: 6,
        rating: 4.8,
        reviewsCount: 0,
        inStock: true,
        isActive: true,
        warranty: '5 Years Frame Warranty',
        tags: ['furniture', 'modern'],
      });
      setUploadedImageName('');
      setTagInput('furniture, modern');
      setImageError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [initialProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Process uploaded image file
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size too large. Please select an image under 5MB.');
      return;
    }

    setIsUploading(true);
    setImageError('');
    
    try {
      const publicUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, image: publicUrl }));
      setUploadedImageName(file.name);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setImageError(err.message || 'Failed to upload image to Supabase Storage. Ensure an "Images" bucket exists and has public select permissions.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
    setUploadedImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (!formData.image) {
      setImageError('Please upload an image for this product.');
      return;
    }

    const tagsArray = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const productNameTrimmed = formData.name.trim();
    const generatedSlug = generateUniqueSlug(
      productNameTrimmed,
      existingProducts,
      initialProduct?.id
    );

    const validCategories = categories.filter((cat) => cat.id !== 'all' && !cat.deleted_at);
    const resolvedCategory = formData.category || (validCategories[0]?.id || '');

    const completeProduct: FurnitureItem = {
      id: initialProduct?.id || `product-${Date.now()}`,
      slug: generatedSlug,
      name: productNameTrimmed,
      category: resolvedCategory as CategoryId,
      price: Number(formData.price) || 9999,
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      description: formData.description || 'High quality furniture made with premium materials.',
      longDescription: formData.longDescription || formData.description,
      image: formData.image,
      dimensions: formData.dimensions || { width: '48"', depth: '24"', height: '30"' },
      material: formData.material || 'Solid Wood',
      finish: formData.finish || 'Natural Finish',
      color: formData.color || 'Natural',
      seatingCapacity: formData.seatingCapacity,
      rating: formData.rating || 4.8,
      reviewsCount: formData.reviewsCount || 0,
      inStock: formData.inStock ?? true,
      isActive: formData.isActive ?? true,
      warranty: formData.warranty || '5 Years Warranty',
      tags: tagsArray.length > 0 ? tagsArray : ['furniture', formData.category || 'decor'],
    };

    onSave(completeProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 sm:backdrop-blur-xs flex items-center justify-center sm:p-4">
      {/* Container: Full screen on mobile, floating dialog on desktop */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 bg-gray-50/90 sticky top-0 z-10 flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
              {initialProduct ? 'Edit Furniture Item' : 'Add New Furniture Item'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500">
              {initialProduct ? 'Update specifications or photo' : 'Upload photo & publish listing'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
          {/* Active / Inactive Status Field */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Active / Inactive
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    Boolean(formData.isActive)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      Boolean(formData.isActive) ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  {Boolean(formData.isActive) ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500">
                {Boolean(formData.isActive)
                  ? 'Active (Visible to customers in the catalog)'
                  : 'Inactive (Hidden from customers)'}
              </p>
            </div>

            {/* Toggle Switch Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(formData.isActive)}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out p-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 select-none ${
                  Boolean(formData.isActive) ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                title={`Status: ${Boolean(formData.isActive) ? 'Active' : 'Inactive'}. Click to toggle.`}
              >
                <span className="sr-only">Toggle Active status</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    Boolean(formData.isActive) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Product Image Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Product Photo (Upload) *
              </label>
              <span className="text-[10px] sm:text-[11px] text-gray-400">
                Tap to upload from device
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {formData.image ? (
              /* Image Uploaded & Preview Card */
              <div className="border border-gray-200 rounded-2xl p-3 sm:p-4 bg-gray-50/70 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="relative w-full sm:w-36 h-36 sm:h-28 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                      <span className="text-[10px] font-bold text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <img
                      src={formData.image}
                      alt="Uploaded Product"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!isUploading && (
                    <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Photo Ready
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full min-w-0 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full mb-1">
                    <Check className="w-3 h-3" />
                    <span>Upload Successful</span>
                  </span>
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                    {uploadedImageName || 'Custom Photo'}
                  </h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ready for catalogue display.
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-initial bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                      <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Dropzone for Uploading Image */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-[#E11D2A] bg-red-50/70 scale-[1.01]'
                    : 'border-gray-300 hover:border-[#E11D2A] hover:bg-red-50/20 active:bg-red-50/30'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 text-[#E11D2A] flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-xs">
                  {isUploading ? (
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2] animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                  )}
                </div>
                <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm mb-1">
                  {isUploading ? 'Uploading image to Supabase...' : 'Tap to upload photo from your phone or PC'}
                </h4>
                <p className="text-[11px] text-gray-500">
                  Accepts PNG, JPG, JPEG, WEBP files
                </p>
                {!isUploading && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 bg-[#E11D2A] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Image File</span>
                  </div>
                )}
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{imageError}</span>
              </div>
            )}
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 6 Seater Wooden Dining Table"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                required
                value={formData.category || (categories.filter((cat) => cat.id !== 'all' && !cat.deleted_at)[0]?.id || '')}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as CategoryId })
                }
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
              >
                {categories
                  .filter((cat) => cat.id !== 'all' && !cat.deleted_at)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                {categories.filter((cat) => cat.id !== 'all' && !cat.deleted_at).length === 0 && (
                  <option value="" disabled>
                    No category created yet (Please add a category first)
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="28999"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Original Price (₹)
              </label>
              <input
                type="number"
                min={1}
                value={formData.originalPrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="38000"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
              />
            </div>

            <div className="xs:col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Inventory Stock
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  formData.inStock
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}
              >
                {formData.inStock ? '✓ In Stock' : '✕ Out of Stock'}
              </button>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Short Description *
            </label>
            <input
              type="text"
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Solid wood dining table with 6 chairs. Modern design."
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
            />
          </div>

          {/* Long Overview Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Overview
            </label>
            <textarea
              rows={2}
              value={formData.longDescription || ''}
              onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
              placeholder="Material details, ergonomics, care instructions..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
            />
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Material
              </label>
              <input
                type="text"
                value={formData.material || ''}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Solid Teak Wood"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E11D2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Dimensions
              </label>
              <input
                type="text"
                value={
                  typeof formData.dimensions === 'object' && formData.dimensions !== null
                    ? formData.dimensions.width
                    : typeof formData.dimensions === 'string'
                    ? formData.dimensions
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: e.target.value,
                  })
                }
                placeholder="72W × 36D × 30H in"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E11D2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Warranty
              </label>
              <input
                type="text"
                value={formData.warranty || ''}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="5 Years Warranty"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E11D2A]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Search Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="dining, solid wood, 6 seater"
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A]"
            />
          </div>
        </form>

        {/* Sticky Footer on Mobile & Desktop */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-500/20"
          >
            <Check className="w-4 h-4" />
            <span>{initialProduct ? 'Save Changes' : 'Add Product'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

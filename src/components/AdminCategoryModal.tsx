import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Trash2, RefreshCw, AlertCircle, Layers, Lock } from 'lucide-react';
import { Category } from '../types';
import { uploadImage, generateUniqueSlug, isDefaultOtherCategory } from '../lib/data';

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  initialCategory?: Category | null;
  existingCategories?: Category[];
}

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  existingCategories = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    image: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialCategory) {
      setFormData({ ...initialCategory, isActive: initialCategory.isActive ?? true });
      setUploadedImageName(initialCategory.name ? `${initialCategory.name} Photo` : 'Existing Category Image');
      setImageError('');
    } else {
      setFormData({
        name: '',
        image: '',
        isActive: true,
      });
      setUploadedImageName('');
      setImageError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }));
    setUploadedImageName('');
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      setImageError(err.message || 'Failed to upload image. Ensure an "Images" bucket exists in Supabase.');
    } finally {
      setIsUploading(false);
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

  const isDefaultCategory = isDefaultOtherCategory(initialCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDefaultCategory) {
      setImageError("The default 'Other' category is permanent and cannot be edited.");
      return;
    }
    if (!formData.name?.trim()) return;

    const nameTrimmed = formData.name.trim();
    if (nameTrimmed.toLowerCase() === 'other') {
      setImageError("The 'Other' category already exists as the permanent default category. Please choose a different category name.");
      return;
    }

    if (!formData.image) {
      setImageError('Please provide an image for this category.');
      return;
    }

    const generatedSlug = generateUniqueSlug(
      nameTrimmed,
      existingCategories,
      initialCategory?.id
    );

    if (generatedSlug.toLowerCase() === 'other') {
      setImageError("The slug 'other' is reserved for the default category. Please choose a different category name.");
      return;
    }

    const generatedId =
      initialCategory?.id ||
      generatedSlug ||
      `cat-${Date.now()}`;

    const completeCategory: Category = {
      id: generatedId,
      slug: generatedSlug,
      name: nameTrimmed,
      image: formData.image,
      count: initialCategory?.count || 0,
      isActive: formData.isActive ?? true,
    };

    onSave(completeCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 sm:backdrop-blur-xs flex items-center justify-center sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 bg-gray-50/90 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E11D2A] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">
                {initialCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {initialCategory ? 'Update category name or thumbnail' : 'Create a new collection category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Locked Banner */}
        {isDefaultCategory && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>The default <strong>Other</strong> category (slug: <code>other</code>) is permanent and cannot be edited or deleted.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* Active / Inactive Status Field */}
          <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Active / Inactive
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    formData.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      formData.isActive !== false ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  {formData.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500">
                {formData.isActive !== false
                  ? 'Active (Visible to customers in store)'
                  : 'Inactive (Hidden from customers)'}
              </p>
            </div>

            {/* Toggle Switch Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={formData.isActive !== false}
                onClick={() => setFormData({ ...formData, isActive: formData.isActive === false ? true : false })}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out p-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 select-none ${
                  formData.isActive !== false ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                title={`Status: ${formData.isActive !== false ? 'Active' : 'Inactive'}. Click to toggle.`}
              >
                <span className="sr-only">Toggle Active status</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formData.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Lighting, Recliners, Bookshelves"
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
            />
          </div>

          {/* Category Image Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category Thumbnail *
              </label>
              <span className="text-[11px] text-gray-400">Tap to upload photo</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {formData.image ? (
              <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/70 flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border border-white shadow-xs flex items-center justify-center">
                  {isUploading ? (
                    <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                  ) : (
                    <img src={formData.image} alt="Category Thumbnail" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                    <Check className="w-3 h-3" />
                    <span>Image Ready</span>
                  </span>
                  <p className="text-xs font-bold text-gray-800 truncate">{uploadedImageName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                      <span>{isUploading ? 'Uploading...' : 'Change'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-[#E11D2A] bg-red-50' : 'border-gray-300 hover:border-[#E11D2A] hover:bg-red-50/20'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 text-[#E11D2A] mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#E11D2A] mx-auto mb-2" />
                )}
                <p className="font-bold text-gray-900 text-xs mb-1">
                  {isUploading ? 'Uploading to Supabase...' : 'Tap to upload category image'}
                </p>
                <p className="text-[11px] text-gray-400">PNG, JPG, WEBP under 5MB</p>
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{imageError}</span>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial bg-[#E11D2A] hover:bg-[#C51322] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20"
          >
            <Check className="w-4 h-4" />
            <span>{initialCategory ? 'Save Changes' : 'Add Category'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

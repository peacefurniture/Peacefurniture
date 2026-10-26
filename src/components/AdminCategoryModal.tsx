import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Trash2, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { Category } from '../types';

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  initialCategory?: Category | null;
}

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCategory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    image: '',
    isActive: true,
  });

  const categoryPresets = [
    { label: 'Living Room', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' },
    { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80' },
    { label: 'Dining', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80' },
    { label: 'Office', url: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=400&q=80' },
    { label: 'Outdoor', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' },
    { label: 'Decor', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80' },
  ];

  useEffect(() => {
    if (initialCategory) {
      setFormData({ ...initialCategory, isActive: initialCategory.isActive ?? true });
      setUploadedImageName('Existing Category Image');
      setImageError('');
    } else {
      setFormData({
        name: '',
        image: categoryPresets[0].url,
        isActive: true,
      });
      setUploadedImageName('Default Sample Photo');
      setImageError('');
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({ ...prev, image: result }));
      setUploadedImageName(file.name);
      setImageError('');
    };
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (!formData.image) {
      setImageError('Please provide an image for this category.');
      return;
    }

    const nameTrimmed = formData.name.trim();
    const generatedId =
      initialCategory?.id ||
      nameTrimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `cat-${Date.now()}`;

    const completeCategory: Category = {
      id: generatedId,
      slug: formData.slug || undefined,
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* Active / Hidden Status Banner */}
          <div
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors ${
              formData.isActive !== false
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  formData.isActive !== false
                    ? 'bg-emerald-500 ring-4 ring-emerald-200'
                    : 'bg-amber-500 ring-4 ring-amber-200'
                }`}
              />
              <div>
                <span className="font-bold text-xs sm:text-sm block">
                  Status: {formData.isActive !== false ? 'Active (Public)' : 'Hidden / Deactivated'}
                </span>
                <span className="text-[10px] sm:text-[11px] opacity-80 block">
                  {formData.isActive !== false
                    ? 'Visible in store category grid & navigation'
                    : 'Hidden from public store category grid'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: formData.isActive === false ? true : false })}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                formData.isActive !== false
                  ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {formData.isActive !== false ? 'Deactivate / Hide' : 'Activate Category'}
            </button>
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
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              URL Slug (Optional)
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. lighting"
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
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border border-white shadow-xs">
                  <img src={formData.image} alt="Category Thumbnail" className="w-full h-full object-cover" />
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
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
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
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-[#E11D2A] bg-red-50' : 'border-gray-300 hover:border-[#E11D2A] hover:bg-red-50/20'
                }`}
              >
                <Upload className="w-6 h-6 text-[#E11D2A] mx-auto mb-2" />
                <p className="font-bold text-gray-900 text-xs mb-1">Tap to upload category image</p>
                <p className="text-[11px] text-gray-400">PNG, JPG, WEBP under 5MB</p>
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0">Presets:</span>
              {categoryPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, image: p.url }));
                    setUploadedImageName(p.label);
                    setImageError('');
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 cursor-pointer whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
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

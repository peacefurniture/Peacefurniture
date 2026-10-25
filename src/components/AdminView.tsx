import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { AdminUser, FurnitureItem } from '../types';
import { CATEGORIES } from '../data/furnitureData';
import { HomeCraftLogo } from './HomeCraftLogo';

interface AdminViewProps {
  adminUser: AdminUser;
  products: FurnitureItem[];
  onAddProduct: () => void;
  onEditProduct: (product: FurnitureItem) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleActive: (productId: string) => void;
  onLogout: () => void;
  onGoToStore: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  adminUser,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleActive,
  onLogout,
  onGoToStore,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Metrics
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isActive !== false).length;
  const hiddenCount = products.filter((p) => p.isActive === false).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Visibility filter
      const isActive = item.isActive !== false;
      if (visibilityFilter === 'active' && !isActive) return false;
      if (visibilityFilter === 'hidden' && isActive) return false;

      return true;
    });
  }, [products, searchTerm, selectedCategory, visibilityFilter]);

  const itemToDelete = products.find((p) => p.id === deleteConfirmId);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-gray-900 pb-24 sm:pb-16">
      {/* Top Admin Navigation Header - Fully Mobile Responsive */}
      <header className="sticky top-0 z-40 bg-[#0F1115] border-b border-gray-800 text-white px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onGoToStore}
              className="sm:hidden text-white/80 hover:text-white p-1 rounded-lg"
              title="Back to Public Catalogue"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <HomeCraftLogo size="sm" showSubtitle={false} />
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Admin User Info (Desktop) */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-gray-200 block leading-tight">{adminUser.name}</span>
                <span className="text-[10px] text-gray-400">{adminUser.email}</span>
              </div>
            </div>

            {/* Back to Public Catalogue */}
            <button
              onClick={onGoToStore}
              className="bg-white/10 hover:bg-white/15 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="View Public Catalogue"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Store</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-400 hover:bg-white/5 p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-950 tracking-tight">
              Catalogue Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Add, edit, deactivate, or delete furniture listings.
            </p>
          </div>

          <button
            onClick={onAddProduct}
            className="w-full sm:w-auto bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Analytics Metric Cards - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Products
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 sm:mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Active in Store
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1 block">
                {activeCount}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Hidden / Inactive
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1 block">
                {hiddenCount}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Out of Stock
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 sm:mt-1 block">
                {outOfStockCount}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar - Mobile Responsive */}
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs mb-4 sm:mb-6 flex flex-col gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, category, material..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#E11D2A] cursor-pointer"
            >
              <option value="all">All Categories ({products.length})</option>
              {CATEGORIES.slice(1).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Visibility Filter Buttons */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center justify-between sm:justify-start gap-1 border border-gray-200">
              <button
                onClick={() => setVisibilityFilter('all')}
                className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  visibilityFilter === 'all' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setVisibilityFilter('active')}
                className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  visibilityFilter === 'active'
                    ? 'bg-white shadow-xs text-emerald-700'
                    : 'text-gray-500'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setVisibilityFilter('hidden')}
                className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  visibilityFilter === 'hidden'
                    ? 'bg-white shadow-xs text-amber-700'
                    : 'text-gray-500'
                }`}
              >
                Hidden ({hiddenCount})
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW (Displayed on screens < 768px for perfect touch mobile ergonomics) */}
        <div className="md:hidden space-y-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((item) => {
              const isActive = item.isActive !== false;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-xs transition-all ${
                    !isActive ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'
                  }`}
                >
                  {/* Top: Image + Info */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <EyeOff className="w-5 h-5 text-amber-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="capitalize bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        {item.inStock ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Price & Visibility Tag */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-[#E11D2A] text-sm">
                            ₹ {item.price.toLocaleString('en-IN')}
                          </span>
                          {item.originalPrice && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹ {item.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Eye className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Mobile Touch Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    {/* Hide/Activate */}
                    <button
                      onClick={() => onToggleActive(item.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 border-amber-200 active:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 active:bg-emerald-100'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditProduct(item)}
                      className="py-2 px-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="py-2 px-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-200">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-gray-800 text-sm">No products found</p>
              <p className="text-xs text-gray-500 mt-1">Try another search or filter.</p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Displayed on screens >= 768px) */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4 sm:px-6">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Public Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item) => {
                    const isActive = item.isActive !== false;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          !isActive ? 'bg-gray-50/40 opacity-75' : ''
                        }`}
                      >
                        {/* Product info & image */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              {!isActive && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <EyeOff className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 truncate max-w-xs sm:max-w-sm">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-gray-500 truncate max-w-xs">
                                {item.material} • {item.dimensions.width}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="capitalize bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {item.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#E11D2A]">
                            ₹ {item.price.toLocaleString('en-IN')}
                          </div>
                          {item.originalPrice && (
                            <div className="text-[11px] text-gray-400 line-through">
                              ₹ {item.originalPrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4">
                          {item.inStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Out of Stock
                            </span>
                          )}
                        </td>

                        {/* Status (Active vs Hidden) */}
                        <td className="py-3.5 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-xl">
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Hide / Activate Toggle */}
                            <button
                              onClick={() => onToggleActive(item.id)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Deactivate / Hide product from public' : 'Activate product'}
                            >
                              {isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditProduct(item)}
                              className="p-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-gray-700 text-sm">No products found</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Try adjusting your search query or filter options.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Mobile Friendly */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#E11D2A] flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-base mb-1">Delete Product?</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <span className="font-bold text-gray-800">"{itemToDelete?.name}"</span> from the catalogue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteProduct(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

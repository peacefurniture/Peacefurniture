import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ExternalLink,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Database,
  Save,
} from 'lucide-react';
import { Category, FurnitureItem } from '../types';
import { HomeCraftLogo } from './HomeCraftLogo';

interface AdminViewProps {
  products: FurnitureItem[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: FurnitureItem) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleActive: (productId: string) => void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToggleActiveCategory: (categoryId: string) => void;
  onStoreToDatabase: () => void;
  isSyncingToDb: boolean;
  lastSyncedAt: string | null;
  onGoToStore: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleActive,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleActiveCategory,
  onStoreToDatabase,
  isSyncingToDb,
  lastSyncedAt,
  onGoToStore,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'supabase'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryVisibilityFilter, setCategoryVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);

  // Category Metrics
  const totalCategoryCount = categories.filter((c) => c.id !== 'all').length;
  const activeCategoryCount = categories.filter((c) => c.id !== 'all' && c.isActive !== false).length;
  const hiddenCategoryCount = categories.filter((c) => c.id !== 'all' && c.isActive === false).length;

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.id !== 'all')
      .filter((cat) => {
        const isActive = cat.isActive !== false;
        if (categoryVisibilityFilter === 'active' && !isActive) return false;
        if (categoryVisibilityFilter === 'hidden' && isActive) return false;

        if (!categorySearchTerm.trim()) return true;
        const q = categorySearchTerm.toLowerCase().trim();
        return cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
      });
  }, [categories, categorySearchTerm, categoryVisibilityFilter]);

  // Metrics
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isActive !== false).length;
  const hiddenCount = products.filter((p) => p.isActive === false).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }

      const isActive = item.isActive !== false;
      if (visibilityFilter === 'active' && !isActive) return false;
      if (visibilityFilter === 'hidden' && isActive) return false;

      return true;
    });
  }, [products, searchTerm, selectedCategoryFilter, visibilityFilter]);

  const itemToDelete = products.find((p) => p.id === deleteConfirmId);
  const categoryToDelete = categories.find((c) => c.id === deleteCategoryConfirmId);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-gray-900 pb-24 sm:pb-16">
      {/* Top Admin Navigation Header */}
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
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onGoToStore}
              className="bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Public Catalogue"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exit to Store</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage furniture listings, collections, and database persistence.
          </p>
        </div>

        {/* DATABASE STORAGE CARD (Matching User Screenshot Style) */}
        <div className="bg-[#F2FBF7] border border-[#D1F3E2] rounded-3xl p-4 sm:p-5 mb-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E1F7EC] text-[#0D9446] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Database className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-[#0F172A] text-base sm:text-lg">
                    Catalogue Database Storage
                  </h3>
                  <span className="bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border border-[#BBF7D0]">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                    Database Active ({totalCount} Products, {categories.length - 1} Categories)
                  </span>
                  <span className="bg-[#E2E8F0] text-[#334155] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    Supabase Cloud Connected
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  All catalogue details (products, descriptions, prices, categories, images) are persisted to the database.
                </p>
                {lastSyncedAt && (
                  <p className="text-[11px] text-[#16A34A] font-semibold mt-1">
                    Last Cloud Sync: {lastSyncedAt}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onStoreToDatabase}
              disabled={isSyncingToDb}
              className="bg-[#0D9446] hover:bg-[#0B7A3A] active:bg-[#09622F] disabled:opacity-50 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 whitespace-nowrap"
            >
              <Save className={`w-4 h-4 ${isSyncingToDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingToDb ? 'Saving to Database...' : 'Save Changes to Database'}</span>
            </button>
          </div>
        </div>

        {/* 1. STATUS BAR / ANALYTICS METRIC CARDS */}
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

        {/* 2. PRODUCTS & CATEGORIES TAB BUTTONS & ACTION BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#E11D2A] text-white shadow-md shadow-red-500/25'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({totalCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#E11D2A] text-white shadow-md shadow-red-500/25'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({categories.length - 1})</span>
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-[#3ECF8E] text-slate-950 font-black shadow-md shadow-emerald-500/25'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase Backend</span>
            </button>
          </div>

          {activeTab === 'products' && (
            <button
              onClick={onAddProduct}
              className="bg-[#0D9446] hover:bg-[#0B7A3A] active:bg-[#09622F] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}

          {activeTab === 'categories' && (
            <button
              onClick={onAddCategory}
              className="bg-[#0D9446] hover:bg-[#0B7A3A] active:bg-[#09622F] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>

        {activeTab === 'products' ? (
          <>
            {/* 3. SEARCH BAR & FILTERS */}
            <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs mb-4 sm:mb-6 flex flex-col gap-2.5 sm:gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative w-full flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search product, category, material..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:bg-white"
                  />
                </div>
                <button
                  onClick={onAddProduct}
                  className="bg-[#E11D2A] hover:bg-[#c81622] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#E11D2A] cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {categories.slice(1).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

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

            {/* Mobile Card View */}
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
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          {!isActive && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <EyeOff className="w-5 h-5 text-amber-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">
                            {item.name}
                          </h4>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="capitalize bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {categories.find((c) => c.id === item.category)?.name || item.category}
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

                          <div className="flex items-center justify-between mt-2">
                            <span className="font-black text-[#E11D2A] text-sm">
                              ₹ {item.price.toLocaleString('en-IN')}
                            </span>
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

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => onToggleActive(item.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Hide' : 'Show'}</span>
                        </button>
                        <button
                          onClick={() => onEditProduct(item)}
                          className="py-2 px-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="py-2 px-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center gap-1.5 cursor-pointer"
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
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-6">Product Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((item) => {
                        const isActive = item.isActive !== false;

                        return (
                          <tr key={item.id} className={`hover:bg-gray-50/70 transition-colors ${!isActive ? 'bg-gray-50/40 opacity-75' : ''}`}>
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  {!isActive && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <EyeOff className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 truncate max-w-xs">{item.name}</h4>
                                  <p className="text-[11px] text-gray-500 truncate max-w-xs">{item.material}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="capitalize bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                {categories.find((c) => c.id === item.category)?.name || item.category}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-[#E11D2A]">
                                ₹ {item.price.toLocaleString('en-IN')}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {item.inStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  In Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                  Out of Stock
                                </span>
                              )}
                            </td>

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

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onToggleActive(item.id)}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={isActive ? 'Hide' : 'Show'}
                                >
                                  {isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => onEditProduct(item)}
                                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 cursor-pointer"
                                  title="Delete"
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
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* CATEGORIES MANAGEMENT TAB */
          <div>
            {/* 3. SEARCH BAR & FILTERS FOR CATEGORIES */}
            <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs mb-4 sm:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  placeholder="Search category by name or ID..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#E11D2A] focus:bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-between sm:justify-end">
                <div className="bg-gray-100 p-1 rounded-xl flex items-center justify-between sm:justify-start gap-1 border border-gray-200 w-full sm:w-auto">
                  <button
                    onClick={() => setCategoryVisibilityFilter('all')}
                    className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      categoryVisibilityFilter === 'all' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    All ({totalCategoryCount})
                  </button>
                  <button
                    onClick={() => setCategoryVisibilityFilter('active')}
                    className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      categoryVisibilityFilter === 'active'
                        ? 'bg-white shadow-xs text-emerald-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Active ({activeCategoryCount})
                  </button>
                  <button
                    onClick={() => setCategoryVisibilityFilter('hidden')}
                    className={`flex-1 sm:flex-initial text-center text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      categoryVisibilityFilter === 'hidden'
                        ? 'bg-white shadow-xs text-amber-700'
                        : 'text-gray-500'
                    }`}
                  >
                    Hidden ({hiddenCategoryCount})
                  </button>
                </div>

                <button
                  onClick={onAddCategory}
                  className="bg-[#E11D2A] hover:bg-[#c81622] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>


            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const isCatActive = cat.isActive !== false;
                  const productCount = products.filter((p) => p.category === cat.id && p.isActive !== false).length;

                  return (
                    <div
                      key={cat.id}
                      className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col justify-between gap-3 group transition-all ${
                        !isCatActive ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            {!isCatActive && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <EyeOff className="w-5 h-5 text-amber-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-sm truncate">{cat.name}</h3>
                              {isCatActive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                  <Eye className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hidden</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {cat.id}</p>
                            <span className="inline-block mt-1 text-[11px] font-bold text-[#E11D2A] bg-red-50 px-2 py-0.5 rounded-md">
                              {productCount} {productCount === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => onToggleActiveCategory(cat.id)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                            isCatActive
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={isCatActive ? 'Hide Category' : 'Show Category'}
                        >
                          {isCatActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{isCatActive ? 'Hide' : 'Show'}</span>
                        </button>
                        <button
                          onClick={() => onEditCategory(cat)}
                          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCategoryConfirmId(cat.id)}
                          className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-200">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-gray-800 text-sm">No categories match your search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#3ECF8E]/15 text-[#0D9446] flex items-center justify-center font-black">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-950">Supabase Backend Integration</h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Connect your external Supabase database project for permanent cloud storage.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Step 1: SQL Schema */}
              <div className="bg-slate-900 rounded-2xl p-5 text-slate-100 text-xs font-mono relative">
                <div className="flex items-center justify-between mb-3 text-slate-400 font-sans text-xs font-bold">
                  <span>1. Execute this SQL Script in your Supabase SQL Editor:</span>
                  <button
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, image TEXT, count INTEGER DEFAULT 0, "isActive" BOOLEAN DEFAULT true);\nCREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, price NUMERIC NOT NULL, "originalPrice" NUMERIC, description TEXT, "longDescription" TEXT, image TEXT, "additionalImages" TEXT[], dimensions JSONB, material TEXT, finish TEXT, "seatingCapacity" INTEGER, color TEXT, rating NUMERIC DEFAULT 5.0, "reviewsCount" INTEGER DEFAULT 0, "inStock" BOOLEAN DEFAULT true, warranty TEXT, "isPopular" BOOLEAN DEFAULT false, "isActive" BOOLEAN DEFAULT true, tags TEXT[]);`;
                      navigator.clipboard.writeText(sql);
                      alert('✅ SQL Schema copied to clipboard!');
                    }}
                    className="bg-[#3ECF8E] hover:bg-[#34B27B] text-slate-950 px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Copy SQL Schema
                  </button>
                </div>
                <pre className="overflow-x-auto p-3 bg-slate-950 rounded-xl text-[11px] leading-relaxed text-emerald-400">
{`-- Categories Table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  count INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true
);

-- Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  "originalPrice" NUMERIC,
  description TEXT,
  image TEXT,
  material TEXT,
  color TEXT,
  "inStock" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true
);`}
                </pre>
              </div>

              {/* Step 2: Secret Credentials info */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs sm:text-sm leading-relaxed">
                <h4 className="font-extrabold mb-1 flex items-center gap-2 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  2. Provide Your Supabase API Keys
                </h4>
                <p className="mb-2">
                  Paste your Supabase credentials into the project's <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">.env</code> file or share them directly in chat:
                </p>
                <div className="bg-white/80 p-3 rounded-xl font-mono text-xs text-slate-800 space-y-1 border border-amber-200">
                  <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
                  <div>VITE_SUPABASE_ANON_KEY="your-anon-key"</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Product Confirmation Modal */}
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
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
                className="flex-1 py-2.5 rounded-xl bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategoryConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#E11D2A] flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-base mb-1">Delete Category?</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to delete category{' '}
              <span className="font-bold text-gray-800">"{categoryToDelete?.name}"</span>? Any associated products will be reassigned to Decor.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteCategoryConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteCategoryConfirmId) {
                    onDeleteCategory(deleteCategoryConfirmId);
                    setDeleteCategoryConfirmId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

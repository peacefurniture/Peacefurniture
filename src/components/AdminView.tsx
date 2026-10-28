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
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  LogOut,
  Lock,
} from 'lucide-react';
import { Category, FurnitureItem } from '../types';
import { HomeCraftLogo } from './HomeCraftLogo';
import { NICHE_CONFIG } from '../config/niche';
import {
  isSupabaseConfigured,
  restoreItem,
  restoreGroup,
  purgeItemPermanently,
  purgeGroupPermanently,
  DEFAULT_OTHER_CATEGORY_IMAGE,
  sortCategoriesWithOtherLast,
} from '../lib/data';

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
  onRestoreCategory?: (categoryId: string) => void;
  onPurgeCategory?: (categoryId: string) => void;
  onRestoreProduct?: (productId: string) => void;
  onPurgeProduct?: (productId: string) => void;
  onStoreToDatabase: () => void;
  isSyncingToDb: boolean;
  lastSyncedAt: string | null;
  onGoToStore: () => void;
  onSignOut?: () => void;
  onOpenDatabaseSettings?: () => void;
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
  onRestoreCategory,
  onPurgeCategory,
  onRestoreProduct,
  onPurgeProduct,
  onStoreToDatabase,
  isSyncingToDb,
  lastSyncedAt,
  onGoToStore,
  onSignOut,
  onOpenDatabaseSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'trash'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryVisibilityFilter, setCategoryVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);

  // Labels from config
  const labels = NICHE_CONFIG.labels;

  // Category Metrics
  const totalCategoryCount = categories.filter((c) => c.id !== 'all').length;
  const activeCategoryCount = categories.filter((c) => c.id !== 'all' && c.isActive !== false).length;
  const hiddenCategoryCount = categories.filter((c) => c.id !== 'all' && c.isActive === false).length;

  // Trashed Items
  const trashedItems = useMemo(() => {
    return products.filter((p) => p.deleted_at);
  }, [products]);

  const trashedCategories = useMemo(() => {
    return categories.filter((c) => c.deleted_at);
  }, [categories]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    const list = categories
      .filter((cat) => cat.id !== 'all' && !cat.deleted_at)
      .filter((cat) => {
        const isActive = cat.isActive !== false;
        if (categoryVisibilityFilter === 'active' && !isActive) return false;
        if (categoryVisibilityFilter === 'hidden' && isActive) return false;

        if (!categorySearchTerm.trim()) return true;
        const q = categorySearchTerm.toLowerCase().trim();
        return cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
      });
    return sortCategoriesWithOtherLast(list);
  }, [categories, categorySearchTerm, categoryVisibilityFilter]);

  // Metrics
  const nonDeletedProducts = useMemo(() => products.filter((p) => !p.deleted_at), [products]);
  const totalCount = nonDeletedProducts.length;
  const activeCount = nonDeletedProducts.filter((p) => p.isActive !== false).length;
  const hiddenCount = nonDeletedProducts.filter((p) => p.isActive === false).length;
  const outOfStockCount = nonDeletedProducts.filter((p) => !p.inStock).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return nonDeletedProducts.filter((item) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesMat = item.material ? item.material.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCat && !matchesMat) return false;
      }

      if (selectedCategoryFilter !== 'all') {
        const selectedCat = categories.find((c) => c.id === selectedCategoryFilter || c.slug === selectedCategoryFilter);
        const matchesCategory =
          item.category === selectedCategoryFilter ||
          (selectedCat && (item.category === selectedCat.id || item.category === selectedCat.slug));
        if (!matchesCategory) return false;
      }

      const isActive = item.isActive !== false;
      if (visibilityFilter === 'active' && !isActive) return false;
      if (visibilityFilter === 'hidden' && isActive) return false;

      return true;
    });
  }, [nonDeletedProducts, searchTerm, selectedCategoryFilter, visibilityFilter]);


  return (
    <div className="min-h-screen bg-[#F5F6F8] text-gray-900 pb-24 sm:pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
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

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sign Out of Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Catalogue Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage {labels.itemPlural.toLowerCase()} & {labels.groupPlural.toLowerCase()} in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            <button
              onClick={onStoreToDatabase}
              disabled={isSyncingToDb}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isSyncingToDb
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSyncingToDb ? 'Saving Catalogue...' : 'Save & Refresh'}</span>
            </button>

            {activeTab === 'products' ? (
              <button
                onClick={onAddProduct}
                className="bg-[#E11D2A] hover:bg-[#C51322] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add {labels.itemSingular}</span>
              </button>
            ) : activeTab === 'categories' ? (
              <button
                onClick={onAddCategory}
                className="bg-[#E11D2A] hover:bg-[#C51322] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add {labels.groupSingular}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Sync Timestamp Bar */}
        {lastSyncedAt && (
          <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Database last synced at: <strong>{lastSyncedAt}</strong></span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-[#E11D2A] text-[#E11D2A]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{labels.itemPlural} ({nonDeletedProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#E11D2A] text-[#E11D2A]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{labels.groupPlural} ({totalCategoryCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'trash'
                ? 'border-[#E11D2A] text-[#E11D2A]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash ({trashedItems.length + trashedCategories.length})</span>
          </button>
        </div>

        {/* TAB 1: ITEMS / PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${labels.itemPlural.toLowerCase()}...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E11D2A]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All {labels.groupPlural}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All Visibility</option>
                  <option value="active">Active Only</option>
                  <option value="hidden">Hidden Only</option>
                </select>
              </div>
            </div>

            {/* Mobile Card View (shown under md break point) */}
            <div className="block md:hidden space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 font-medium text-xs">
                  No {labels.itemPlural.toLowerCase()} found matching your filter.
                </div>
              ) : (
                filteredProducts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug truncate">
                            {item.name}
                          </h4>
                          <span className="font-extrabold text-[#E11D2A] text-sm flex-shrink-0">
                            {labels.currency}{item.price.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize font-medium">
                            {categories.find((c) => c.id === item.category || c.slug === item.category)?.name || item.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              item.inStock
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Bar with minimum 44px tap targets */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => onToggleActive(item.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] ${
                          item.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {item.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span>{item.isActive !== false ? 'Active' : 'Hidden'}</span>
                      </button>

                      <button
                        onClick={() => onEditProduct(item)}
                        className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onDeleteProduct(item.id)}
                        className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                        title="Soft Delete (Trash)"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only sm:not-sr-only">Trash</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Products Table (shown on md and larger) */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider font-extrabold text-gray-500">
                      <th className="py-3 px-4">{labels.itemSingular}</th>
                      <th className="py-3 px-4">{labels.groupSingular}</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                          No {labels.itemPlural.toLowerCase()} found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                              />
                              <div>
                                <span className="font-bold text-gray-900 block truncate max-w-xs">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-gray-400 line-clamp-1">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-600 capitalize">
                            {categories.find((c) => c.id === item.category || c.slug === item.category)?.name || item.category}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-gray-900">
                            {labels.currency}{item.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                item.inStock
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onToggleActive(item.id)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                item.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {item.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{item.isActive !== false ? 'Active' : 'Hidden'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onEditProduct(item)}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(item.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Soft Delete (Trash)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUPS / CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  placeholder={`Search ${labels.groupPlural.toLowerCase()}...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#E11D2A]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryVisibilityFilter}
                  onChange={(e) => setCategoryVisibilityFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="all">All Visibility</option>
                  <option value="active">Active Only</option>
                  <option value="hidden">Hidden Only</option>
                </select>
              </div>
            </div>

            {/* Mobile Categories Cards (shown under md break point) */}
            <div className="block md:hidden space-y-3">
              {filteredCategories.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 font-medium text-xs">
                  No {labels.groupPlural.toLowerCase()} found matching your filter.
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isDefaultCategory = cat.slug === 'other' || cat.id === 'other' || cat.name?.toLowerCase() === 'other';
                  const count = products.filter(
                    (p) => (p.category === cat.id || (isDefaultCategory && (p.category === 'other' || !p.category))) && !p.deleted_at
                  ).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {cat.image || (isDefaultCategory ? DEFAULT_OTHER_CATEGORY_IMAGE : '') ? (
                          <img
                            src={cat.image || DEFAULT_OTHER_CATEGORY_IMAGE}
                            alt={cat.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                            {isDefaultCategory ? <Lock className="w-5 h-5 text-amber-600" /> : '#'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{cat.name}</h4>
                            {isDefaultCategory && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">slug: {cat.slug || 'other'}</span>
                            <span className="text-xs text-gray-500 font-semibold">• {count} {labels.itemPlural}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Actions with 44px tap targets */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        {isDefaultCategory ? (
                          <div className="w-full bg-gray-50 py-2.5 px-3 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-2 min-h-[44px] select-none border border-gray-200/80">
                            <Lock className="w-4 h-4 text-amber-600" />
                            <span>Permanent Default Category (Locked)</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onToggleActiveCategory(cat.id)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] ${
                                cat.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {cat.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              <span>{cat.isActive !== false ? 'Active' : 'Hidden'}</span>
                            </button>

                            <button
                              onClick={() => onEditCategory(cat)}
                              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => onDeleteCategory(cat.id)}
                              className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only sm:not-sr-only">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Categories Table (shown on md and larger) */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider font-extrabold text-gray-500">
                      <th className="py-3 px-4">{labels.groupSingular} Name</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredCategories.map((cat, idx) => {
                      const isDefaultCategory = cat.slug === 'other' || cat.id === 'other' || cat.name?.toLowerCase() === 'other';
                      const count = products.filter(
                        (p) => (p.category === cat.id || (isDefaultCategory && (p.category === 'other' || !p.category))) && !p.deleted_at
                      ).length;
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {cat.image || (isDefaultCategory ? DEFAULT_OTHER_CATEGORY_IMAGE : '') ? (
                                <img
                                  src={cat.image || DEFAULT_OTHER_CATEGORY_IMAGE}
                                  alt={cat.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                                  {isDefaultCategory ? <Lock className="w-4 h-4 text-amber-600" /> : '#'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{cat.name}</span>
                                  {isDefaultCategory && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      <Lock className="w-2.5 h-2.5" />
                                      Permanent Default
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 block font-mono">slug: {cat.slug || 'other'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-600">
                            {count} {labels.itemPlural}
                          </td>
                          <td className="py-3 px-4">
                            {isDefaultCategory ? (
                              <span
                                className="px-2.5 py-1 text-[10px] font-bold rounded-xl flex items-center gap-1 bg-emerald-50 text-emerald-700 w-fit select-none"
                                title="Permanent Default Category is always active"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Permanent Active</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => onToggleActiveCategory(cat.id)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer ${
                                  cat.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {cat.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{cat.isActive !== false ? 'Active' : 'Hidden'}</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isDefaultCategory ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-lg select-none"
                                  title="Default category cannot be edited or deleted"
                                >
                                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Locked</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onEditCategory(cat)}
                                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteCategory(cat.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRASH (30-Day Soft Delete & Restore) */}
        {activeTab === 'trash' && (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
              <span className="font-bold block mb-1">🗑️ Soft-Deleted Trash Bin</span>
              Deleted items and categories remain preserved here. You can restore them back to your live catalogue anytime or permanently purge them.
            </div>

            {/* Trashed Categories Section */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E11D2A]" />
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Trashed {labels.groupPlural} ({trashedCategories.length})
                  </h3>
                </div>
                <span className="text-[11px] text-gray-400">
                  {trashedCategories.length === 1 ? '1 category in trash' : `${trashedCategories.length} categories in trash`}
                </span>
              </div>

              {trashedCategories.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">No trashed {labels.groupPlural.toLowerCase()}.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trashedCategories.map((cat) => (
                    <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-10 h-10 rounded-xl object-cover opacity-60 border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs flex-shrink-0">
                            #
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-800 line-through">{cat.name}</span>
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-md">
                              Deleted
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span className="font-mono">slug: {cat.slug}</span>
                            {cat.deleted_at && (
                              <span>• {new Date(cat.deleted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            if (onRestoreCategory) {
                              onRestoreCategory(cat.id);
                            } else {
                              await restoreGroup(cat.id);
                              onStoreToDatabase();
                            }
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Restore category to active catalogue"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Permanently delete category "${cat.name}"? This cannot be undone.`)) {
                              if (onPurgeCategory) {
                                onPurgeCategory(cat.id);
                              } else {
                                await purgeGroupPermanently(cat.id);
                                onStoreToDatabase();
                              }
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Purge permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trashed Products Section */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#E11D2A]" />
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Trashed {labels.itemPlural} ({trashedItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-gray-400">
                  {trashedItems.length === 1 ? '1 item in trash' : `${trashedItems.length} items in trash`}
                </span>
              </div>

              {trashedItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">No trashed {labels.itemPlural.toLowerCase()}.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trashedItems.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover opacity-60 border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs flex-shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-800 line-through">{item.name}</span>
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-md">
                              Deleted
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span>₹{item.price.toLocaleString()}</span>
                            {item.deleted_at && (
                              <span>• {new Date(item.deleted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            if (onRestoreProduct) {
                              onRestoreProduct(item.id);
                            } else {
                              await restoreItem(item.id);
                              onStoreToDatabase();
                            }
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Restore product to active catalogue"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
                              if (onPurgeProduct) {
                                onPurgeProduct(item.id);
                              } else {
                                await purgeItemPermanently(item.id);
                                onStoreToDatabase();
                              }
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Purge permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

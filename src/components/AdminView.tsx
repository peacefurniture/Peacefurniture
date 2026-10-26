import React, { useState, useMemo, useEffect } from 'react';
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
  Activity,
  Check,
  X,
  Copy,
} from 'lucide-react';
import { Category, FurnitureItem } from '../types';
import { HomeCraftLogo } from './HomeCraftLogo';
import { NICHE_CONFIG } from '../config/niche';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { isSupabaseConfigured, getSupabaseUrl } from '../lib/supabase';
import {
  runDatabaseHealthCheck,
  HealthCheckResult,
  restoreItem,
  restoreGroup,
  purgeItemPermanently,
  reorderItems,
  reorderGroups,
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
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'trash' | 'health'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryVisibilityFilter, setCategoryVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);

  // Health Diagnostics State
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isHealthCheckLoading, setIsHealthCheckLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Run Health Check when opening health tab
  const handleRunHealthCheck = async () => {
    setIsHealthCheckLoading(true);
    try {
      const res = await runDatabaseHealthCheck();
      setHealthResult(res);
    } catch {
      // ignore
    } finally {
      setIsHealthCheckLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'health') {
      handleRunHealthCheck();
    }
  }, [activeTab]);

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
    return categories
      .filter((cat) => cat.id !== 'all' && !cat.deleted_at)
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

      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }

      const isActive = item.isActive !== false;
      if (visibilityFilter === 'active' && !isActive) return false;
      if (visibilityFilter === 'hidden' && isActive) return false;

      return true;
    });
  }, [nonDeletedProducts, searchTerm, selectedCategoryFilter, visibilityFilter]);

  // Move item up / down for sort reordering
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const list = [...filteredProducts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderedIds = list.map((i) => i.id);
    await reorderItems(orderedIds);
  };

  // Move category up / down
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const list = [...filteredCategories];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const orderedIds = list.map((c) => c.id);
    await reorderGroups(orderedIds);
  };

  const copySqlSchema = () => {
    const sql = `
-- COPY THIS INTO YOUR SUPABASE SQL EDITOR TO FIX ALL TABLES, COLUMNS & RLS POLICIES:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  item_count INT DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC,
  description TEXT,
  image TEXT,
  additional_images TEXT[] DEFAULT '{}'::text[],
  attributes JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update item_count in categories
CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE categories SET item_count = item_count + 1 WHERE id = NEW.category_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE categories SET item_count = item_count - 1 WHERE id = OLD.category_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
      IF (OLD.category_id IS NOT NULL) THEN
        UPDATE categories SET item_count = item_count - 1 WHERE id = OLD.category_id;
      END IF;
      IF (NEW.category_id IS NOT NULL) THEN
        UPDATE categories SET item_count = item_count + 1 WHERE id = NEW.category_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_category_item_count ON items;
CREATE TRIGGER trg_update_category_item_count
AFTER INSERT OR DELETE OR UPDATE OF category_id ON items
FOR EACH ROW EXECUTE FUNCTION update_category_item_count();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public write categories" ON categories;
CREATE POLICY "Public write categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public write items" ON items;
CREATE POLICY "Public write items" ON items FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
    `;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const isConnected = isSupabaseConfigured();
  const currentUrl = getSupabaseUrl();

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
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            </button>

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
        {/* Supabase Status Banner */}
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
            isConnected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/90 border-amber-200/90 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">
                  {isConnected ? 'Supabase Live Database Active' : 'Running in Local Memory Mode'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {isConnected
                  ? `Connected to Supabase project: ${currentUrl}`
                  : 'Edits are storing in browser local memory because Supabase URL/Key are not set yet.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              isConnected
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-amber-800 hover:bg-amber-900 text-white'
            }`}
          >
            {isConnected ? 'Manage Supabase Keys' : '⚡ Connect Supabase Now'}
          </button>
        </div>

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
              <Database className="w-4 h-4" />
              <span>{isSyncingToDb ? 'Syncing to Supabase...' : 'Save & Sync Cloud DB'}</span>
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

          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'health'
                ? 'border-[#E11D2A] text-[#E11D2A]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>DB Health Diagnostic</span>
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

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider font-extrabold text-gray-500">
                      <th className="py-3 px-4">Order</th>
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
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveItem(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(idx, 'down')}
                                disabled={idx === filteredProducts.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
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
                            {categories.find((c) => c.id === item.category)?.name || item.category}
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

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider font-extrabold text-gray-500">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">{labels.groupSingular} Name</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredCategories.map((cat, idx) => {
                      const count = products.filter((p) => p.category === cat.id && !p.deleted_at).length;
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveCategory(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveCategory(idx, 'down')}
                                disabled={idx === filteredCategories.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                              />
                              <span className="font-bold text-gray-900">{cat.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-600">
                            {count} {labels.itemPlural}
                          </td>
                          <td className="py-3 px-4">
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
                          </td>
                          <td className="py-3 px-4 text-right">
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
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
              <span className="font-bold block mb-1">🗑️ Soft-Deleted Trash Bin</span>
              Items in trash remain preserved for 30 days. You can restore them to active status anytime or permanently purge them.
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4">
              <h3 className="font-extrabold text-sm mb-3">Trashed {labels.itemPlural}</h3>
              {trashedItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No trashed items.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trashedItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover opacity-60" />
                        <div>
                          <span className="font-bold text-xs text-gray-800 line-through">{item.name}</span>
                          <span className="text-[10px] text-gray-400 block">Deleted: {item.deleted_at}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await restoreItem(item.id);
                            onStoreToDatabase();
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={async () => {
                            await purgeItemPermanently(item.id);
                            onStoreToDatabase();
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
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

        {/* TAB 4: DATABASE HEALTH DIAGNOSTICS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Supabase Database Health Check</h3>
                  <p className="text-xs text-gray-500">Live inspection of groups, items, schema columns, foreign keys & RLS policies.</p>
                </div>
                <button
                  onClick={handleRunHealthCheck}
                  disabled={isHealthCheckLoading}
                  className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Activity className={`w-4 h-4 ${isHealthCheckLoading ? 'animate-spin' : ''}`} />
                  <span>Re-test Connection</span>
                </button>
              </div>

              {healthResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    healthResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      {healthResult.ok ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-extrabold text-xs sm:text-sm block">
                          {healthResult.ok ? 'Database is Healthy & Fully Connected' : 'Schema or Permission Warnings Found'}
                        </span>
                        <span className="text-[11px] opacity-80">
                          {healthResult.isConfigured ? `Connected to: ${healthResult.supabaseUrl}` : 'Using local fallback memory mode.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Diagnostic Checks */}
                  <div className="space-y-3">
                    {healthResult.checks.map((chk, i) => (
                      <div key={i} className="p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-800">{chk.name}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                            chk.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : chk.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {chk.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{chk.message}</p>
                        {chk.sqlFix && (
                          <div className="mt-1 p-2 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
                            <code>{chk.sqlFix}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* One-Click SQL Fix Button */}
                  <div className="p-4 bg-gray-900 text-white rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">One-Click Fix: Idempotent Supabase SQL Schema</span>
                      <button
                        onClick={copySqlSchema}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Fix SQL'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Copy and run this single script in your Supabase SQL Editor. It creates `groups`, `items`, foreign keys, and RLS policies idempotently.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Testing Supabase connection and schema health...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Supabase Connection & Credentials Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnected={() => {
          setIsSupabaseModalOpen(false);
          onStoreToDatabase();
        }}
      />
    </div>
  );
};

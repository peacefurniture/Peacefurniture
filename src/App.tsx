import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { AdminView } from './components/AdminView';
import { AdminProductModal } from './components/AdminProductModal';
import { AdminCategoryModal } from './components/AdminCategoryModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { FilterModal } from './components/FilterModal';
import { NavDrawer } from './components/NavDrawer';
import { ImageSearchModal } from './components/ImageSearchModal';
import { Footer } from './components/Footer';
import { Home, Search, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  CategoryId,
  FurnitureItem,
  Category,
  FilterState,
} from './types';
import {
  fetchItems,
  fetchGroups,
  saveItem,
  saveGroup,
  softDeleteItem,
  softDeleteGroup,
  restoreItem,
  restoreGroup,
  purgeItemPermanently,
  purgeGroupPermanently,
  DBItem,
  DBGroup,
  mapDBItemToFurnitureItem,
  mapDBGroupToCategory,
  mapFurnitureItemToDBItem,
  mapCategoryToDBGroup,
  isSupabaseConfigured,
  generateUniqueSlug,
  isDefaultOtherCategory,
  DEFAULT_OTHER_CATEGORY_IMAGE,
  sortCategoriesWithOtherLast,
} from './lib/data';
import { NICHE_CONFIG } from './config/niche';

import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'admin'>('home');
  const [items, setItems] = useState<DBItem[]>([]);
  const [groups, setGroups] = useState<DBGroup[]>([]);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  
  // Temporary mapping for compatibility
  const products = useMemo(() => items.map(mapDBItemToFurnitureItem), [items]);
  const categories = useMemo(() => groups.map(mapDBGroupToCategory), [groups]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from unified data layer
  const loadData = async () => {
    setIsLoading(true);
    try {
      // We fetch ALL records (including deleted) so that the Admin Trash and 
      // public filtering both have the complete dataset to work with.
      const [fetchedGroups, fetchedItems] = await Promise.all([
        fetchGroups(true),
        fetchItems(true),
      ]);
      let resolvedGroups = fetchedGroups.map((g) => {
        if (isDefaultOtherCategory(g) && !g.image) {
          return { ...g, image: DEFAULT_OTHER_CATEGORY_IMAGE };
        }
        return g;
      });
      const hasOther = resolvedGroups.some((g) => isDefaultOtherCategory(g));
      if (!hasOther) {
        resolvedGroups = [
          ...resolvedGroups,
          {
            id: 'other',
            slug: 'other',
            name: 'Other',
            active: true,
            item_count: 0,
            image: DEFAULT_OTHER_CATEGORY_IMAGE,
            deleted_at: null,
          },
        ];
      }
      setGroups(sortCategoriesWithOtherLast(resolvedGroups));
      setItems(fetchedItems);
    } catch (err: any) {
      console.error('Supabase Fetch Error:', err);
      showToast(`Database Error: ${err.message || 'Failed to fetch data'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isConfigured = isSupabaseConfigured();

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('wooden dining table');
  const [activeImageSearch, setActiveImageSearch] = useState<string | null>(null);
  const [aiSearchMatches, setAiSearchMatches] = useState<any | null>(null);

  // Category & Filter state
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    minPrice: 0,
    maxPrice: 60000,
    material: 'All Materials',
    seatingCapacity: null,
    inStockOnly: false,
    sortBy: 'popular',
  });

  // Modals & Drawers state
  const [selectedProduct, setSelectedProduct] = useState<FurnitureItem | null>(null);
  const [editingAdminProduct, setEditingAdminProduct] = useState<FurnitureItem | null>(null);
  const [isAdminProductModalOpen, setIsAdminProductModalOpen] = useState(false);

  const [editingAdminCategory, setEditingAdminCategory] = useState<Category | null>(null);
  const [isAdminCategoryModalOpen, setIsAdminCategoryModalOpen] = useState(false);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Active Categories for Public Store Front (with Other strictly last)
  const activeCategories = useMemo(() => {
    const list = categories.filter((c) => c.isActive !== false && !c.deleted_at);
    return sortCategoriesWithOtherLast(list);
  }, [categories]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 1 (CATALOGUE)
  const catalogueProducts = useMemo(() => {
    const activeCategoryIds = new Set(categories.filter((c) => c.isActive !== false && !c.deleted_at).map((c) => c.id));
    const activeCategorySlugs = new Set(categories.filter((c) => c.isActive !== false && !c.deleted_at).map((c) => c.slug));
    let items = products.filter(
      (item) =>
        item.isActive !== false &&
        !item.deleted_at &&
        (item.category === 'all' ||
          activeCategoryIds.has(item.category) ||
          activeCategorySlugs.has(item.category))
    );

    if (selectedCategory !== 'all') {
      const selectedCat = categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);
      items = items.filter((item) => {
        if (item.category === selectedCategory) return true;
        if (selectedCat) {
          return item.category === selectedCat.id || item.category === selectedCat.slug;
        }
        return false;
      });
    }

    if (filters.sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      items.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (filters.sortBy === 'newest') {
      items.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else {
      items.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return items;
  }, [products, categories, selectedCategory, filters.sortBy]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 2 (SEARCH)
  const searchResults = useMemo(() => {
    const activeCategoryIds = new Set(categories.filter((c) => c.isActive !== false && !c.deleted_at).map((c) => c.id));
    const activeCategorySlugs = new Set(categories.filter((c) => c.isActive !== false && !c.deleted_at).map((c) => c.slug));
    let items = products.filter(
      (item) =>
        item.isActive !== false &&
        !item.deleted_at &&
        (item.category === 'all' ||
          activeCategoryIds.has(item.category) ||
          activeCategorySlugs.has(item.category))
    );

    // Rule: When image search is active, uploaded image and product image MUST NOT be equal
    if (activeImageSearch) {
      items = items.filter((item) => item.image !== activeImageSearch);
    }

    if (activeImageSearch && aiSearchMatches?.similarMatches?.length > 0) {
      const matchMap = new Map<string, { score: number; reason: string }>();
      aiSearchMatches.similarMatches.forEach((m: any) => {
        const id = m.productId || m.product?.id;
        if (id) {
          matchMap.set(String(id), {
            score: m.similarityScore || 85,
            reason: m.reason || m.matchReason || 'Visually similar furniture piece',
          });
        }
      });

      items = items.map((item) => {
        const match = matchMap.get(item.id) || (item.slug ? matchMap.get(item.slug) : undefined);
        if (match) {
          return { ...item, aiMatchScore: match.score, aiMatchReason: match.reason };
        }
        return item;
      });

      // Sort items with AI visual matches first
      items.sort((a, b) => ((b as any).aiMatchScore || 0) - ((a as any).aiMatchScore || 0));
    } else if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesMat = item.material ? item.material.toLowerCase().includes(query) : false;
        const matchesTags = item.tags ? item.tags.some((tag) => tag.toLowerCase().includes(query)) : false;
        return matchesName || matchesCat || matchesDesc || matchesMat || matchesTags;
      });
    }

    if (filters.category !== 'all') {
      const selectedCat = categories.find((c) => c.id === filters.category || c.slug === filters.category);
      items = items.filter((item) => {
        if (item.category === filters.category) return true;
        if (selectedCat) {
          return item.category === selectedCat.id || item.category === selectedCat.slug;
        }
        return false;
      });
    }

    items = items.filter((item) => item.price <= filters.maxPrice);

    if (filters.material && filters.material !== 'All Materials') {
      items = items.filter((item) =>
        item.material ? item.material.toLowerCase().includes(filters.material.toLowerCase()) : false
      );
    }

    if (filters.seatingCapacity !== null) {
      items = items.filter((item) => item.seatingCapacity === filters.seatingCapacity);
    }

    if (filters.inStockOnly) {
      items = items.filter((item) => item.inStock);
    }

    return items;
  }, [products, categories, searchQuery, filters, activeImageSearch, aiSearchMatches]);

  // ============ ADMIN ACTIONS (DATA LAYER CONNECTED) ============

  // Add or Edit Product
  const handleSaveProduct = async (product: FurnitureItem) => {
    const isEdit = Boolean(editingAdminProduct);
    const resolvedSlug = product.slug || generateUniqueSlug(product.name, products, product.id);
    const targetCategoryId = product.category || (product as any).group_id || 'other';
    try {
      await saveItem({
        id: product.id,
        name: product.name,
        slug: resolvedSlug,
        category_id: targetCategoryId,
        price: product.price,
        description: product.description,
        image: product.image || '',
        active: product.isActive !== false,
      });

      await loadData();
      showToast(`✅ ${isEdit ? 'Updated' : 'Added'} "${product.name}" in catalogue!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }

    setEditingAdminProduct(null);
  };

  // Soft Delete Product
  const handleDeleteProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    try {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, deleted_at: now } : item))
      );
      if (isSupabaseConfigured()) {
        await softDeleteItem(productId);
        await loadData();
      }
      showToast(`Moved "${target.name}" to Trash`);
    } catch (err: any) {
      showToast(`Delete Error: ${err.message}`);
      await loadData();
    }
  };

  // Restore Product from Trash
  const handleRestoreProduct = async (productId: string) => {
    try {
      setItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, deleted_at: null } : item))
      );
      if (isSupabaseConfigured()) {
        await restoreItem(productId);
        await loadData();
      }
      showToast('Product restored from Trash');
    } catch (err: any) {
      showToast(`Restore Error: ${err.message}`);
      await loadData();
    }
  };

  // Purge Product Permanently
  const handlePurgeProduct = async (productId: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      if (isSupabaseConfigured()) {
        await purgeItemPermanently(productId);
        await loadData();
      }
      showToast('Product permanently purged from database');
    } catch (err: any) {
      showToast(`Purge Error: ${err.message}`);
      await loadData();
    }
  };

  // Toggle Product Active/Inactive
  const handleToggleActiveProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const newStatus = target.isActive === false ? true : false;

    try {
      await saveItem({
        id: target.id,
        name: target.name,
        category_id: target.category,
        image: target.image || '',
        active: newStatus,
      });

      await loadData();
      showToast(newStatus ? `"${target.name}" is now Active` : `"${target.name}" is now Hidden`);
    } catch (err: any) {
      showToast(`Status Error: ${err.message}`);
    }
  };

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingAdminCategory(null);
    setIsAdminCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    if (isDefaultOtherCategory(category)) {
      showToast("Default category 'Other' cannot be edited.");
      return;
    }
    setEditingAdminCategory(category);
    setIsAdminCategoryModalOpen(true);
  };

  const handleSaveCategory = async (category: Category) => {
    if (isDefaultOtherCategory(category)) {
      showToast("Default category 'Other' cannot be edited.");
      return;
    }
    const isEdit = Boolean(editingAdminCategory);
    const resolvedSlug = category.slug || generateUniqueSlug(category.name, categories, category.id);
    try {
      await saveGroup({
        id: category.id,
        name: category.name,
        slug: resolvedSlug,
        image: category.image || '',
        active: category.isActive !== false,
      });

      await loadData();
      showToast(`✅ ${isEdit ? 'Updated' : 'Added'} "${category.name}" in catalogue!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }

    setEditingAdminCategory(null);
  };

  // Soft Delete Category (Moves to Trash)
  const handleDeleteCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      showToast('Cannot delete default "All" category');
      return;
    }
    const catToDelete = categories.find((c) => c.id === categoryId || c.slug === categoryId);
    if (isDefaultOtherCategory(catToDelete) || categoryId === 'other') {
      showToast("The default 'Other' category cannot be deleted.");
      return;
    }

    try {
      const now = new Date().toISOString();
      setGroups((prev) =>
        prev.map((g) =>
          g.id === categoryId || g.slug === categoryId ? { ...g, deleted_at: now } : g
        )
      );
      if (isSupabaseConfigured()) {
        await softDeleteGroup(categoryId);
        await loadData();
      }
      showToast(`Moved category "${catToDelete?.name || categoryId}" to Trash`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
      await loadData();
    }
  };

  // Restore Category from Trash
  const handleRestoreCategory = async (categoryId: string) => {
    try {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === categoryId || g.slug === categoryId ? { ...g, deleted_at: null } : g
        )
      );
      if (isSupabaseConfigured()) {
        await restoreGroup(categoryId);
        await loadData();
      }
      showToast('Category restored from Trash');
    } catch (err: any) {
      showToast(`Restore Error: ${err.message}`);
      await loadData();
    }
  };

  // Purge Category Permanently
  const handlePurgeCategory = async (categoryId: string) => {
    try {
      setGroups((prev) => prev.filter((g) => g.id !== categoryId && g.slug !== categoryId));
      if (isSupabaseConfigured()) {
        await purgeGroupPermanently(categoryId);
        await loadData();
      }
      showToast('Category permanently purged from database');
    } catch (err: any) {
      showToast(`Purge Error: ${err.message}`);
      await loadData();
    }
  };

  const handleToggleActiveCategory = async (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    if (!target) return;
    if (isDefaultOtherCategory(target) || categoryId === 'other') {
      showToast("The default 'Other' category is permanently active and cannot be modified.");
      return;
    }

    const newStatus = target.isActive === false ? true : false;

    try {
      await saveGroup({
        id: target.id,
        name: target.name,
        image: target.image || '',
        active: newStatus,
      });

      await loadData();
      showToast(newStatus ? `Category "${target.name}" is now Active` : `Category "${target.name}" is now Hidden`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Open product modals
  const handleOpenAddProduct = () => {
    setEditingAdminProduct(null);
    setIsAdminProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: FurnitureItem) => {
    setEditingAdminProduct(product);
    setIsAdminProductModalOpen(true);
  };

  const handleOpenSearchPage = (query?: string) => {
    if (query !== undefined) {
      setSearchQuery(query);
    }
    setCurrentView('search');
  };

  const handleApplyImageSearch = (imageUrl: string, queryHint: string, aiMatches?: any) => {
    setActiveImageSearch(imageUrl);
    setSearchQuery(queryHint || 'wooden dining table');
    setAiSearchMatches(aiMatches || null);
    setCurrentView('search');
  };

  const handleClearImageSearch = () => {
    setActiveImageSearch(null);
    setAiSearchMatches(null);
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      minPrice: 0,
      maxPrice: 60000,
      material: 'All Materials',
      seatingCapacity: null,
      inStockOnly: false,
      sortBy: 'popular',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-gray-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Direct Rendering: Admin View vs Store View (Authentication bypassed) */}
      {currentView === 'admin' ? (
        <AdminView
          products={products}
          categories={categories}
          onAddProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleActive={handleToggleActiveProduct}
          onAddCategory={handleOpenAddCategory}
          onEditCategory={handleOpenEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onToggleActiveCategory={handleToggleActiveCategory}
          onRestoreCategory={handleRestoreCategory}
          onPurgeCategory={handlePurgeCategory}
          onRestoreProduct={handleRestoreProduct}
          onPurgeProduct={handlePurgeProduct}
          onStoreToDatabase={loadData}
          isSyncingToDb={false}
          lastSyncedAt={null}
          onGoToStore={() => setCurrentView('home')}
          onOpenDatabaseSettings={() => setIsDbModalOpen(true)}
        />
      ) : (
        <>
          <Header
            currentView={currentView}
            onNavigate={(v) => setCurrentView(v)}
            onOpenMenu={() => setIsNavOpen(true)}
          />

          <main className="flex-1 pb-16 sm:pb-0">
            {currentView === 'home' ? (
              <HomeView
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onSearchSubmit={() => handleOpenSearchPage()}
                onOpenImageSearch={() => setIsImageSearchModalOpen(true)}
                onFocusSearch={() => handleOpenSearchPage()}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                categories={activeCategories}
                products={catalogueProducts}
                onViewDetails={(item) => setSelectedProduct(item)}
                filters={filters}
                onSortChange={(s) => setFilters({ ...filters, sortBy: s })}
              />
            ) : (
              <SearchView
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onClearSearch={() => setSearchQuery('')}
                onTriggerSearch={() => {}}
                onOpenImageSearch={() => setIsImageSearchModalOpen(true)}
                onOpenFilter={() => setIsFilterModalOpen(true)}
                results={searchResults}
                totalResultsCount={searchResults.length}
                onViewDetails={(item) => setSelectedProduct(item)}
                activeImageSearch={activeImageSearch}
                onClearImageSearch={handleClearImageSearch}
                aiSearchMatches={aiSearchMatches}
              />
            )}
          </main>

          <Footer
            onNavigate={(v) => setCurrentView(v)}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setCurrentView('home');
            }}
          />
        </>
      )}

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobile Bottom Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-[#E11D2A]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Catalogue</span>
        </button>

        <button
          onClick={() => setCurrentView('search')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            currentView === 'search' ? 'text-[#E11D2A]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">Search AI</span>
        </button>

        <button
          onClick={() => setCurrentView('admin')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            currentView === 'admin' ? 'text-[#E11D2A]' : 'text-gray-400 hover:text-emerald-500'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${currentView === 'admin' ? 'text-[#E11D2A]' : 'text-emerald-500'}`} />
          <span className="text-[10px] font-bold">Admin</span>
        </button>
      </nav>

      {/* Database Connection Config Modal */}
      <SupabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onSaved={loadData}
      />

      {/* Admin Add/Edit Product Modal */}
      <AdminProductModal
        key={isAdminProductModalOpen ? (editingAdminProduct?.id || 'new-product') : 'closed-product'}
        isOpen={isAdminProductModalOpen}
        onClose={() => {
          setIsAdminProductModalOpen(false);
          setEditingAdminProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingAdminProduct}
        categories={categories}
        existingProducts={products}
      />

      {/* Admin Add/Edit Category Modal */}
      <AdminCategoryModal
        key={isAdminCategoryModalOpen ? (editingAdminCategory?.id || 'new-category') : 'closed-category'}
        isOpen={isAdminCategoryModalOpen}
        onClose={() => {
          setIsAdminCategoryModalOpen(false);
          setEditingAdminCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingAdminCategory}
        existingCategories={categories}
      />

      {/* Customer Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={activeCategories}
        filters={filters}
        onUpdateFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={handleResetFilters}
        totalFilteredCount={searchResults.length}
      />

      {/* AI Image Search Modal */}
      <ImageSearchModal
        isOpen={isImageSearchModalOpen}
        onClose={() => setIsImageSearchModalOpen(false)}
        onApplyImageSearch={handleApplyImageSearch}
      />

      {/* Navigation Drawer */}
      <NavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onNavigate={(v) => setCurrentView(v)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentView('home');
        }}
        categories={activeCategories}
      />
    </div>
  );
}

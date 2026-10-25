import React, { useState, useMemo, useEffect } from 'react';
import { Category, CategoryId, FilterState, FurnitureItem } from './types';
import { CATEGORIES, FURNITURE_ITEMS } from './data/furnitureData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { AdminView } from './components/AdminView';
import { AdminProductModal } from './components/AdminProductModal';
import { AdminCategoryModal } from './components/AdminCategoryModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { FilterModal } from './components/FilterModal';
import { ImageSearchModal } from './components/ImageSearchModal';
import { NavDrawer } from './components/NavDrawer';
import { Footer } from './components/Footer';
import { Home, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation: 'home' = Page 1 Catalogue | 'search' = Page 2 Search Furniture | 'admin' = Admin Portal
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'admin'>('home');

  // Furniture Products Master State
  const [products, setProducts] = useState<FurnitureItem[]>([]);
  // Categories Master State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Database Sync State
  const [isSyncingToDb, setIsSyncingToDb] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('peacefurniture_last_sync') || null;
    } catch {
      return null;
    }
  });

  // Fetch Products & Categories from Express Backend REST API
  const fetchDataFromApi = async () => {
    setIsLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/categories'),
      ]);

      if (resProd.ok && resCat.ok) {
        const prodData = await resProd.json();
        const catData = await resCat.json();
        setProducts(prodData);
        setCategories(catData);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.warn('Backend API fetch error, using local fallback:', err);
      // Fallback to initial static seed if server isn't ready
      setProducts(FURNITURE_ITEMS.map((item) => ({ ...item, isActive: true })));
      setCategories(CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromApi();
  }, []);

  const handleStoreToDatabase = async () => {
    setIsSyncingToDb(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, categories }),
      });
      if (res.ok) {
        const data = await res.json();
        const timestamp = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(timestamp);
        try {
          localStorage.setItem('peacefurniture_last_sync', timestamp);
        } catch {
          // ignore
        }
        showToast(`Successfully stored ${products.length} products & ${categories.length - 1} categories to Database!`);
      } else {
        throw new Error('Sync failed');
      }
    } catch {
      showToast('Error syncing to database server.');
    } finally {
      setIsSyncingToDb(false);
    }
  };

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('wooden dining table');
  const [activeImageSearch, setActiveImageSearch] = useState<string | null>(null);

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

  // Active Categories for Public Store Front
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.isActive !== false);
  }, [categories]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 1 (CATALOGUE)
  const catalogueProducts = useMemo(() => {
    const activeCategoryIds = new Set(categories.filter((c) => c.isActive !== false).map((c) => c.id));
    let items = products.filter(
      (item) => item.isActive !== false && activeCategoryIds.has(item.category)
    );

    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (filters.sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'newest') {
      items.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else {
      items.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return items;
  }, [products, categories, selectedCategory, filters.sortBy]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 2 (SEARCH)
  const searchResults = useMemo(() => {
    const activeCategoryIds = new Set(categories.filter((c) => c.isActive !== false).map((c) => c.id));
    let items = products.filter(
      (item) => item.isActive !== false && activeCategoryIds.has(item.category)
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesMat = item.material.toLowerCase().includes(query);
        const matchesTags = item.tags ? item.tags.some((tag) => tag.toLowerCase().includes(query)) : false;
        return matchesName || matchesCat || matchesDesc || matchesMat || matchesTags;
      });
    }

    if (filters.category !== 'all') {
      items = items.filter((item) => item.category === filters.category);
    }

    items = items.filter((item) => item.price <= filters.maxPrice);

    if (filters.material && filters.material !== 'All Materials') {
      items = items.filter((item) =>
        item.material.toLowerCase().includes(filters.material.toLowerCase())
      );
    }

    if (filters.seatingCapacity !== null) {
      items = items.filter((item) => item.seatingCapacity === filters.seatingCapacity);
    }

    if (filters.inStockOnly) {
      items = items.filter((item) => item.inStock);
    }

    return items;
  }, [products, categories, searchQuery, filters]);

  // ============ ADMIN ACTIONS (BACKEND CONNECTED) ============

  // Add or Edit Product
  const handleSaveProduct = async (product: FurnitureItem) => {
    const isEdit = Boolean(editingAdminProduct);
    try {
      const url = isEdit ? `/api/items/${product.id}` : '/api/items';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        const savedItem = await res.json();
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === savedItem.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = savedItem;
            return next;
          }
          return [savedItem, ...prev];
        });
        showToast(isEdit ? `Updated "${savedItem.name}"` : `Added "${savedItem.name}" to catalogue`);
      } else {
        throw new Error('Failed to save product on server');
      }
    } catch {
      // Local fallback
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = product;
          return next;
        }
        return [product, ...prev];
      });
      showToast(isEdit ? `Updated "${product.name}"` : `Added "${product.name}" to catalogue`);
    }

    setEditingAdminProduct(null);
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    const deletedItem = products.find((p) => p.id === productId);
    try {
      const res = await fetch(`/api/items/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast(`Deleted "${deletedItem?.name || 'Product'}"`);
      } else {
        throw new Error('Failed to delete product from server');
      }
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`Deleted "${deletedItem?.name || 'Product'}"`);
    }
  };

  // Toggle Product Active/Inactive
  const handleToggleActiveProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const newStatus = target.isActive === false ? true : false;
    const updatedProduct = { ...target, isActive: newStatus };

    try {
      const res = await fetch(`/api/items/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)));
        showToast(
          newStatus
            ? `"${target.name}" is now Active in catalogue`
            : `"${target.name}" is now Hidden / Deactivated`
        );
      } else {
        throw new Error('Failed to toggle status on server');
      }
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)));
      showToast(
        newStatus
          ? `"${target.name}" is now Active in catalogue`
          : `"${target.name}" is now Hidden / Deactivated`
      );
    }
  };

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingAdminCategory(null);
    setIsAdminCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingAdminCategory(category);
    setIsAdminCategoryModalOpen(true);
  };

  const handleSaveCategory = async (category: Category) => {
    const isEdit = Boolean(editingAdminCategory);
    try {
      const url = isEdit ? `/api/categories/${category.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (res.ok) {
        const savedCategory = await res.json();
        setCategories((prev) => {
          const idx = prev.findIndex((c) => c.id === savedCategory.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = savedCategory;
            return next;
          }
          return [...prev, savedCategory];
        });
        showToast(isEdit ? `Updated category "${savedCategory.name}"` : `Added category "${savedCategory.name}"`);
      } else {
        throw new Error('Failed to save category on server');
      }
    } catch {
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === category.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = category;
          return next;
        }
        return [...prev, category];
      });
      showToast(isEdit ? `Updated category "${category.name}"` : `Added category "${category.name}"`);
    }

    setEditingAdminCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      showToast('Cannot delete the "All" category');
      return;
    }
    const catToDelete = categories.find((c) => c.id === categoryId);

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        if (data.products) {
          setProducts(data.products);
        }
        showToast(`Deleted category "${catToDelete?.name || categoryId}"`);
      } else {
        throw new Error('Failed to delete category on server');
      }
    } catch {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setProducts((prev) => prev.map((p) => (p.category === categoryId ? { ...p, category: 'decor' } : p)));
      showToast(`Deleted category "${catToDelete?.name || categoryId}"`);
    }
  };

  const handleToggleActiveCategory = async (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    if (!target) return;

    const newStatus = target.isActive === false ? true : false;
    const updatedCategory = { ...target, isActive: newStatus };

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        setCategories((prev) => prev.map((c) => (c.id === categoryId ? updatedCategory : c)));
        showToast(
          newStatus
            ? `Category "${target.name}" is now Active in catalogue`
            : `Category "${target.name}" is now Hidden / Deactivated`
        );
      } else {
        throw new Error('Failed to toggle category status on server');
      }
    } catch {
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? updatedCategory : c)));
      showToast(
        newStatus
          ? `Category "${target.name}" is now Active in catalogue`
          : `Category "${target.name}" is now Hidden / Deactivated`
      );
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

  const handleApplyImageSearch = (imageUrl: string, queryHint: string) => {
    setActiveImageSearch(imageUrl);
    setSearchQuery(queryHint || 'wooden dining table');
    setCurrentView('search');
  };

  const handleClearImageSearch = () => {
    setActiveImageSearch(null);
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

      {/* Conditional Rendering: Admin View vs Store View */}
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
          onStoreToDatabase={handleStoreToDatabase}
          isSyncingToDb={isSyncingToDb}
          lastSyncedAt={lastSyncedAt}
          onGoToStore={() => setCurrentView('home')}
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

      {/* Admin Add/Edit Product Modal */}
      <AdminProductModal
        isOpen={isAdminProductModalOpen}
        onClose={() => {
          setIsAdminProductModalOpen(false);
          setEditingAdminProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingAdminProduct}
        categories={categories}
      />

      {/* Admin Add/Edit Category Modal */}
      <AdminCategoryModal
        isOpen={isAdminCategoryModalOpen}
        onClose={() => {
          setIsAdminCategoryModalOpen(false);
          setEditingAdminCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingAdminCategory}
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

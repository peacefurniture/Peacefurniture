import React, { useState, useMemo, useEffect } from 'react';
import { AdminUser, CategoryId, FilterState, FurnitureItem } from './types';
import { FURNITURE_ITEMS } from './data/furnitureData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { AdminAuthView } from './components/AdminAuthView';
import { AdminView } from './components/AdminView';
import { AdminProductModal } from './components/AdminProductModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { FilterModal } from './components/FilterModal';
import { ImageSearchModal } from './components/ImageSearchModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { NavDrawer } from './components/NavDrawer';
import { Footer } from './components/Footer';
import { Home, Search, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation: 'home' = Page 1 Catalogue | 'search' = Page 2 Search Furniture | 'admin' = Admin Portal
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'admin'>('home');

  // Admin Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('peacefurniture_admin_session') || localStorage.getItem('homecraft_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Furniture Products Master State (stored in localStorage)
  const [products, setProducts] = useState<FurnitureItem[]>(() => {
    try {
      const stored = localStorage.getItem('peacefurniture_products') || localStorage.getItem('homecraft_products');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    // Initialize default products with isActive: true
    return FURNITURE_ITEMS.map((item) => ({ ...item, isActive: true }));
  });

  // Save products to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('peacefurniture_products', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    () => new Set(['sofa-modern-3-seater', 'dining-6-seater-wood'])
  );

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const toggleWishlist = (product: FurnitureItem) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  };

  const clearAllWishlist = () => {
    setWishlistIds(new Set());
  };

  const wishlistItems = useMemo(() => {
    return products.filter((item) => wishlistIds.has(item.id) && item.isActive !== false);
  }, [products, wishlistIds]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 1 (CATALOGUE)
  // Filters out inactive or hidden products
  const catalogueProducts = useMemo(() => {
    let items = products.filter((item) => item.isActive !== false);

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
  }, [products, selectedCategory, filters.sortBy]);

  // PUBLIC VISIBLE PRODUCTS FOR PAGE 2 (SEARCH)
  // Filters out inactive or hidden products
  const searchResults = useMemo(() => {
    let items = products.filter((item) => item.isActive !== false);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesMat = item.material.toLowerCase().includes(query);
        const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(query));
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
  }, [products, searchQuery, filters]);

  // ============ ADMIN ACTIONS ============
  const handleAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    try {
      localStorage.setItem('peacefurniture_admin_session', JSON.stringify(user));
    } catch {
      // ignore
    }
    showToast(`Signed in as ${user.name}`);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('peacefurniture_admin_session');
      localStorage.removeItem('homecraft_admin_session');
    } catch {
      // ignore
    }
    showToast('Signed out of Admin Portal');
    setCurrentView('home');
  };

  const handleSaveProduct = (product: FurnitureItem) => {
    setProducts((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === product.id);
      if (existingIdx >= 0) {
        // Update existing product
        const next = [...prev];
        next[existingIdx] = product;
        return next;
      } else {
        // Add new product at top
        return [product, ...prev];
      }
    });

    const isEdit = Boolean(editingAdminProduct);
    showToast(isEdit ? `Updated "${product.name}"` : `Added "${product.name}" to catalogue`);
    setEditingAdminProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const deletedItem = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast(`Deleted "${deletedItem?.name || 'Product'}"`);
  };

  const handleToggleActiveProduct = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStatus = p.isActive === false ? true : false;
          showToast(
            newStatus
              ? `"${p.name}" is now Active in catalogue`
              : `"${p.name}" is now Hidden / Deactivated`
          );
          return { ...p, isActive: newStatus };
        }
        return p;
      })
    );
  };

  // Open modals
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

      {/* Conditional Rendering: If in Admin View, show admin header / portal */}
      {currentView === 'admin' ? (
        adminUser ? (
          <AdminView
            adminUser={adminUser}
            products={products}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleActive={handleToggleActiveProduct}
            onLogout={handleAdminLogout}
            onGoToStore={() => setCurrentView('home')}
          />
        ) : (
          <AdminAuthView
            onLoginSuccess={handleAdminLogin}
            onBackToStore={() => setCurrentView('home')}
          />
        )
      ) : (
        /* Public Store Views: Header, Page 1 / Page 2, Footer */
        <>
          <Header
            currentView={currentView}
            onNavigate={(v) => setCurrentView(v)}
            onOpenMenu={() => setIsNavOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            wishlistCount={wishlistIds.size}
            adminUser={adminUser}
          />

          <main className="flex-1 pb-16 sm:pb-0">
            {currentView === 'home' ? (
              /* PAGE 1: Furniture Catalogue (Home Page) */
              <HomeView
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onSearchSubmit={() => handleOpenSearchPage()}
                onOpenImageSearch={() => setIsImageSearchModalOpen(true)}
                onFocusSearch={() => handleOpenSearchPage()}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                products={catalogueProducts}
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
                onViewDetails={(item) => setSelectedProduct(item)}
                filters={filters}
                onSortChange={(s) => setFilters({ ...filters, sortBy: s })}
              />
            ) : (
              /* PAGE 2: Search Furniture & AI Image Search */
              <SearchView
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onClearSearch={() => setSearchQuery('')}
                onTriggerSearch={() => {}}
                onOpenImageSearch={() => setIsImageSearchModalOpen(true)}
                onOpenFilter={() => setIsFilterModalOpen(true)}
                results={searchResults}
                totalResultsCount={searchResults.length}
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
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

      {/* Persistent Mobile Bottom Navigation Bar (Catalogue <-> Search AI <-> Wishlist <-> Admin) */}
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
          onClick={() => setIsWishlistOpen(true)}
          className="relative flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Wishlist</span>
          {wishlistIds.size > 0 && (
            <span className="absolute -top-1 right-2 bg-[#E11D2A] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {wishlistIds.size}
            </span>
          )}
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
      />

      {/* Customer Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        onToggleWishlist={toggleWishlist}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
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

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemove={toggleWishlist}
        onViewDetails={(item) => setSelectedProduct(item)}
        onClearAll={clearAllWishlist}
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
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlistIds.size}
      />
    </div>
  );
}

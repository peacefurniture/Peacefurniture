import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Supabase direct database connection is handled directly on client in src/lib/data.ts
const isServerSupabaseConfigured = () => false;
const getSupabaseServerClient = (): any => null;
const SUPABASE_SQL_SCHEMA = '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initial Seed Data
const DEFAULT_CATEGORIES = [
  {
    id: 'all',
    name: 'All',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    count: 32,
    isActive: true,
  },
  {
    id: 'sofas',
    name: 'Sofas',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    count: 14,
    isActive: true,
  },
  {
    id: 'beds',
    name: 'Beds',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
    count: 10,
    isActive: true,
  },
  {
    id: 'dining',
    name: 'Dining',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=300&q=80',
    count: 18,
    isActive: true,
  },
  {
    id: 'chairs',
    name: 'Chairs',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=80',
    count: 16,
    isActive: true,
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
    count: 8,
    isActive: true,
  },
  {
    id: 'tv-units',
    name: 'TV Units',
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=300&q=80',
    count: 9,
    isActive: true,
  },
  {
    id: 'office',
    name: 'Office',
    image: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=300&q=80',
    count: 12,
    isActive: true,
  },
  {
    id: 'storage',
    name: 'Storage',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=300&q=80',
    count: 11,
    isActive: true,
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    count: 7,
    isActive: true,
  },
  {
    id: 'kids',
    name: 'Kids',
    image: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=300&q=80',
    count: 6,
    isActive: true,
  },
  {
    id: 'decor',
    name: 'Decor',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80',
    count: 15,
    isActive: true,
  },
];

const DEFAULT_PRODUCTS = [
  {
    id: 'sofa-modern-3-seater',
    name: 'Modern 3 Seater Sofa',
    category: 'sofas',
    price: 24999,
    originalPrice: 32000,
    description: 'Comfortable and stylish sofa with premium fabric.',
    longDescription:
      'Engineered with high-density foam cushioning and premium breathable linen-blend upholstery. Featuring solid hardwood internal framing and tapered solid wood legs, this 3-seater sofa offers plush comfort and timeless mid-century aesthetic for contemporary living rooms.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '84 inches', depth: '36 inches', height: '33 inches' },
    material: 'Premium Linen Blend & Solid Hardwood',
    finish: 'Natural Oak Leg Finish',
    seatingCapacity: 3,
    color: 'Oatmeal Beige',
    rating: 4.8,
    reviewsCount: 142,
    inStock: true,
    warranty: '5 Years Frame Warranty',
    isPopular: true,
    isActive: true,
    tags: ['sofa', '3 seater', 'fabric', 'living room', 'beige', 'comfortable', 'modern'],
  },
  {
    id: 'bed-king-size',
    name: 'King Size Bed',
    category: 'beds',
    price: 32999,
    originalPrice: 42000,
    description: 'Elegant wooden bed with modern design.',
    longDescription:
      'Crafted from sustainably sourced solid Sheesham wood with smooth natural walnut polishing. Includes sturdy slatted mattress support and a gently angled headboard.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '76 inches', depth: '82 inches', height: '42 inches' },
    material: 'Solid Sheesham Wood',
    finish: 'Warm Walnut Polish',
    color: 'Warm Walnut',
    rating: 4.9,
    reviewsCount: 98,
    inStock: true,
    warranty: '10 Years Structural Warranty',
    isPopular: true,
    isActive: true,
    tags: ['bed', 'king size', 'wooden bed', 'bedroom', 'solid wood', 'sheesham'],
  },
  {
    id: 'dining-6-seater-wood',
    name: '6 Seater Wooden Dining Table',
    category: 'dining',
    price: 28999,
    originalPrice: 38000,
    description: 'Solid wood dining table with 6 chairs. Modern design.',
    longDescription:
      'A stunning 6-seater solid wood dining set with cushioned dining chairs. Finished with water-resistant matte clear coat to preserve the natural grain pattern.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '72 inches', depth: '36 inches', height: '30 inches' },
    material: 'Solid Teak Wood & Premium Leatherette Cushioning',
    finish: 'Teak Wood Natural Matte',
    seatingCapacity: 6,
    color: 'Natural Teak',
    rating: 4.7,
    reviewsCount: 164,
    inStock: true,
    warranty: '7 Years Warranty',
    isPopular: true,
    isActive: true,
    tags: ['dining', 'dining table', 'wooden dining table', '6 seater', 'solid wood', 'chairs', 'teak'],
  },
  {
    id: 'office-chair-ergonomic',
    name: 'Office Chair',
    category: 'office',
    price: 12999,
    originalPrice: 16999,
    description: 'Ergonomic chair for work and study.',
    longDescription:
      'High-performance ergonomic task chair designed for 10+ hours of continuous comfort with breathable Korean mesh back and multi-angle recline.',
    image: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '26 inches', depth: '25 inches', height: '42-46 inches adjustable' },
    material: 'High Tensile Breathable Mesh & Nylon Base',
    finish: 'Matte Black',
    color: 'Executive Black',
    rating: 4.9,
    reviewsCount: 220,
    inStock: true,
    warranty: '3 Years Mechanism Warranty',
    isPopular: true,
    isActive: true,
    tags: ['office', 'office chair', 'ergonomic', 'study chair', 'desk', 'workstation'],
  },
  {
    id: 'wardrobe-modern-3door',
    name: 'Modern Wardrobe',
    category: 'wardrobes',
    price: 26999,
    originalPrice: 35000,
    description: 'Spacious wooden wardrobe with sleek finish and mirror.',
    longDescription:
      'Engineered with premium water-resistant HDF boards and textured warm woodgrain finish. Features integrated soft-close hinges, full-length mirror, and modular storage.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '48 inches', depth: '22 inches', height: '78 inches' },
    material: 'Engineered Wood (HDF) & Soft-Close Metal Hardware',
    finish: 'Natural Light Oak & Matte White',
    color: 'Light Oak',
    rating: 4.6,
    reviewsCount: 78,
    inStock: true,
    warranty: '5 Years Termite & Hardware Warranty',
    isPopular: true,
    isActive: true,
    tags: ['wardrobe', 'storage', 'bedroom', 'closet', 'wooden wardrobe', '3 door'],
  },
  {
    id: 'tv-unit-modern-console',
    name: 'TV Unit',
    category: 'tv-units',
    price: 18999,
    originalPrice: 24500,
    description: 'Sleek entertainment unit with cable management.',
    longDescription:
      'Accommodates up to 75-inch smart TVs. Features concealed magnetic catch cabinets and rear grommets for tidy cable routing.',
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: { width: '66 inches', depth: '18 inches', height: '22 inches' },
    material: 'Solid Acacia Wood & Powder-coated Steel Legs',
    finish: 'Warm Teak Polish',
    color: 'Teak & Charcoal',
    rating: 4.7,
    reviewsCount: 88,
    inStock: true,
    warranty: '5 Years Warranty',
    isPopular: true,
    isActive: true,
    tags: ['tv unit', 'tv console', 'entertainment unit', 'living room', 'media console'],
  },
  {
    id: 'dining-4-seater-compact',
    name: '4 Seater Dining Table',
    category: 'dining',
    price: 18999,
    originalPrice: 24000,
    description: 'Compact wooden dining table with 4 chairs.',
    longDescription:
      'Designed for modern urban apartments, this 4-seater dining set features space-efficient proportions and foam-padded chairs.',
    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
    dimensions: { width: '48 inches', depth: '34 inches', height: '30 inches' },
    material: 'Solid Rubberwood & Natural Linen Fabric',
    finish: 'Warm Honey Polish',
    seatingCapacity: 4,
    color: 'Honey Oak',
    rating: 4.6,
    reviewsCount: 110,
    inStock: true,
    warranty: '5 Years Warranty',
    isPopular: false,
    isActive: true,
    tags: ['dining', 'dining table', 'wooden dining table', '4 seater', 'compact', 'chairs'],
  },
  {
    id: 'chair-modern-armchair',
    name: 'Modern Lounge Armchair',
    category: 'chairs',
    price: 9999,
    originalPrice: 13500,
    description: 'Deep-seat cozy armchair with grey textured fabric.',
    longDescription:
      'Mid-century modern accent armchair crafted with bentwood armrests and deep cushioned foam seating.',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    dimensions: { width: '32 inches', depth: '31 inches', height: '33 inches' },
    material: 'Textured Bouclé Fabric & Solid Wood Legs',
    color: 'Charcoal Grey',
    rating: 4.8,
    reviewsCount: 112,
    inStock: true,
    warranty: '3 Years Warranty',
    isActive: true,
    tags: ['chairs', 'armchair', 'lounge chair', 'living room'],
  },
];

// Persistence Setup
const DATA_DIR = path.join(__dirname, 'data_store');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CATEGORIES_FILE)) {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2), 'utf-8');
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2), 'utf-8');
  }
}

function readCategories(): any[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function writeCategories(categories: any[]) {
  ensureDataFiles();
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
}

function readProducts(): any[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

function writeProducts(products: any[]) {
  ensureDataFiles();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Initialize Data Store
  ensureDataFiles();

  // ================= API ROUTES =================

  // --- ITEMS / PRODUCTS ---
  app.get('/api/items', (req, res) => {
    const products = readProducts();
    res.json(products);
  });

  app.get('/api/items/:id', (req, res) => {
    const products = readProducts();
    const item = products.find((p) => p.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(item);
  });

  app.post('/api/items', async (req, res) => {
    const newItem = req.body;
    if (!newItem.name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!newItem.id) {
      newItem.id = 'prod-' + Date.now();
    }
    if (newItem.isActive === undefined) {
      newItem.isActive = true;
    }

    const products = readProducts();
    const existingIndex = products.findIndex((p) => p.id === newItem.id);
    if (existingIndex >= 0) {
      products[existingIndex] = newItem;
    } else {
      products.unshift(newItem);
    }

    writeProducts(products);

    // Sync with Supabase if configured
    let supabaseError = null;
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from('products').upsert(newItem, { onConflict: 'id' });
        if (error) {
          console.error('Supabase product save error:', error);
          supabaseError = error.message;
        }
      }
    }

    res.status(201).json({ ...newItem, supabaseError });
  });

  app.put('/api/items/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const products = readProducts();

    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[index] = { ...products[index], ...updatedData, id };
    writeProducts(products);

    // Sync with Supabase if configured
    let supabaseError = null;
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from('products').upsert(products[index], { onConflict: 'id' });
        if (error) {
          console.error('Supabase product update error:', error);
          supabaseError = error.message;
        }
      }
    }

    res.json({ ...products[index], supabaseError });
  });

  app.delete('/api/items/:id', async (req, res) => {
    const id = req.params.id;
    let products = readProducts();
    const existing = products.find((p) => p.id === id);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products = products.filter((p) => p.id !== id);
    writeProducts(products);

    // Sync deletion with Supabase if configured
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error('Supabase product delete error:', error);
        }
      }
    }

    res.json({ message: 'Product deleted successfully', id });
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req, res) => {
    const categories = readCategories();
    res.json(categories);
  });

  app.post('/api/categories', async (req, res) => {
    const newCategory = req.body;
    if (!newCategory.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (!newCategory.id) {
      newCategory.id = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('cat-' + Date.now());
    }
    if (newCategory.isActive === undefined) {
      newCategory.isActive = true;
    }

    const categories = readCategories();
    const existingIndex = categories.findIndex((c) => c.id === newCategory.id);
    if (existingIndex >= 0) {
      categories[existingIndex] = newCategory;
    } else {
      categories.push(newCategory);
    }

    writeCategories(categories);

    // Sync with Supabase if configured
    let supabaseError = null;
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from('categories').upsert(newCategory, { onConflict: 'id' });
        if (error) {
          console.error('Supabase category save error:', error);
          supabaseError = error.message;
        }
      }
    }

    res.status(201).json({ ...newCategory, supabaseError });
  });

  app.put('/api/categories/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const categories = readCategories();

    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    categories[index] = { ...categories[index], ...updatedData, id };
    writeCategories(categories);

    // Sync with Supabase if configured
    let supabaseError = null;
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from('categories').upsert(categories[index], { onConflict: 'id' });
        if (error) {
          console.error('Supabase category update error:', error);
          supabaseError = error.message;
        }
      }
    }

    res.json({ ...categories[index], supabaseError });
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const id = req.params.id;
    if (id === 'all') {
      return res.status(400).json({ error: 'Cannot delete default "All" category' });
    }

    let categories = readCategories();
    const existing = categories.find((c) => c.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    categories = categories.filter((c) => c.id !== id);
    writeCategories(categories);

    // Reassign products in deleted category to 'decor'
    let products = readProducts();
    let updatedProductsCount = 0;
    products = products.map((p) => {
      if (p.category === id) {
        updatedProductsCount++;
        return { ...p, category: 'decor' };
      }
      return p;
    });
    writeProducts(products);

    // Sync with Supabase if configured
    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase.from('categories').delete().eq('id', id);
        // update products with category 'decor'
        await supabase.from('products').upsert(products, { onConflict: 'id' });
      }
    }

    res.json({
      message: 'Category deleted successfully',
      id,
      reassignedProductsCount: updatedProductsCount,
      products,
      categories,
    });
  });

  // --- FULL DATABASE BACKUP / BULK SYNC ---
  app.post('/api/sync', async (req, res) => {
    const { products, categories } = req.body;
    if (Array.isArray(products)) {
      writeProducts(products);
    }
    if (Array.isArray(categories)) {
      writeCategories(categories);
    }

    let supabaseResult = { success: false, message: 'Supabase URL/Key missing in .env' };

    if (isServerSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        try {
          const catList = Array.isArray(categories) ? categories : readCategories();
          const prodList = Array.isArray(products) ? products : readProducts();

          const { error: catErr } = await supabase.from('categories').upsert(catList, { onConflict: 'id' });
          if (catErr) {
            throw new Error(`Category Sync Error: ${catErr.message} (Code: ${catErr.code})`);
          }

          const { error: prodErr } = await supabase.from('products').upsert(prodList, { onConflict: 'id' });
          if (prodErr) {
            throw new Error(`Product Sync Error: ${prodErr.message} (Code: ${prodErr.code})`);
          }

          supabaseResult = {
            success: true,
            message: 'Successfully saved and synced to Supabase database!',
          };
        } catch (err: any) {
          console.error('Supabase Sync Failed:', err);
          supabaseResult = {
            success: false,
            message: err.message || 'Failed saving to Supabase',
          };
        }
      }
    }

    res.json({
      message: 'Database synced and persisted successfully',
      productsCount: Array.isArray(products) ? products.length : readProducts().length,
      categoriesCount: Array.isArray(categories) ? categories.length : readCategories().length,
      supabase: supabaseResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  });

  // --- SUPABASE CONFIGURATION & SCHEMA STATUS ---
  app.get('/api/supabase/config', (req, res) => {
    const isConfigured = isServerSupabaseConfigured();
    res.json({
      isConfigured,
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || null,
      sqlSchema: SUPABASE_SQL_SCHEMA,
      message: isConfigured
        ? 'Supabase is configured and active!'
        : 'Supabase URL/Key missing or using default placeholders in .env',
    });
  });

  app.post('/api/supabase/seed', async (req, res) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(400).json({
        error: 'Supabase is not configured yet. Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) to .env',
      });
    }

    try {
      const categories = readCategories();
      const products = readProducts();

      // Upsert categories
      const { error: catErr } = await supabase.from('categories').upsert(categories, { onConflict: 'id' });
      if (catErr) throw catErr;

      // Upsert products
      const { error: prodErr } = await supabase.from('products').upsert(products, { onConflict: 'id' });
      if (prodErr) throw prodErr;

      res.json({
        success: true,
        message: 'Successfully seeded categories and products to Supabase!',
        seededCategories: categories.length,
        seededProducts: products.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to seed Supabase', details: err.message || String(err) });
    }
  });

  // --- GEMINI AI IMAGE RECOGNITION ---
  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { image, prompt } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data or URL is required' });
      }

      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (typeof image === 'string' && image.startsWith('data:')) {
        const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      } else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        const imgRes = await fetch(image);
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Data = buffer.toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          mimeType = contentType;
        }
      } else {
        base64Data = image;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text:
                prompt ||
                'Analyze this furniture or interior item image. Identify: 1) furniture category (sofas, beds, dining, chairs, office, wardrobes, tv-units, decor), 2) item title/type, 3) key visual features (materials, color, style), 4) best concise search query to find similar products in a catalog.',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              itemType: { type: Type.STRING },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedSearchQuery: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['category', 'itemType', 'suggestedSearchQuery'],
          },
        },
      });

      const resultText = response.text || '{}';
      const parsed = JSON.parse(resultText);

      res.json({
        success: true,
        analysis: parsed,
      });
    } catch (error: any) {
      console.error('Gemini image analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze image with Gemini',
        details: error.message || String(error),
      });
    }
  });

  // Serve static assets or Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

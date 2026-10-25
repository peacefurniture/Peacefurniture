import { Category, FurnitureItem } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    count: 32,
  },
  {
    id: 'sofas',
    name: 'Sofas',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    count: 14,
  },
  {
    id: 'beds',
    name: 'Beds',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
    count: 10,
  },
  {
    id: 'dining',
    name: 'Dining',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=300&q=80',
    count: 18,
  },
  {
    id: 'chairs',
    name: 'Chairs',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=80',
    count: 16,
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
    count: 8,
  },
  {
    id: 'tv-units',
    name: 'TV Units',
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=300&q=80',
    count: 9,
  },
  {
    id: 'office',
    name: 'Office',
    image: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=300&q=80',
    count: 12,
  },
  {
    id: 'storage',
    name: 'Storage',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=300&q=80',
    count: 11,
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    count: 7,
  },
  {
    id: 'kids',
    name: 'Kids',
    image: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=300&q=80',
    count: 6,
  },
  {
    id: 'decor',
    name: 'Decor',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80',
    count: 15,
  },
];

export const FURNITURE_ITEMS: FurnitureItem[] = [
  // 1. Modern 3 Seater Sofa (from left screenshot)
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
    dimensions: {
      width: '84 inches',
      depth: '36 inches',
      height: '33 inches',
    },
    material: 'Premium Linen Blend & Solid Hardwood',
    finish: 'Natural Oak Leg Finish',
    seatingCapacity: 3,
    color: 'Oatmeal Beige',
    colorOptions: [
      { name: 'Oatmeal Beige', hex: '#E3DAC9' },
      { name: 'Warm Charcoal', hex: '#36454F' },
      { name: 'Forest Green', hex: '#2D5A43' },
    ],
    rating: 4.8,
    reviewsCount: 142,
    inStock: true,
    warranty: '5 Years Frame Warranty',
    isPopular: true,
    tags: ['sofa', '3 seater', 'fabric', 'living room', 'beige', 'comfortable', 'modern'],
  },

  // 2. King Size Bed (from left screenshot)
  {
    id: 'bed-king-size',
    name: 'King Size Bed',
    category: 'beds',
    price: 32999,
    originalPrice: 42000,
    description: 'Elegant wooden bed with modern design.',
    longDescription:
      'Crafted from sustainably sourced solid Sheesham wood with smooth natural walnut polishing. Includes sturdy slatted mattress support and a gently angled headboard that provides exceptional ergonomic back support while reading or relaxing in bed.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '76 inches',
      depth: '82 inches',
      height: '42 inches',
    },
    material: 'Solid Sheesham Wood',
    finish: 'Warm Walnut Polish',
    color: 'Warm Walnut',
    colorOptions: [
      { name: 'Warm Walnut', hex: '#5D4037' },
      { name: 'Honey Teak', hex: '#8D6E63' },
    ],
    rating: 4.9,
    reviewsCount: 98,
    inStock: true,
    warranty: '10 Years Structural Warranty',
    isPopular: true,
    tags: ['bed', 'king size', 'wooden bed', 'bedroom', 'solid wood', 'sheesham'],
  },

  // 3. 6 Seater Dining Table (from left screenshot & right search results)
  {
    id: 'dining-6-seater-wood',
    name: '6 Seater Wooden Dining Table',
    category: 'dining',
    price: 28999,
    originalPrice: 38000,
    description: 'Solid wood dining table with 6 chairs. Modern design.',
    longDescription:
      'A stunning 6-seater solid wood dining set with cushioned dining chairs. Finished with water-resistant matte clear coat to preserve the natural grain pattern while providing easy daily maintenance. Perfect for family gatherings and dinner parties.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '72 inches',
      depth: '36 inches',
      height: '30 inches',
    },
    material: 'Solid Teak Wood & Premium Leatherette Cushioning',
    finish: 'Teak Wood Natural Matte',
    seatingCapacity: 6,
    color: 'Natural Teak',
    colorOptions: [
      { name: 'Natural Teak', hex: '#795548' },
      { name: 'Dark Mahogany', hex: '#3E2723' },
    ],
    rating: 4.7,
    reviewsCount: 164,
    inStock: true,
    warranty: '7 Years Warranty',
    isPopular: true,
    tags: ['dining', 'dining table', 'wooden dining table', '6 seater', 'solid wood', 'chairs', 'teak'],
  },

  // 4. Office Chair (from left screenshot)
  {
    id: 'office-chair-ergonomic',
    name: 'Office Chair',
    category: 'office',
    price: 12999,
    originalPrice: 16999,
    description: 'Ergonomic chair for work and study.',
    longDescription:
      'High-performance ergonomic task chair designed for 10+ hours of continuous comfort. Features breathable Korean mesh back, multi-angle synchro-tilt reclining mechanism, 3D adjustable armrests, and dynamic pneumatic height adjustment.',
    image: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '26 inches',
      depth: '25 inches',
      height: '42-46 inches adjustable',
    },
    material: 'High Tensile Breathable Mesh & Nylon Base',
    finish: 'Matte Black',
    color: 'Executive Black',
    colorOptions: [
      { name: 'Executive Black', hex: '#212121' },
      { name: 'Slate Grey', hex: '#616161' },
    ],
    rating: 4.9,
    reviewsCount: 220,
    inStock: true,
    warranty: '3 Years Mechanism Warranty',
    isPopular: true,
    tags: ['office', 'office chair', 'ergonomic', 'study chair', 'desk', 'workstation'],
  },

  // 5. Modern Wardrobe (from left screenshot)
  {
    id: 'wardrobe-modern-3door',
    name: 'Modern Wardrobe',
    category: 'wardrobes',
    price: 26999,
    originalPrice: 35000,
    description: 'Spacious wooden wardrobe with sleek finish and mirror.',
    longDescription:
      'Engineered with premium water-resistant HDF boards and textured warm woodgrain finish. Features integrated soft-close hinges, full-length dressing mirror, dedicated hanging compartments, and modular storage shelves with lockable internal drawer.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '48 inches',
      depth: '22 inches',
      height: '78 inches',
    },
    material: 'Engineered Wood (HDF) & Soft-Close Metal Hardware',
    finish: 'Natural Light Oak & Matte White',
    color: 'Light Oak',
    colorOptions: [
      { name: 'Light Oak', hex: '#D7CCC8' },
      { name: 'Walnut Dark', hex: '#4E342E' },
    ],
    rating: 4.6,
    reviewsCount: 78,
    inStock: true,
    warranty: '5 Years Termite & Hardware Warranty',
    isPopular: true,
    tags: ['wardrobe', 'storage', 'bedroom', 'closet', 'wooden wardrobe', '3 door'],
  },

  // 6. TV Unit (from left screenshot)
  {
    id: 'tv-unit-modern-console',
    name: 'TV Unit',
    category: 'tv-units',
    price: 18999,
    originalPrice: 24500,
    description: 'Sleek entertainment unit with cable management.',
    longDescription:
      'Accommodates up to 75-inch smart TVs. Features concealed magnetic catch cabinets, central tempered glass shelving for media players, and rear grommets for tidy cable routing without clutter.',
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '66 inches',
      depth: '18 inches',
      height: '22 inches',
    },
    material: 'Solid Acacia Wood & Powder-coated Steel Legs',
    finish: 'Warm Teak Polish',
    color: 'Teak & Charcoal',
    colorOptions: [
      { name: 'Teak & Charcoal', hex: '#6D4C41' },
      { name: 'Smoked Ash', hex: '#424242' },
    ],
    rating: 4.7,
    reviewsCount: 88,
    inStock: true,
    warranty: '5 Years Warranty',
    isPopular: true,
    tags: ['tv unit', 'tv console', 'entertainment unit', 'living room', 'media console'],
  },

  // 7. 4 Seater Dining Table (from right screenshot)
  {
    id: 'dining-4-seater-compact',
    name: '4 Seater Dining Table',
    category: 'dining',
    price: 18999,
    originalPrice: 24000,
    description: 'Compact wooden dining table with 4 chairs.',
    longDescription:
      'Designed for modern urban apartments, this 4-seater dining set features space-efficient proportions, rounded corner safety contours, and comfortable foam-padded dining chairs that tuck neatly underneath when not in use.',
    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '48 inches',
      depth: '34 inches',
      height: '30 inches',
    },
    material: 'Solid Rubberwood & Natural Linen Fabric',
    finish: 'Warm Honey Polish',
    seatingCapacity: 4,
    color: 'Honey Oak',
    colorOptions: [
      { name: 'Honey Oak', hex: '#8D6E63' },
      { name: 'Walnut Brown', hex: '#4E342E' },
    ],
    rating: 4.6,
    reviewsCount: 110,
    inStock: true,
    warranty: '5 Years Warranty',
    isPopular: false,
    tags: ['dining', 'dining table', 'wooden dining table', '4 seater', 'compact', 'chairs'],
  },

  // 8. Extendable Dining Table (from right screenshot)
  {
    id: 'dining-extendable-table',
    name: 'Extendable Dining Table',
    category: 'dining',
    price: 32999,
    originalPrice: 42000,
    description: 'Wooden dining table with extendable top.',
    longDescription:
      'Features a smooth butterfly extension mechanism that effortlessly expands the seating from 4 to 6 or 8 guests in seconds. Built from kiln-dried solid timber for lifelong durability.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '60 to 82 inches (extended)',
      depth: '36 inches',
      height: '30 inches',
    },
    material: 'Solid Beech Wood & German Extension Hardware',
    finish: 'Natural Beech Matte Lacquer',
    seatingCapacity: 8,
    color: 'Natural Beech',
    colorOptions: [{ name: 'Natural Beech', hex: '#A1887F' }],
    rating: 4.8,
    reviewsCount: 64,
    inStock: true,
    warranty: '7 Years Warranty',
    isPopular: true,
    tags: ['dining', 'dining table', 'wooden dining table', 'extendable', 'flexible', 'chairs'],
  },

  // 9. Marble Top Dining Table (from right screenshot)
  {
    id: 'dining-marble-top',
    name: 'Marble Top Dining Table',
    category: 'dining',
    price: 34999,
    originalPrice: 46000,
    description: 'Wooden frame with marble top. 6 seater.',
    longDescription:
      'An exquisite statement centerpiece pairing genuine Italian Carrara marble stone top with a solid handcrafted wooden foundation. Heat and scratch resistant surface treated with protective nanocoat.',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '72 inches',
      depth: '38 inches',
      height: '30 inches',
    },
    material: 'Italian Carrara Marble Top & Solid Oak Frame',
    finish: 'Honed Marble & Dark Oak',
    seatingCapacity: 6,
    color: 'White Marble & Dark Oak',
    colorOptions: [
      { name: 'White Marble', hex: '#EEEEEE' },
      { name: 'Black Marquina', hex: '#263238' },
    ],
    rating: 4.9,
    reviewsCount: 82,
    inStock: true,
    warranty: '10 Years Frame Warranty',
    isPopular: true,
    tags: ['dining', 'dining table', 'marble dining table', 'wooden frame', '6 seater', 'luxury'],
  },

  // 10. Round Dining Table (from right screenshot)
  {
    id: 'dining-round-wood',
    name: 'Round Dining Table',
    category: 'dining',
    price: 22999,
    originalPrice: 29000,
    description: 'Elegant round wooden dining table with 4 chairs.',
    longDescription:
      'Circular dining tables foster intimate conversation and flow. Features a sculptural fluted pedestal base in solid ash wood, accommodating 4-5 chairs without awkward corner legs.',
    image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '48 inches diameter',
      depth: '48 inches diameter',
      height: '30 inches',
    },
    material: 'Solid Ash Wood',
    finish: 'Smoked Ash Matte Finish',
    seatingCapacity: 4,
    color: 'Warm Ash',
    colorOptions: [{ name: 'Warm Ash', hex: '#8D6E63' }],
    rating: 4.7,
    reviewsCount: 75,
    inStock: true,
    warranty: '5 Years Warranty',
    isPopular: false,
    tags: ['dining', 'dining table', 'round dining table', 'wooden dining table', '4 chairs', 'round'],
  },

  // 11. 8 Seater Dining Table (from right screenshot)
  {
    id: 'dining-8-seater-grand',
    name: '8 Seater Dining Table',
    category: 'dining',
    price: 42999,
    originalPrice: 55000,
    description: 'Large wooden dining table with 8 chairs.',
    longDescription:
      'Grand dining experience tailored for large families and celebratory dinner hosting. Includes 8 ergonomic high-back chairs upholstered in stain-shield treated woven fabric.',
    image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    dimensions: {
      width: '96 inches',
      depth: '42 inches',
      height: '30 inches',
    },
    material: 'Kiln-Dried Solid Teak & Premium Upholstery',
    finish: 'Hand-Rubbed Oil Polish',
    seatingCapacity: 8,
    color: 'Deep Teak',
    colorOptions: [{ name: 'Deep Teak', hex: '#4E342E' }],
    rating: 4.9,
    reviewsCount: 54,
    inStock: true,
    warranty: '10 Years Warranty',
    isPopular: true,
    tags: ['dining', 'dining table', 'wooden dining table', '8 seater', 'large', 'solid wood', 'chairs'],
  },

  // 12. Modern Lounge Armchair (from category chairs)
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
    dimensions: {
      width: '32 inches',
      depth: '31 inches',
      height: '33 inches',
    },
    material: 'Textured Bouclé Fabric & Solid Wood Legs',
    color: 'Charcoal Grey',
    rating: 4.8,
    reviewsCount: 112,
    inStock: true,
    warranty: '3 Years Warranty',
    tags: ['chairs', 'armchair', 'lounge chair', 'living room'],
  },

  // 13. Solid Wood Storage Chest (from category storage)
  {
    id: 'storage-chest-drawers',
    name: 'Solid Wood 6-Drawer Chest',
    category: 'storage',
    price: 19499,
    originalPrice: 24999,
    description: 'Spacious 6-drawer wooden dresser for bedrooms and living.',
    longDescription:
      'Seamlessly organizes clothes, documents, and essentials with smooth metal ball-bearing drawer slides.',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
    dimensions: {
      width: '54 inches',
      depth: '19 inches',
      height: '34 inches',
    },
    material: 'Solid Mango Wood',
    color: 'Honey Natural',
    rating: 4.7,
    reviewsCount: 46,
    inStock: true,
    warranty: '5 Years Warranty',
    tags: ['storage', 'dresser', 'drawers', 'bedroom storage'],
  },

  // 14. Outdoor Teak Patio Armchair (from category outdoor)
  {
    id: 'outdoor-patio-chair',
    name: 'Outdoor Teak Patio Chair',
    category: 'outdoor',
    price: 11499,
    originalPrice: 15000,
    description: 'Weatherproof teak wooden chair with sunproof fabric.',
    longDescription:
      'Naturally weather-resistant grade-A teak frame with Olefin UV-resistant removable washable cushions.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    dimensions: {
      width: '28 inches',
      depth: '30 inches',
      height: '32 inches',
    },
    material: 'Grade-A Natural Teak & Weatherproof Fabric',
    color: 'Sandy Beige & Teak',
    rating: 4.8,
    reviewsCount: 38,
    inStock: true,
    warranty: '3 Years Outdoor Warranty',
    tags: ['outdoor', 'patio', 'balcony', 'teak', 'chair'],
  },

  // 15. Kids Solid Wood Bunk Bed (from category kids)
  {
    id: 'kids-bunk-bed',
    name: 'Kids Solid Wood Bunk Bed',
    category: 'kids',
    price: 28999,
    originalPrice: 36000,
    description: 'Twin over twin bunk bed with safety guardrails & ladder.',
    longDescription:
      'Child-safe rounded corners, non-toxic water-based finish, and sturdy integrated ladder that converts into two standalone single beds as your children grow.',
    image: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=800&q=80',
    dimensions: {
      width: '42 inches',
      depth: '78 inches',
      height: '64 inches',
    },
    material: 'Solid Pine Wood',
    color: 'Natural Pine & White',
    rating: 4.9,
    reviewsCount: 52,
    inStock: true,
    warranty: '5 Years Warranty',
    tags: ['kids', 'bunk bed', 'bed', 'children furniture', 'twin bed'],
  },

  // 16. Monstera Planter & Stand (from category decor)
  {
    id: 'decor-monstera-planter',
    name: 'Ceramic Planter & Stand',
    category: 'decor',
    price: 3499,
    originalPrice: 4800,
    description: 'Handcrafted ceramic pot with elevated wooden stand.',
    longDescription:
      'Elevates your indoor greenery with a glazed ceramic pot and interlocking solid beechwood stand.',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    dimensions: {
      width: '12 inches diameter',
      depth: '12 inches diameter',
      height: '18 inches',
    },
    material: 'Glazed Ceramic & Solid Beech Wood',
    color: 'Matte White & Natural Wood',
    rating: 4.9,
    reviewsCount: 130,
    inStock: true,
    warranty: '1 Year Warranty',
    tags: ['decor', 'planter', 'plant pot', 'living room decor', 'indoor plant'],
  },
];

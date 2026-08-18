/**
 * Template Registry
 *
 * Central registry of all premium storefront templates.
 * Each template is lazy-loaded to keep the main bundle lean.
 */

export const TEMPLATES = {
  honeyspicy: {
    id: 'honeyspicy',
    name: 'Honey Gourmet Template',
    description: 'Warm gourmet & culinary template with golden honey accents, food menu filterable catalog, and smooth micro-animations.',
    category: 'Gourmet / Food & Restaurant',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'menu', 'reviews', 'about', 'contact'],
    component: () => import('./honeyspicy/HoneySpicyApp'),
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Luxe Template',
    description: 'Sleek, ultra-modern dark luxury & high-tech storefront template. Features glassmorphic cards, neon accent highlights, quick-view product modal, and 3D floating hero.',
    category: 'Luxury / High-Tech & Fashion',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./obsidian/ObsidianApp'),
  },
  minimalist: {
    id: 'minimalist',
    name: 'Studio Minimalist',
    description: 'Clean monochrome Scandinavian studio aesthetic. Pristine whitespace, fine slate borders, and architectural product layout.',
    category: 'Minimalist / Design & Furniture',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./minimalist/MinimalistApp'),
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Dark futuristic synthwave storefront with glowing magenta neon outlines, glitch aesthetics, and high-tech streetwear vibe.',
    category: 'Futuristic / Gaming & Streetwear',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./cyberpunk/CyberpunkApp'),
  },
  emerald: {
    id: 'emerald',
    name: 'Verdant Organics',
    description: 'Deep forest green and mint organic aesthetic. Perfect for natural skincare, botanical herbs, teas, and eco-friendly products.',
    category: 'Organic / Skincare & Wellness',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./emerald/EmeraldApp'),
  },
  royal: {
    id: 'royal',
    name: 'Velvet Royalty',
    description: 'Imperial obsidian velvet palette with polished gold accents. Designed for high-end jewelry, luxury watches, and haute couture.',
    category: 'Ultra-Luxury / Jewelry & Timepieces',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./royal/RoyalApp'),
  },
  boho: {
    id: 'boho',
    name: 'Terracotta Earth',
    description: 'Warm clay, terracotta, and sun-baked sand aesthetic. Features arched product cards for artisanal ceramics, crafts, and home decor.',
    category: 'Artisanal / Ceramics & Home Decor',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./boho/BohoApp'),
  },
  popart: {
    id: 'popart',
    name: 'Vibrant Pop Art',
    description: 'Electric yellow, hot pink neobrutalism layout with thick black outline borders and comic badge highlights for pop culture & toys.',
    category: 'Pop Culture / Toys & Streetwear',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./popart/PopArtApp'),
  },
  retro: {
    id: 'retro',
    name: 'Vintage 70s Vinyl',
    description: 'Groovy 1970s warm mustard & burnt orange aesthetic. Ideal for vinyl records, vintage clothing, antiques, and analog gear.',
    category: 'Vintage / Vinyl Records & Antiques',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./retro/RetroApp'),
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel Bloom',
    description: 'Soft powder lavender and pillowy soft cards. Designed for cosmetics, floral arrangements, baby care, and delicate stationery.',
    category: 'Beauty / Cosmetics & Florists',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./pastel/PastelApp'),
  },
  industrial: {
    id: 'industrial',
    name: 'Concrete & Iron',
    description: 'Heavy charcoal and caution yellow industrial aesthetic with stencil headers for hardware, power tools, and automotive gear.',
    category: 'Industrial / Tools & Hardware',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./industrial/IndustrialApp'),
  },
  zenith: {
    id: 'zenith',
    name: 'Zenith Clean Health',
    description: 'Clinical medical cyan and pure white precision layout. Engineered for pharmacies, health tech, supplements, and fitness gear.',
    category: 'Health / Supplements & Pharmacy',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./zenith/ZenithApp'),
  },
  monochrome: {
    id: 'monochrome',
    name: 'Noir Editorial',
    description: 'Stark black and white Vogue editorial aesthetic with high-contrast typography for high-fashion runway apparel and designer goods.',
    category: 'High-Fashion / Editorial Apparel',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./monochrome/MonochromeApp'),
  },
  artisan: {
    id: 'artisan',
    name: 'Crafted Artisan',
    description: 'Rich espresso brown, baked amber, and cream parchment aesthetic for specialty coffee roasters, micro-bakeries, and artisan treats.',
    category: 'Artisan / Coffee Roasters & Bakery',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./artisan/ArtisanApp'),
  },
  futura: {
    id: 'futura',
    name: 'Futura Holographic',
    description: 'Translucent iridescent glassmorphism with holographic gradients. Tailored for Web3 hardware, digital collectibles, and AR tech.',
    category: 'Web3 / Digital Goods & AR Tech',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./futura/FuturaApp'),
  },
  lookbook: {
    id: 'lookbook',
    name: 'Fashion Lookbook',
    description: 'Full-viewport scroll-snap slides. Each product is a cinematic full-screen page, like flipping through a fashion lookbook.',
    category: 'Fashion / Photography & Runway',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./lookbook/LookbookApp'),
  },
  bazaar: {
    id: 'bazaar',
    name: 'Bazaar Marketplace',
    description: 'Marketplace layout with search bar, category pill filters, star ratings, seller badges, sort controls, and deal banners.',
    category: 'Marketplace / Multi-Category Retail',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./bazaar/BazaarApp'),
  },
  timeline: {
    id: 'timeline',
    name: 'Gallery Museum',
    description: 'Art exhibition layout showing products one at a time like museum pieces on dark walls. Large prev/next navigation, progress dots, and framed artwork display.',
    category: 'Art / Gallery & Exhibition',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./timeline/TimelineApp'),
  },
  department: {
    id: 'department',
    name: 'Department Store',
    description: 'Traditional e-commerce with left sidebar category filters, breadcrumbs, adjustable grid columns, and sort/search toolbar.',
    category: 'General / Department Store & Wholesale',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./department/DepartmentApp'),
  },
  polaroid: {
    id: 'polaroid',
    name: 'Polaroid Scrapbook',
    description: 'Scattered tilted polaroid photo cards pinned to a corkboard. Handwriting-style font, tape and pin effects, whimsical layout.',
    category: 'Creative / Photography & Gifts',
    thumbnail: null,
    minPlan: 'growth',
    pages: ['home', 'catalog', 'reviews', 'about', 'contact'],
    component: () => import('./polaroid/PolaroidApp'),
  },
}

/**
 * Get a template definition by its ID.
 * @param {string} templateId
 * @returns {object|null}
 */
export function getTemplate(templateId) {
  return TEMPLATES[templateId] || null
}

/**
 * Get all available template definitions as an array.
 * @returns {object[]}
 */
export function getAllTemplates() {
  return Object.values(TEMPLATES)
}

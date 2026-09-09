import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'
import BrandLogoRenderer from '../../components/shop/BrandLogoRenderer'

/**
 * OCEANCATCH & SEAFOOD MARKET TEMPLATE
 * Designed specifically for Fish, Fresh/Frozen Seafood, Shellfish, Prawns, Crabs,
 * Kiln-Smoked Fish, Dried Crayfish, and Coastal Grill / Seafood Boil Platters.
 *
 * Visual style: Deep Atlantic Navy (#0A192F), Marine Cyan (#0284C7), Sea Foam (#E0F2FE),
 * Lobster Coral accents (#E11D48), and cold-chain flake-ice trust badges.
 */

// Helper to determine the seafood source, condition, and preparation badge
function getItemBadge(product) {
  const text = `${product.name || ''} ${product.description || ''} ${product.category_name || ''} ${product.store_catalogue || ''}`.toLowerCase()

  if (
    text.includes('prawn') || text.includes('shrimp') || text.includes('crab') ||
    text.includes('lobster') || text.includes('calamari') || text.includes('squid') ||
    text.includes('octopus') || text.includes('oyster') || text.includes('periwinkle') ||
    text.includes('snail') || text.includes('crawfish')
  ) {
    return {
      text: '🦐 Jumbo Shellfish & Crustacean',
      bg: 'bg-rose-100 text-rose-900 border-rose-300',
      tag: 'Shellfish',
      prepTip: 'Cleaned, deveined, or whole in shell. Packed live or on crushed flake ice.'
    }
  }

  if (
    text.includes('smoked') || text.includes('dry') || text.includes('dried') ||
    text.includes('crayfish') || text.includes('stockfish') || text.includes('panla') ||
    text.includes('bonga') || text.includes('kpanla')
  ) {
    return {
      text: '🪵 Kiln-Smoked & Dried Catch',
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      tag: 'Smoked & Dried',
      prepTip: 'Hardwood wood-smoked, 100% moisture sealed. Store at room temp or freeze.'
    }
  }

  if (
    text.includes('boil') || text.includes('grill') || text.includes('soup') ||
    text.includes('pepper') || text.includes('platter') || text.includes('pot') ||
    text.includes('rice') || text.includes('pasta') || text.includes('ready') ||
    text.includes('cooked')
  ) {
    return {
      text: '🍲 Coastal Grill & Cooked Platter',
      bg: 'bg-orange-100 text-orange-900 border-orange-300',
      tag: 'Cooked / Grill',
      prepTip: 'Freshly prepared to order. Foil insulated and dispatched hot & ready to eat.'
    }
  }

  if (
    text.includes('frozen') || text.includes('freeze') || text.includes('fillet') ||
    text.includes('salmon') || text.includes('steak') || text.includes('block')
  ) {
    return {
      text: '❄️ Sub-Zero Fillet & Frozen',
      bg: 'bg-sky-100 text-sky-900 border-sky-300',
      tag: 'Frozen Portions',
      prepTip: 'Flash-frozen at -18°C. Vacuum sealed with gel ice packs.'
    }
  }

  return {
    text: '🐟 Wild Ocean Fresh Catch',
    bg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    tag: 'Fresh Fish',
    prepTip: 'Landed fresh daily. Free descaling, gutting, or steak cuts upon request.'
  }
}

export default function SeafoodApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      {/* Mobile Navigation Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="seafood" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Coastal Cold-Chain & Freshness Top Banner */}
      <div className="bg-[#0A192F] text-cyan-100 py-2 px-4 text-xs font-medium border-b border-cyan-800/60 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>🌊 <strong>Ocean-Fresh Fishery Direct:</strong> Chilled on Crushed Flake Ice • Free Custom Kitchen Prep</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-cyan-200/80 text-[11px]">
            <span>🚚 Same-Day Cold Dispatch</span>
            <span>•</span>
            <span>🛡️ MultiShop Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs text-slate-500 hover:text-[#0284C7] transition-colors flex items-center gap-1 font-medium">
              <span>←</span> MultiShop Marketplace
            </Link>
            <div className="h-4 w-px bg-slate-200"></div>
            <Link to={`/shop/${base}`} className="flex items-center gap-3">
              <BrandLogoRenderer
                shop={shop}
                accentColor="#0284C7"
                textClassName="text-2xl font-black tracking-tight text-[#0A192F]"
                logoClassName="w-10 h-10 rounded-xl border border-cyan-200 object-cover shadow-2xs"
              />
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link to={`/shop/${base}`} className="hover:text-[#0284C7] transition-colors py-1">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#0284C7] transition-colors py-1 flex items-center gap-1">
              <span>Ocean Catch</span>
              <span className="bg-cyan-100 text-[#0284C7] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            </Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#0284C7] transition-colors py-1">Fishery Story</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#0284C7] transition-colors py-1">Catch Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-[#0A192F] hover:bg-[#0C2340] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all"
            >
              <span>🛒 Seafood Basket</span>
              <span className="bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full font-extrabold text-[11px]">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* App Body / Routed Views */}
      <main className="flex-1">
        <Routes>
          <Route index element={<SeafoodHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<SeafoodCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="cart" element={<SeafoodCart shop={shop} shopSlug={base} />} />
          <Route path="checkout" element={<SeafoodCheckout shop={shop} shopSlug={base} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={base} theme="seafood" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView shop={shop} shopSlug={base} theme="seafood" reviews={reviews} />} />
        </Routes>
      </main>

      {/* Universal Footer */}
      <TemplateFooterView shop={shop} shopSlug={base} theme="seafood" setIsCartOpen={setIsCartOpen} />

      {/* Quick View Modal */}
      {quickView && (
        <SeafoodModal product={quickView} onClose={() => setQuickView(null)} />
      )}
    </div>
  )
}

/* =======================================================================
   1. SEAFOOD HOME PAGE
   ======================================================================= */
function SeafoodHome({ shop, products, base, onQuickView }) {
  const extra = shop?.theme?.extra_tokens || {}
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState('ALL')

  const customCatalogues = shop?.theme?.extra_tokens?.custom_catalogues || {}
  const getCategoryDisplay = (p) => {
    const raw = p.category?.name || p.category_name || p.category
    if (!raw) return 'FRESH SEAFOOD'
    const custom = customCatalogues[raw] || Object.entries(customCatalogues).find(([k]) => k.toLowerCase() === String(raw).toLowerCase())?.[1]
    return (custom || raw).toUpperCase()
  }

  // Filter products by condition tag
  const filteredProducts = useMemo(() => {
    if (selectedBadgeFilter === 'ALL') return products
    return products.filter(p => {
      const b = getItemBadge(p)
      return b.tag.toLowerCase().includes(selectedBadgeFilter.toLowerCase())
    })
  }, [products, selectedBadgeFilter])

  const featured = filteredProducts.slice(0, 6)
  const heroImage = extra.hero_image_1 || 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80'

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-[#0A192F] via-[#0C2340] to-[#04324F] text-white overflow-hidden py-14 md:py-20 px-6">
        {/* Subtle Water Shimmer Background Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00F0FF_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-xs">
              <span className="text-sm">🌊</span>
              <span>{extra.hero_badge || 'Ocean-Fresh & Cold-Packed Guarantee'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {extra.hero_title || shop.name || 'Wild Ocean Catch, Fresh Seafood & Coastal Grills'}
            </h1>

            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {extra.hero_subtitle || shop.tagline || 'Harvested from coastal trawlers and local fisheries direct to your kitchen or restaurant. Delivered chilled on crushed flake ice with free kitchen cleaning.'}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to={`/shop/${base}/catalog`}
                className="px-6 py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-900/40 transition-all transform hover:-translate-y-0.5"
              >
                {extra.hero_cta_primary || 'Shop Ocean Catch'} →
              </Link>
              <Link
                to={`/shop/${base}/about`}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-cyan-100 text-sm font-bold rounded-xl border border-white/20 transition-colors"
              >
                Our Fishery Story
              </Link>
            </div>

            {/* Quick Micro-Pillars */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-cyan-800/40 text-left">
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <span className="text-base block">🧊</span>
                <span className="text-xs font-bold text-white block">Flake Ice</span>
                <span className="text-[10px] text-cyan-200/70">Transit under 4°C</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <span className="text-base block">🔪</span>
                <span className="text-xs font-bold text-white block">Free Prep</span>
                <span className="text-[10px] text-cyan-200/70">Descaled & cut</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <span className="text-base block">🛡️</span>
                <span className="text-xs font-bold text-white block">Escrow Protected</span>
                <span className="text-[10px] text-cyan-200/70">Delivery code</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl group">
              <img
                src={heroImage}
                alt={shop.name || 'Seafood Showcase'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white/40 text-slate-900 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🐟</span>
                    <div>
                      <p className="text-xs font-bold text-[#0A192F]">Daily Catch Landed</p>
                      <p className="text-[10px] text-slate-500">100% Wild, Fresh & Farm Raised</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-[#0284C7]">
                    FRESH TODAY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Quality Pillars */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-cyan-400 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center text-lg font-bold mb-2">
              🎣
            </div>
            <h4 className="text-sm font-bold text-slate-900">{extra.feature1_title || 'Wild & Fishery Direct'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{extra.feature1_desc || 'Sourced directly from coastal trawlers & local artisanal fishermen.'}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-cyan-400 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center text-lg font-bold mb-2">
              🧊
            </div>
            <h4 className="text-sm font-bold text-slate-900">{extra.feature2_title || 'Flake Ice Transit'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{extra.feature2_desc || 'Packed on crushed ice in insulated thermal boxes kept under 4°C.'}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-cyan-400 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold mb-2">
              🔪
            </div>
            <h4 className="text-sm font-bold text-slate-900">{extra.feature3_title || 'Free Kitchen Prep'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{extra.feature3_desc || 'Cleaned, descaled, gutted, or cut into steaks at no extra cost.'}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-cyan-400 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center text-lg font-bold mb-2">
              🛡️
            </div>
            <h4 className="text-sm font-bold text-slate-900">{extra.feature4_title || 'Doorstep Escrow'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{extra.feature4_desc || 'Same-day delivery secured with your 6-digit confirmation code.'}</p>
          </div>
        </div>
      </section>

      {/* Featured Catch Showcase Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-100 text-[#0284C7] uppercase tracking-wider">
                Fresh Inventory
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {extra.featured_title || 'Catch of the Day & Best Sellers'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspected wild catch, shellfish, smoked fish, and ready platters
            </p>
          </div>

          {/* Condition Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'Fresh', label: '🐟 Fresh Catch' },
              { id: 'Shellfish', label: '🦐 Shellfish' },
              { id: 'Smoked', label: '🪵 Smoked & Dried' },
              { id: 'Cooked', label: '🍲 Cooked Platters' },
              { id: 'Frozen', label: '❄️ Flash-Frozen' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedBadgeFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedBadgeFilter === f.id
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid: 2 columns on mobile, 3 columns on desktop */}
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {featured.map(product => (
              <SeafoodCard
                key={product.public_id || product.slug}
                product={product}
                onQuickView={onQuickView}
                getCategoryDisplay={getCategoryDisplay}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
            <p className="text-3xl">🌊</p>
            <h4 className="text-sm font-bold text-slate-800">No items found under this catch category</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try clicking "All Items" above or explore our complete catalog.
            </p>
            <button
              onClick={() => setSelectedBadgeFilter('ALL')}
              className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
            >
              Show All Catch
            </button>
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            to={`/shop/${base}/catalog`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A192F] hover:bg-[#0284C7] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>View Full Seafood Inventory ({products.length} items)</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Customer Trust Callout */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-[11px] font-bold">
              <span>🐟 Direct Kitchen Cleaning Guarantee</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Need Custom Slicing, Gutting, or Event Portions?</h3>
            <p className="text-xs text-cyan-100/80 max-w-xl">
              We provide complimentary descaling, gutting, steak slicing, and airtight insulated packaging. Just add a note in checkout or message us directly!
            </p>
          </div>
          {shop.phone && (
            <a
              href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2"
            >
              <span>💬 Chat with Fishery Team</span>
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

/* =======================================================================
   2. SEAFOOD CATALOG PAGE
   ======================================================================= */
function SeafoodCatalog({ shop, products = [], onQuickView }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [sort, setSort] = useState('featured')

  const customCatalogues = shop?.theme?.extra_tokens?.custom_catalogues || {}
  const getCategoryDisplay = (p) => {
    const raw = p.category?.name || p.category_name || p.category
    if (!raw) return 'FRESH SEAFOOD'
    const custom = customCatalogues[raw] || Object.entries(customCatalogues).find(([k]) => k.toLowerCase() === String(raw).toLowerCase())?.[1]
    return (custom || raw).toUpperCase()
  }

  // Derive categories dynamically from products
  const categories = useMemo(() => {
    const set = new Set()
    products.forEach(p => {
      set.add(getCategoryDisplay(p))
    })
    return ['ALL', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.store_catalogue?.toLowerCase().includes(search.toLowerCase())

      const catDisplay = getCategoryDisplay(p)
      const matchCategory = categoryFilter === 'ALL' || catDisplay === categoryFilter

      return matchSearch && matchCategory
    }).sort((a, b) => {
      if (sort === 'price-low') return Number(a.base_price || 0) - Number(b.base_price || 0)
      if (sort === 'price-high') return Number(b.base_price || 0) - Number(a.base_price || 0)
      if (sort === 'rating') return Number(b.rating_average || 0) - Number(a.rating_average || 0)
      return 0
    })
  }, [products, search, categoryFilter, sort])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Seafood & Fishery Catalog
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse wild fish, crustaceans, smoked crayfish, and coastal cooked specials
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search fish, prawns, crayfish, soup cuts, lobster..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="featured">Sort: Featured Catch</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated ⭐</option>
            </select>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong>{filtered.length}</strong> items in stock</span>
        {(search || categoryFilter !== 'ALL') && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter('ALL'); }}
            className="text-[#0284C7] hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid: 2 columns on mobile, 3 columns on desktop */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filtered.map(product => (
            <SeafoodCard
              key={product.public_id || product.slug}
              product={product}
              onQuickView={onQuickView}
              getCategoryDisplay={getCategoryDisplay}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <p className="text-4xl">🐟</p>
          <h3 className="text-base font-bold text-slate-800">No matching seafood items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any products matching your search. Try changing your filters or searching a different keyword.
          </p>
          <button
            onClick={() => { setSearch(''); setCategoryFilter('ALL'); }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
          >
            Reset Catalog
          </button>
        </div>
      )}
    </div>
  )
}

/* =======================================================================
   3. SEAFOOD PRODUCT CARD
   ======================================================================= */
function SeafoodCard({ product, onQuickView, getCategoryDisplay }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const badge = getItemBadge(product)
  const primaryImg = product.primary_image || product.images?.[0]?.medium || product.images?.[0]?.image || product.images?.[0]
  const imgSrc = getImageUrl(typeof primaryImg === 'string' ? primaryImg : (primaryImg?.medium || primaryImg?.image), product.name)

  const priceNum = Number(product.base_price || 0)
  const compareNum = Number(product.compare_at_price || 0)
  const hasDiscount = compareNum > priceNum

  const hasVariants = product.has_variants && (product.variants?.length > 0)

  const handleAdd = (e) => {
    e.stopPropagation()
    if (hasVariants) {
      onQuickView(product)
      return
    }
    addToCart({
      id: product.public_id || product.id,
      product_id: product.id,
      name: product.name,
      price: priceNum,
      unit_price: priceNum,
      image: imgSrc,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div
      onClick={() => onQuickView(product)}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Card Image with Badges */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Condition Badge */}
          <div className="absolute top-2 left-2 max-w-[85%]">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border shadow-2xs truncate ${badge.bg}`}>
              {badge.text}
            </span>
          </div>

          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
              SALE
            </span>
          )}

          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
            {badge.tag}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-1.5">
          <div className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider truncate">
            {getCategoryDisplay ? getCategoryDisplay(product) : (product.category_name || 'SEAFOOD')}
          </div>

          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0284C7] transition-colors">
            {product.name}
          </h3>

          <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
            <span>🔪 Free cleaning & cut on request</span>
          </div>
        </div>
      </div>

      {/* Footer / Price & Actions */}
      <div className="p-3 sm:p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs sm:text-sm font-black text-[#0A192F]">
            ₦{priceNum.toLocaleString()}
          </div>
          {hasDiscount && (
            <div className="text-[10px] text-slate-400 line-through">
              ₦{compareNum.toLocaleString()}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-[#0A192F] hover:bg-[#0284C7] text-white'
          }`}
        >
          {added ? (
            <span>✓ In Box</span>
          ) : hasVariants ? (
            <span>Options ▾</span>
          ) : (
            <span>+ Add</span>
          )}
        </button>
      </div>
    </div>
  )
}

/* =======================================================================
   4. QUICK VIEW MODAL (WITH VARIANT PHOTO SWITCHING)
   ======================================================================= */
function SeafoodModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return product.variants?.find(v => v.is_default) || product.variants?.[0] || null
  })
  const [activeVariantImage, setActiveVariantImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [prepNote, setPrepNote] = useState('')
  const [added, setAdded] = useState(false)

  const badge = getItemBadge(product)

  // Primary image fallback
  const primaryImg = product.primary_image || product.images?.[0]?.medium || product.images?.[0]?.image || product.images?.[0]
  const defaultImgSrc = getImageUrl(typeof primaryImg === 'string' ? primaryImg : (primaryImg?.medium || primaryImg?.image), product.name)

  // Active display image respects variant photo switching
  const displayImage = activeVariantImage || (selectedVariant?.image ? getImageUrl(selectedVariant.image) : defaultImgSrc)

  const priceNum = selectedVariant
    ? Number(selectedVariant.price || product.base_price || 0)
    : Number(product.base_price || 0)

  const handleSelectVariant = (v) => {
    setSelectedVariant(v)
    if (v.image) {
      setActiveVariantImage(getImageUrl(v.image))
    } else {
      setActiveVariantImage(defaultImgSrc)
    }
  }

  const handleAdd = () => {
    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : (product.public_id || product.id),
      product_id: product.id,
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      variant_id: selectedVariant?.id || null,
      variant_name: selectedVariant?.name || null,
      unit_price: priceNum,
      price: priceNum,
      image: displayImage,
      quantity,
      bespoke_notes: prepNote ? `[PREP]: ${prepNote}` : undefined,
    })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Main Photo with Dynamic Variant Switch */}
          <div className="space-y-2">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            <div className={`p-2.5 rounded-lg border text-xs leading-tight space-y-1 ${badge.bg}`}>
              <div className="font-bold flex items-center gap-1">
                <span>🧊</span>
                <span>Cold-Chain Handling:</span>
              </div>
              <p className="text-[11px] opacity-90">{badge.prepTip}</p>
            </div>
          </div>

          {/* Details & Controls */}
          <div className="space-y-4 text-left">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1.5 ${badge.bg}`}>
                {badge.text}
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {product.name}
              </h2>
              <div className="text-lg font-black text-[#0A192F] mt-1">
                ₦{priceNum.toLocaleString()}
              </div>
            </div>

            {product.description && (
              <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                {product.description}
              </p>
            )}

            {/* Variant Picker */}
            {product.variants?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Size, Weight or Prep Option:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map(v => (
                    <button
                      key={v.id || v.name}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        selectedVariant?.id === v.id
                          ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {v.image && <span className="text-xs">📸</span>}
                      <span>{v.name}</span>
                      <span className="text-[10px] opacity-75">
                        (₦{Number(v.price || product.base_price).toLocaleString()})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Free Prep Note Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Kitchen Prep Preference (Optional):
              </label>
              <input
                type="text"
                value={prepNote}
                onChange={e => setPrepNote(e.target.value)}
                placeholder="e.g. Descale & slice into steaks, keep whole..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            {/* Quantity and Add Button */}
            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-2.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-2.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                }`}
              >
                {added ? '✓ Added to Cold Box!' : `Add to Basket • ₦${(priceNum * quantity).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =======================================================================
   5. SEAFOOD CART VIEW
   ======================================================================= */
function SeafoodCart({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])

  const subtotal = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-5xl">🛒</p>
        <h2 className="text-xl font-bold text-slate-900">Your Seafood Basket is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our daily ocean catch, fresh prawns, crabs, and smoked delicacies to start your order.
        </p>
        <Link
          to={`/shop/${base}/catalog`}
          className="inline-block px-6 py-2.5 bg-[#0A192F] text-white text-xs font-bold rounded-lg shadow-xs"
        >
          Browse Ocean Catch
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Your Cold Basket</h1>
          <p className="text-xs text-slate-500">Chilled transit packaging with crushed flake ice</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-bold"
        >
          Clear Basket
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {items.map((item, idx) => {
          const itemPrice = Number(item.unit_price || item.price || 0)
          return (
            <div key={idx} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-[#0284C7] font-bold">₦{itemPrice.toLocaleString()}</p>
                  {item.bespoke_notes && (
                    <p className="text-[10px] text-slate-500 italic mt-0.5">{item.bespoke_notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity?.(item.id || item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                    className="px-2 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold">{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity?.(item.id || item.product_id, (item.quantity || 1) + 1)}
                    className="px-2 py-1 text-xs font-bold bg-slate-50 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-xs font-black text-slate-900">
                    ₦{(itemPrice * (item.quantity || 1)).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id || item.product_id)}
                  className="text-slate-400 hover:text-rose-600 text-sm font-bold p-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust Notice Box */}
      <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200/60 flex items-center gap-3 text-cyan-950 text-xs">
        <span className="text-xl shrink-0">🧊</span>
        <div className="leading-tight">
          <p className="font-bold">Complimentary Chilled Packaging Included</p>
          <p className="text-[11px] text-cyan-800/80">Every fresh or frozen seafood order is packed in insulated boxes with crushed flake ice or gel packs to maintain ocean freshness.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
        <div className="flex justify-between text-xs text-slate-600">
          <span>Subtotal:</span>
          <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-600">
          <span>Chilled Flake Ice Transit:</span>
          <span className="font-bold text-emerald-600">FREE</span>
        </div>
        <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
          <span>Estimated Total:</span>
          <span className="text-[#0A192F]">₦{subtotal.toLocaleString()}</span>
        </div>

        <button
          onClick={() => navigate(`/shop/${base}/checkout`)}
          className="w-full py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          Proceed to Chilled Checkout →
        </button>
      </div>
    </div>
  )
}

/* =======================================================================
   6. SEAFOOD CHECKOUT VIEW
   ======================================================================= */
function SeafoodCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
    prep_instructions: '',
  })
  const [state, setState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setErrorMsg('')
    try {
      const fullAddress = form.prep_instructions
        ? `${form.shipping_address} [SEAFOOD PREP NOTE: ${form.prep_instructions}]`
        : form.shipping_address

      const r = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: fullAddress,
        city: state,
        state,
        country: 'NG',
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : 'sf-' + Date.now(),
        shop_slug: base,
      })
      clearCart?.()
      setDone(r.order || r || { public_id: 'CONFIRMED' })
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMsg(err.response?.data?.detail || err.message || 'Error processing chilled checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const code = done.delivery_code || done.order?.delivery_code || '------'
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-black mx-auto">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Seafood Order Confirmed!</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          Your catch is being prepared and packed on crushed flake ice. Give this 6-digit confirmation code to the courier <strong>only upon safe doorstep delivery</strong>:
        </p>

        <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-2xl font-black tracking-widest inline-block shadow-lg">
          {code}
        </div>

        <div className="pt-4">
          <Link
            to={`/shop/${base}`}
            className="inline-block px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg"
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Chilled Seafood Checkout</h1>
        <p className="text-xs text-slate-500">Fast doorstep dispatch with MultiShop Escrow protection</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For Courier) *</label>
            <input
              type="tel"
              required
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Delivery State (Nigeria) *</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-medium"
          >
            {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Delta', 'Ogun', 'Kano', 'Enugu', 'Akwa Ibom', 'Edo', 'Bayelsa', 'Cross River'].map(s => (
              <option key={s} value={s}>{s} State</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Delivery Street Address *</label>
          <textarea
            required
            rows={2}
            value={form.shipping_address}
            onChange={e => setForm({ ...form, shipping_address: e.target.value })}
            placeholder="House/Plot number, street name, landmarks, estate name..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        {/* Free Seafood Kitchen Prep & Special Instructions */}
        <div>
          <label className="block text-xs font-bold text-cyan-900 mb-1 flex items-center gap-1">
            <span>🔪 Seafood Prep & Kitchen Instructions (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={form.prep_instructions}
            onChange={e => setForm({ ...form, prep_instructions: e.target.value })}
            placeholder="e.g. Please descale fish & cut into soup steaks / Keep crabs live in basket / Pack extra crushed ice..."
            className="w-full px-3 py-2 text-xs border border-cyan-200 rounded-lg bg-cyan-50/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Complimentary cleaning, descaling, or portion cutting is provided by the merchant.</p>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Total Payable:</span>
          <span className="text-base font-black text-[#0A192F]">₦{total.toLocaleString()}</span>
        </div>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          {loading ? 'Securing Chilled Dispatch…' : `Confirm Order • ₦${total.toLocaleString()}`}
        </button>
      </form>
    </div>
  )
}

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
 * FARMFRESH & COLDSTORE TEMPLATE
 * Designed specifically for Agro, Live Animals (poultry, goats, rams), Fresh Abattoir Cuts,
 * and Flash-Frozen Foods (chicken cuts, fish, seafood, ice cream, sausages).
 *
 * Visual style: Crisp Farm Emerald (#0B4F37), Cold Ice Cyan (#0284C7 / #E0F2FE),
 * Clean Snow White (#FFFFFF / #F8FAFC), and high-trust sanitary badges.
 */

// Helper to determine the cold-chain or livestock condition badge
function getItemBadge(product) {
  const text = `${product.name || ''} ${product.description || ''} ${product.category_name || ''} ${product.store_catalogue || ''}`.toLowerCase()
  if (text.includes('live') || text.includes('bird') || text.includes('broiler') || text.includes('layer') || text.includes('cockerel') || text.includes('turkey') || text.includes('ram') || text.includes('goat') || text.includes('rabbit') || text.includes('chick')) {
    return {
      text: '🐓 Live Farm-Raised',
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      tag: 'Live Livestock',
      storageTip: 'Inspected healthy animal. Delivered in ventilated humane crates or farm pickup.'
    }
  }
  if (text.includes('frozen') || text.includes('freeze') || text.includes('ice') || text.includes('fillet') || text.includes('seafood') || text.includes('fish') || text.includes('prawn') || text.includes('shrimp') || text.includes('sausage') || text.includes('parfait')) {
    return {
      text: '❄️ Sub-Zero Flash Frozen',
      bg: 'bg-sky-100 text-sky-900 border-sky-300',
      tag: 'Cold Storage',
      storageTip: 'Maintained at -18°C. Shipped with insulated ice thermal packs.'
    }
  }
  if (text.includes('fresh') || text.includes('cut') || text.includes('beef') || text.includes('meat') || text.includes('pork') || text.includes('steak') || text.includes('dressed')) {
    return {
      text: '🥩 Fresh Abattoir Cut',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      tag: 'Fresh Meat',
      storageTip: 'Hygienically slaughtered & vacuum sealed. Refrigerate or freeze immediately upon receipt.'
    }
  }
  return {
    text: '🌿 Farm Direct & Inspected',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    tag: 'Farm Produce',
    storageTip: 'Fresh from vetted local farms. Handpicked for quality assurance.'
  }
}

export default function FarmFreshApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col">
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="farmfresh" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Trust & Cold-Chain Top Alert Banner */}
      <div className="bg-[#064E3B] text-emerald-100 py-2 px-4 text-xs font-medium border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>❄️ <strong>Cold-Chain & Freshness Certified:</strong> Sub-Zero Insulated Express & Vet-Inspected Livestock</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-emerald-200/80 text-[11px]">
            <span>🚚 Same-Day Chilled Dispatch</span>
            <span>•</span>
            <span>🛡️ MultiShop Escrow Protected</span>
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium">
              <span>←</span> MultiShop Marketplace
            </Link>
            <div className="h-4 w-px bg-slate-200"></div>
            <Link to={`/shop/${base}`} className="flex items-center gap-3">
              <BrandLogoRenderer
                shop={shop}
                accentColor="#059669"
                textClassName="text-2xl font-bold tracking-tight text-[#064E3B]"
                logoClassName="w-10 h-10 rounded-xl border border-emerald-100 object-cover shadow-2xs"
              />
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link to={`/shop/${base}`} className="hover:text-[#064E3B] transition-colors py-1">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#064E3B] transition-colors py-1 flex items-center gap-1">
              <span>Catalog</span>
              <span className="bg-emerald-100 text-[#064E3B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            </Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#064E3B] transition-colors py-1">Farm Story</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#064E3B] transition-colors py-1">Customer Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#047857] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all"
            >
              <span>🛒 Cold Basket</span>
              <span className="bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full font-extrabold text-[11px]">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route index element={<FarmFreshHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<FarmFreshCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<FarmFreshCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={base} theme="farmfresh" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={base} theme="farmfresh" />} />
          <Route path="checkout" element={<FarmFreshCheckout shop={shop} shopSlug={base} />} />
          <Route path="*" element={<FarmFreshHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {/* QuickView Modal */}
      {quickView && <FarmFreshModal product={quickView} onClose={() => setQuickView(null)} />}

      {/* Slide-out Cart Drawer */}
      <FarmFreshCart shop={shop} shopSlug={base} />

      {/* Universal Footer styled with FarmFresh Theme */}
      <TemplateFooterView shop={shop} shopSlug={base} theme="farmfresh" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function FarmFreshHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}

  const heroHeadline = extra.hero_headline || shop?.tagline || 'Farm-Fresh Livestock & Premium Flash-Frozen Foods'
  const heroSubtitle = extra.hero_subtitle || shop?.description || 'From vetted local poultry farms and cold-storage facilities direct to your kitchen, deep freezer, or food business with temperature-guaranteed transit.'
  const heroBadge = extra.hero_badge || '❄️ Sub-Zero Freshness Guarantee'
  const heroCta = extra.hero_cta_primary || 'Shop Frozen & Live Foods'
  const heroImg = extra.hero_image_1 ? getImageUrl(extra.hero_image_1) : 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80'

  const feature1Title = extra.feature1_title || 'Sub-Zero Cold Chain'
  const feature1Desc = extra.feature1_desc || 'Kept at -18°C with thermal coolers & ice packs'
  const feature2Title = extra.feature2_title || 'Healthy Livestock'
  const feature2Desc = extra.feature2_desc || '100% vaccinated, farm-raised and certified'
  const feature3Title = extra.feature3_title || 'Hygienic Abattoir'
  const feature3Desc = extra.feature3_desc || 'Dressed, portioned & vacuum-sealed cuts'
  const feature4Title = extra.feature4_title || 'Same-Day Dispatch'
  const feature4Desc = extra.feature4_desc || 'Swift temperature-controlled doorstep delivery'

  const featured = products.slice(0, 4)

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#064E3B] to-[#0B4F37] text-white py-16 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-xs">
              {heroBadge}
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {heroHeadline}
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate(`/shop/${base}/catalog`)}
                className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#064E3B] font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-400/20 transition-all flex items-center gap-2"
              >
                <span>{heroCta}</span>
                <span>→</span>
              </button>
              <button
                onClick={() => navigate(`/shop/${base}/about`)}
                className="px-6 py-3.5 bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl border border-emerald-400/30 transition-all"
              >
                Learn Our Cold-Chain Standards
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Live Inventory Quick View</span>
                <span className="text-xs bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-md font-mono">
                  {products.length} Products Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <span className="text-2xl block mb-1">❄️</span>
                  <strong className="text-sm font-bold block text-white">Flash Frozen</strong>
                  <span className="text-[11px] text-emerald-200/80">Chicken, fish, cuts & seafood</span>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <span className="text-2xl block mb-1">🐓</span>
                  <strong className="text-sm font-bold block text-white">Live Animals</strong>
                  <span className="text-[11px] text-emerald-200/80">Broilers, layers, rams & goats</span>
                </div>
              </div>
              <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2.5">
                <span className="text-lg">🛡️</span>
                <span>Backed by MultiShop Escrow. Check temperature and weight before releasing payment!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Features Strip */}
      <section className="bg-white border-b border-slate-200 py-8 px-6 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F0FDF4] border border-emerald-100">
            <span className="text-3xl p-2 bg-emerald-100 rounded-lg">❄️</span>
            <div>
              <h4 className="font-bold text-sm text-[#064E3B]">{feature1Title}</h4>
              <p className="text-xs text-slate-600 mt-1">{feature1Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FEF3C7] border border-amber-100">
            <span className="text-3xl p-2 bg-amber-100 rounded-lg">🐓</span>
            <div>
              <h4 className="font-bold text-sm text-amber-900">{feature2Title}</h4>
              <p className="text-xs text-slate-600 mt-1">{feature2Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#EFF6FF] border border-sky-100">
            <span className="text-3xl p-2 bg-sky-100 rounded-lg">🥩</span>
            <div>
              <h4 className="font-bold text-sm text-sky-900">{feature3Title}</h4>
              <p className="text-xs text-slate-600 mt-1">{feature3Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
            <span className="text-3xl p-2 bg-slate-100 rounded-lg">🚚</span>
            <div>
              <h4 className="font-bold text-sm text-slate-900">{feature4Title}</h4>
              <p className="text-xs text-slate-600 mt-1">{feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">Direct From The Cold Hub</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#064E3B]">Featured Agro & Cold Produce</h2>
            </div>
            <button
              onClick={() => navigate(`/shop/${base}/catalog`)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              View Full Inventory ({products.length}) →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p) => (
              <FarmFreshCard key={p.id} product={p} onQuickView={onQuickView} />
            ))}
          </div>
        </section>
      )}

      {/* Catalog & Filter Section */}
      <FarmFreshCatalog shop={shop} products={products} onQuickView={onQuickView} isHomePreview={false} />
    </div>
  )
}

function FarmFreshCatalog({ shop, products = [], onQuickView, isHomePreview = false }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const [conditionFilter, setConditionFilter] = useState('ALL')

  const customCatalogues = shop?.theme?.extra_tokens?.custom_catalogues || {}

  // Helper matching the universal category & custom catalogue system
  const getCategoryDisplay = (p) => {
    const raw = p.store_catalogue || p.category?.name || p.category_name || p.category
    if (!raw) return 'FARM PRODUCE'
    const custom = customCatalogues[raw] || Object.entries(customCatalogues).find(([k]) => k.toLowerCase() === String(raw).toLowerCase())?.[1]
    return (custom || raw).toUpperCase()
  }

  // Derive unique categories with counts
  const categories = useMemo(() => {
    const map = new Map()
    products.forEach(p => {
      const cat = getCategoryDisplay(p)
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return [
      { name: 'ALL', count: products.length },
      ...Array.from(map.entries()).map(([name, count]) => ({ name, count }))
    ]
  }, [products, customCatalogues])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(p => getCategoryDisplay(p) === selectedCategory)
    }

    // Condition filter (Live, Frozen, Fresh)
    if (conditionFilter !== 'ALL') {
      list = list.filter(p => {
        const badge = getItemBadge(p)
        return badge.tag.toLowerCase().includes(conditionFilter.toLowerCase())
      })
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.store_catalogue || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sort === 'price-low') {
      list.sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    } else if (sort === 'price-high') {
      list.sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    } else if (sort === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return list
  }, [products, selectedCategory, conditionFilter, search, sort, customCatalogues])

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">Cold Chain & Live Animal Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#064E3B]">Browse Complete Farm Inventory</h2>
            <p className="text-xs text-slate-500 mt-1">Select categories, condition types, or search specific cuts and breeds</p>
          </div>

          {/* Search bar & Sort dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chicken, ram, fish, meat..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="py-2.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-emerald-600"
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Condition Filter Bar (Special for Frozen vs Live vs Fresh) */}
        <div className="flex items-center gap-2 py-4 overflow-x-auto text-xs font-bold">
          <span className="text-slate-500 text-[11px] uppercase mr-1">Condition:</span>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'Cold Storage', label: '❄️ Flash Frozen' },
            { id: 'Live Livestock', label: '🐓 Live Livestock' },
            { id: 'Fresh Meat', label: '🥩 Fresh Cuts' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setConditionFilter(c.id)}
              className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                conditionFilter === c.id
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 pt-1 pb-4 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-600'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.name ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <span className="text-4xl block mb-3">❄️</span>
          <h3 className="text-base font-bold text-slate-800">No items found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try adjusting your search query or switching category filters.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('ALL'); setConditionFilter('ALL') }}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(p => (
            <FarmFreshCard key={p.id} product={p} onQuickView={onQuickView} />
          ))}
        </div>
      )}
    </section>
  )
}

function FarmFreshCard({ product, onQuickView }) {
  const { addToCart } = useCart()
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  const badge = getItemBadge(product)

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Product Image & Badge */}
      <div className="relative h-44 sm:h-52 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onQuickView?.(product)}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-emerald-50/50 text-emerald-800">
            {badge.text.includes('🐓') ? '🐓' : badge.text.includes('❄️') ? '❄️' : '🥩'}
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border shadow-xs tracking-wide ${badge.bg}`}>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase block mb-1">
            {product.store_catalogue || product.category_name || badge.tag}
          </span>
          <h3
            onClick={() => onQuickView?.(product)}
            className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {product.description || 'Inspected high quality agro product from vetted local sources.'}
          </p>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block text-[10px]">Price</span>
            <span className="font-extrabold text-base sm:text-lg text-[#064E3B]">
              ₦{price.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickView?.(product)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              title="Inspect details & storage guide"
            >
              👁️
            </button>
            <button
              onClick={() => addToCart({ ...product, quantity: 1 })}
              className="px-3.5 py-2 bg-[#064E3B] hover:bg-[#047857] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1"
            >
              <span>+ Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FarmFreshModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null

  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  const badge = getItemBadge(product)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="sm:w-1/2">
            <div className="h-56 sm:h-64 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200">
              {imgSrc ? (
                <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-emerald-50 text-emerald-800">
                  {badge.text.includes('🐓') ? '🐓' : badge.text.includes('❄️') ? '❄️' : '🥩'}
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-2xs ${badge.bg}`}>
                  {badge.text}
                </span>
              </div>
            </div>
          </div>

          <div className="sm:w-1/2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
                {product.store_catalogue || product.category_name || badge.tag}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {product.description || 'Premium farm product prepared under hygienic standards.'}
              </p>

              {/* Temperature & Storage Guide Box */}
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                <strong className="block font-bold">📋 Handling & Preservation:</strong>
                <p>{badge.storageTip}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Subtotal</span>
                  <span className="text-xl font-extrabold text-[#064E3B]">
                    ₦{(price * quantity).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-bold text-xs">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  addToCart({ ...product, quantity })
                  onClose()
                }}
                className="w-full py-3 bg-[#064E3B] hover:bg-[#047857] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Add to Cold Basket</span>
                <span>•</span>
                <span>₦{(price * quantity).toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FarmFreshCart({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null

  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs">
      <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg text-[#064E3B]">Cold Basket ({items.length})</h3>
            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
              <span>❄️</span> Thermal insulated packing guaranteed
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl block mb-2">🛒</span>
              <p className="text-sm font-bold text-slate-700">Your basket is empty</p>
              <p className="text-xs text-slate-400 mt-1">Add frozen foods, poultry cuts or live animals to proceed.</p>
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              const img = it.primary_image || it.image
              const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

              return (
                <div key={it.id || idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {imgSrc ? (
                      <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🥩</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{it.name || it.product_name}</p>
                    <p className="text-xs font-extrabold text-emerald-800 mt-0.5">₦{itemPrice.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-slate-300 rounded bg-white">
                        <button
                          onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-xs">{qty}</span>
                        <button
                          onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(it.id)}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[#064E3B]">₦{(itemPrice * qty).toLocaleString()}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="bg-emerald-50 rounded-lg p-3 text-[11px] text-emerald-900 flex items-center gap-2">
            <span>📦</span>
            <span>All perishable cuts are packed in specialized food-grade ice thermal containers.</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Estimated Total:</span>
            <span className="text-xl font-extrabold text-[#064E3B]">₦{total.toLocaleString()}</span>
          </div>

          <button
            disabled={items.length === 0}
            onClick={() => {
              setIsCartOpen(false)
              navigate(`/shop/${base}/checkout`)
            }}
            className="w-full py-3.5 bg-[#064E3B] disabled:opacity-50 hover:bg-[#047857] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            Proceed to Chilled Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}

function FarmFreshCheckout({ shop, shopSlug }) {
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
    cold_instructions: '',
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
      const fullAddress = form.cold_instructions
        ? `${form.shipping_address} [COLD HANDLING NOTE: ${form.cold_instructions}]`
        : form.shipping_address

      const r = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: fullAddress,
        city: state,
        state,
        country: 'NG',
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : 'ff-' + Date.now(),
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
    return (
      <div className="py-16 px-6 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
          ❄️
        </div>
        <h2 className="text-3xl font-extrabold text-[#064E3B]">Order Successfully Placed!</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your farm order has been dispatched to the cold storage & livestock team. All perishable goods are being prepared and packed with ice insulation.
        </p>

        {done.delivery_code && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Your Secure Delivery Code
            </span>
            <div className="text-3xl font-mono font-extrabold text-[#064E3B] tracking-widest">
              {done.delivery_code}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Only share this code with the chilled delivery rider after inspecting your items!
            </p>
          </div>
        )}

        <button
          onClick={() => navigate(`/shop/${base}`)}
          className="px-8 py-3 bg-[#064E3B] hover:bg-[#047857] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
        >
          Return to Farm Storefront
        </button>
      </div>
    )
  }

  return (
    <div className="py-12 px-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link to={`/shop/${base}`} className="text-xs font-semibold text-emerald-700 hover:underline mb-2 block">
          ← Back to Farm Store
        </Link>
        <h1 className="text-3xl font-extrabold text-[#064E3B]">Chilled & Agro Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your delivery details for rapid temperature-controlled dispatch
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
          <input
            required
            type="text"
            placeholder="e.g. Adebayo Ogunlesi"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
            <input
              required
              type="tel"
              placeholder="e.g. 08012345678"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery State *</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white"
            >
              {['Lagos', 'Abuja', 'Ogun', 'Rivers', 'Oyo', 'Enugu', 'Delta', 'Kano', 'Kaduna', 'Edo', 'Anambra', 'Kwara'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Address *</label>
          <textarea
            required
            rows={3}
            placeholder="Street address, estate name, apartment number, landmark..."
            value={form.shipping_address}
            onChange={e => setForm({ ...form, shipping_address: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Cold Delivery & Timing Instructions (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Please call before arrival so I can clear my deep freezer immediately"
            value={form.cold_instructions}
            onChange={e => setForm({ ...form, cold_instructions: e.target.value })}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>

        {/* Order Summary Box */}
        <div className="p-4 bg-[#F0FDF4] border border-emerald-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Items Subtotal ({items.length} items):</span>
            <span className="font-bold text-slate-800">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Cold-Chain Thermal Packaging:</span>
            <span className="font-bold text-emerald-700">FREE</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-emerald-200 text-sm font-extrabold text-[#064E3B]">
            <span>Total Payable:</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full py-4 bg-[#064E3B] disabled:opacity-50 hover:bg-[#047857] text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all"
        >
          {loading ? 'Submitting Order to Hub...' : `Confirm Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

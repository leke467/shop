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
 * TECHVAULT GADGETS & SMARTPHONES TEMPLATE
 * Built specifically for Electronics, iPhones, Android Smartphones, MacBooks,
 * Laptops, Gaming Consoles, Audio, and Fast-Charging Tech Accessories.
 *
 * Key Features:
 * - Hardware Condition Analyzer (Brand New Factory Sealed, Grade A+ Pristine Used, Refurbished, Gaming/Audio, Fast Charging)
 * - Hardware Spec Chips (Storage: 128GB/256GB/512GB/1TB, RAM, Battery Health %)
 * - Real-time Variant Photo & Price Switching
 * - Doorstep Escrow Delivery & Test-Before-Release Instructions
 * - Setup & Accessory Pre-install Notes
 */

// Helper to determine hardware condition, warranty, and inspection checklist
function getItemBadge(product) {
  const text = `${product.name || ''} ${product.description || ''} ${product.category_name || ''} ${product.store_catalogue || ''}`.toLowerCase()

  if (
    text.includes('sealed') || text.includes('brand new') || text.includes('factory new') ||
    text.includes('brand-new') || text.includes('unopened')
  ) {
    return {
      text: '✨ Factory Sealed (100% Brand New)',
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      pillBg: 'bg-emerald-500 text-white',
      tag: 'Brand New',
      conditionNote: 'Factory sealed original packaging with untouched manufacturer warranty and pristine serial/IMEI.',
    }
  }

  if (
    text.includes('uk used') || text.includes('us used') || text.includes('used') ||
    text.includes('grade a') || text.includes('pristine') || text.includes('pre-owned') ||
    text.includes('tokunbo')
  ) {
    return {
      text: '🛡️ Grade A+ Pristine (UK/US Used)',
      bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      pillBg: 'bg-blue-600 text-white',
      tag: 'UK/US Used',
      conditionNote: 'Battery Health 85%-100% • Zero Dents/Screen Burns • FaceID & TrueTone 100% Functional • Clean IMEI.',
    }
  }

  if (text.includes('refurb') || text.includes('renew') || text.includes('recertified')) {
    return {
      text: '⚙️ Certified Refurbished (Grade A)',
      bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      pillBg: 'bg-cyan-600 text-white',
      tag: 'Refurbished',
      conditionNote: 'OEM renewed components with extensive diagnostic bench testing, high battery health, and warranty.',
    }
  }

  if (
    text.includes('playstation') || text.includes('ps5') || text.includes('ps4') ||
    text.includes('xbox') || text.includes('nintendo') || text.includes('console') ||
    text.includes('airpods') || text.includes('headphone') || text.includes('earbud') ||
    text.includes('headset') || text.includes('speaker') || text.includes('jbl') ||
    text.includes('sony') || text.includes('gaming')
  ) {
    return {
      text: '🎮 Gaming & Spatial Audio',
      bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      pillBg: 'bg-purple-600 text-white',
      tag: 'Gaming / Audio',
      conditionNote: 'Precision audio acoustic testing, low-latency wireless sync, and official accessories included.',
    }
  }

  if (
    text.includes('charger') || text.includes('cable') || text.includes('power bank') ||
    text.includes('adapter') || text.includes('magsafe') || text.includes('case') ||
    text.includes('protector') || text.includes('accessory') || text.includes('hub') ||
    text.includes('stand')
  ) {
    return {
      text: '⚡ Fast Charging & Power Tech',
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      pillBg: 'bg-amber-600 text-white',
      tag: 'Accessories',
      conditionNote: 'PD / GaN fast-charge certified with surge & overheating protection for safe device charging.',
    }
  }

  return {
    text: '📱 Authentic Hardware & Tech',
    bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    pillBg: 'bg-blue-600 text-white',
    tag: 'Smartphones',
    conditionNote: 'Factory unlocked (all GSM networks: MTN, Airtel, Glo, 9mobile). Doorstep escrow protected.',
  }
}

// Helper to extract device specs from product text
function extractSpecs(product) {
  const text = `${product.name || ''} ${product.description || ''}`
  const specs = []

  // Storage detection
  const storageMatch = text.match(/(\b(64|128|256|512)\s*GB\b|\b(1|2)\s*TB\b)/i)
  if (storageMatch) specs.push(storageMatch[0].toUpperCase())

  // RAM detection
  const ramMatch = text.match(/\b(4|6|8|12|16|24|32|64)\s*GB\s+RAM\b/i)
  if (ramMatch) specs.push(ramMatch[0].toUpperCase())

  // Battery health detection
  const batteryMatch = text.match(/battery(?:\s*health)?[:\s]+([0-9]{2,3}%)/i)
  if (batteryMatch) specs.push(`🔋 ${batteryMatch[1]}`)

  // 5G detection
  if (/\b5G\b/i.test(text)) specs.push('📶 5G Ready')

  return specs.slice(0, 3)
}

export default function GadgetsApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Mobile Navigation Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="gadgets" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Hardware Escrow & Doorstep Inspection Top Banner */}
      <div className="bg-[#0F172A] text-slate-300 py-2 px-4 text-xs font-medium border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>
              ⚡ <strong>TECHVAULT ESCROW GUARANTEE:</strong> Power on & test FaceID, Cameras & IMEI before giving delivery code
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px]">
            <span>🔋 Tested Battery Health</span>
            <span>•</span>
            <span>🔒 Clean iCloud / FRP Unlocked</span>
            <span>•</span>
            <span>🚀 Express Nationwide Dispatch</span>
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="hidden md:block bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
              <span>←</span> MultiShop Marketplace
            </Link>
            <div className="h-4 w-px bg-slate-800"></div>
            <Link to={`/shop/${base}`} className="flex items-center gap-3">
              <BrandLogoRenderer
                shop={shop}
                accentColor="#2563EB"
                textClassName="text-2xl font-black tracking-tight text-white"
                logoClassName="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-2xs"
              />
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link to={`/shop/${base}`} className="hover:text-blue-400 transition-colors py-1">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-blue-400 transition-colors py-1 flex items-center gap-1">
              <span>Devices & Gear</span>
              <span className="bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            </Link>
            <Link to={`/shop/${base}/about`} className="hover:text-blue-400 transition-colors py-1">Tech Hub & Warranty</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-blue-400 transition-colors py-1">Customer Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <span>Tech Basket</span>
              <span className="bg-blue-900/80 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-black border border-blue-400/40">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Routes */}
      <main className="flex-1">
        <Routes>
          <Route
            index
            element={
              <GadgetsHome
                shop={shop}
                products={products}
                reviews={reviews}
                shopSlug={base}
                onQuickView={setQuickView}
              />
            }
          />
          <Route
            path="catalog"
            element={
              <GadgetsCatalog
                shop={shop}
                products={products}
                shopSlug={base}
                onQuickView={setQuickView}
              />
            }
          />
          <Route
            path="about"
            element={
              <TemplateAboutView
                shop={shop}
                shopSlug={base}
                theme="gadgets"
                products={products}
              />
            }
          />
          <Route
            path="reviews"
            element={
              <TemplateReviewsView
                shop={shop}
                shopSlug={base}
                theme="gadgets"
                reviews={reviews}
              />
            }
          />
          <Route
            path="checkout"
            element={
              <GadgetsCheckout
                shop={shop}
                shopSlug={base}
              />
            }
          />
        </Routes>
      </main>

      {/* QuickView Modal with Live Variant Photo & Spec Switcher */}
      {quickView && (
        <GadgetsModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}

      {/* Sliding Cart Drawer */}
      <GadgetsCart shop={shop} shopSlug={base} />

      {/* Theme Footer */}
      <TemplateFooterView
        shop={shop}
        shopSlug={base}
        theme="gadgets"
        setIsCartOpen={setIsCartOpen}
      />
    </div>
  )
}

/* =======================================================================
   1. GADGETS HOMEPAGE
   ======================================================================= */
function GadgetsHome({ shop, products, reviews, shopSlug, onQuickView }) {
  const extraTokens = shop?.theme?.extra_tokens || {}
  const heroHeadline = extraTokens.hero_title || 'Premium Smartphones, MacBooks & Pro Tech Gear'
  const heroTagline = extraTokens.hero_tagline || 'Shop factory-sealed and pristine Grade A+ devices with verified battery health, doorstep test-before-release escrow, and genuine warranty protection.'
  const tradeInNote = extraTokens.trade_in_note || '💡 Instant Trade-in & Device Swaps available at our tech hub'

  const customCatalogues = extraTokens.custom_catalogues || {}
  const getCategoryDisplay = (p) => {
    const raw = p.category?.name || p.category_name || p.category
    if (!raw) return 'Gadgets & Tech'
    const custom = customCatalogues[raw] || Object.entries(customCatalogues).find(([k]) => k.toLowerCase() === String(raw).toLowerCase())?.[1]
    return custom || raw
  }

  // Hardware guarantee cards
  const guaranteeCards = extraTokens.features || [
    {
      title: '100% Authentic Gear',
      desc: 'Guaranteed zero cloned or blacklisted units. Clean IMEI and iCloud/Google FRP cleared.',
      icon: '🛡️',
    },
    {
      title: 'Tested Battery Health',
      desc: 'Rigorously verified battery health (85%-100%) on all pre-owned UK & US devices.',
      icon: '🔋',
    },
    {
      title: 'Doorstep Inspection',
      desc: 'Inspect cameras, FaceID, TrueTone, and network connectivity before releasing payment code.',
      icon: '🔍',
    },
    {
      title: 'Warranty Protection',
      desc: 'Multi-day instant swap and comprehensive technical support on all hardware purchases.',
      icon: '⚡',
    },
  ]

  // Featured flagship items
  const featured = useMemo(() => {
    return products.slice(0, 8)
  }, [products])

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Showcase */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#0B0F19] border-b border-slate-800 py-16 sm:py-24 px-6">
        {/* Glow background accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
              <span className="text-sm">⚡</span>
              <span>DIRECT IMPORTS • FACTORY SEALED & GRADE A+</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {heroHeadline}
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {heroTagline}
            </p>

            {/* Trade-in banner callout */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <span className="text-lg shrink-0">🔄</span>
              <span className="font-medium">{tradeInNote}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to={`/shop/${shopSlug}/catalog`}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <span>Explore Tech Catalog</span>
                <span>→</span>
              </Link>
              <Link
                to={`/shop/${shopSlug}/about`}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                Inspection & Warranty FAQ
              </Link>
            </div>
          </div>

          {/* Device Showcase Preview Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((p, idx) => {
              const b = getItemBadge(p)
              const primaryImg = p.primary_image || p.images?.[0]?.medium || p.images?.[0]?.image || p.images?.[0]
              const imgSrc = getImageUrl(typeof primaryImg === 'string' ? primaryImg : (primaryImg?.medium || primaryImg?.image), p.name)
              const priceNum = Number(p.base_price || p.price || 0)

              return (
                <div
                  key={p.id || idx}
                  onClick={() => onQuickView(p)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3 space-y-2 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 relative">
                    <img
                      src={imgSrc}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                      {b.tag}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs font-black text-blue-400">
                      ₦{priceNum.toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4 Hardware Trust Guarantees */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guaranteeCards.map((g, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="text-3xl">{g.icon}</div>
              <h3 className="text-sm font-bold text-white">{g.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Flagship Devices Grid */}
      <section className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>🔥 Featured Tech & Flagship Drops</span>
            </h2>
            <p className="text-xs text-slate-400">Hand-tested hardware ready for immediate delivery</p>
          </div>
          <Link
            to={`/shop/${shopSlug}/catalog`}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>View all {products.length} products</span>
            <span>→</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No gadgets listed yet. Check back shortly for new stock!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featured.map((p) => (
              <GadgetsCard
                key={p.id}
                product={p}
                onQuickView={() => onQuickView(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Doorstep Inspection Escrow Callout */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold border border-blue-500/40">
              6-DIGIT ESCROW SECURITY
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white">
              Zero Risk. Test Before You Hand Over Code.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              When buying phones and electronics online, peace of mind is paramount. Your funds are kept safely in MultiShop Escrow. When the courier arrives, you test the phone: insert your SIM, check cameras, TrueTone, and battery health. Only when 100% satisfied do you give the courier your 6-digit confirmation code.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to={`/shop/${shopSlug}/about`}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-block text-center"
            >
              How Our Escrow Works →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* =======================================================================
   2. GADGETS CATALOG VIEW
   ======================================================================= */
function GadgetsCatalog({ shop, products, shopSlug, onQuickView }) {
  const [search, setSearch] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState('popular')

  const customCatalogues = shop?.theme?.extra_tokens?.custom_catalogues || {}
  const getCategoryDisplay = (p) => {
    const raw = p.category?.name || p.category_name || p.category
    if (!raw) return 'Gadgets & Tech'
    const custom = customCatalogues[raw] || Object.entries(customCatalogues).find(([k]) => k.toLowerCase() === String(raw).toLowerCase())?.[1]
    return custom || raw
  }

  // Derive available categories
  const categories = useMemo(() => {
    const set = new Set()
    products.forEach(p => {
      set.add(getCategoryDisplay(p))
    })
    return Array.from(set).filter(Boolean)
  }, [products, customCatalogues])

  // Filter and sort products
  const filtered = useMemo(() => {
    return products.filter(p => {
      const b = getItemBadge(p)
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || (
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        getCategoryDisplay(p).toLowerCase().includes(q)
      )

      const matchesCondition = selectedCondition === 'ALL' || b.tag === selectedCondition
      const matchesCategory = selectedCategory === 'ALL' || getCategoryDisplay(p) === selectedCategory

      return matchesSearch && matchesCondition && matchesCategory
    }).sort((a, b) => {
      const priceA = Number(a.base_price || a.price || 0)
      const priceB = Number(b.base_price || b.price || 0)
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      return (b.id || 0) - (a.id || 0)
    })
  }, [products, search, selectedCondition, selectedCategory, sortBy, customCatalogues])

  const conditionFilters = [
    { label: 'All Devices', val: 'ALL' },
    { label: 'Brand New', val: 'Brand New' },
    { label: 'UK/US Used', val: 'UK/US Used' },
    { label: 'Refurbished', val: 'Refurbished' },
    { label: 'Gaming & Audio', val: 'Gaming / Audio' },
    { label: 'Accessories', val: 'Accessories' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Device Vault & Tech Inventory
          </h1>
          <p className="text-xs text-slate-400">
            Showing {filtered.length} of {products.length} devices and accessories in stock
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              placeholder="Search by device model, iPhone 15 Pro, S24 Ultra, MacBook, 256GB, PS5..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="popular">Sort: Featured & Latest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Hardware Condition Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Condition:</span>
          {conditionFilters.map(f => (
            <button
              key={f.val}
              type="button"
              onClick={() => setSelectedCondition(f.val)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                selectedCondition === f.val
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Categories Pills (if available) */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Category:</span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  selectedCategory === c
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-3xl">🔍</p>
          <p className="text-sm font-bold text-white">No devices found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms, clearing the condition filters, or browsing our full catalog.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCondition('ALL'); setSelectedCategory('ALL') }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map(p => (
            <GadgetsCard
              key={p.id}
              product={p}
              onQuickView={() => onQuickView(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* =======================================================================
   3. GADGETS CARD
   ======================================================================= */
function GadgetsCard({ product, onQuickView }) {
  const { addToCart } = useCart()
  const badge = getItemBadge(product)
  const specs = extractSpecs(product)
  const [added, setAdded] = useState(false)

  const primaryImg = product.primary_image || product.images?.[0]?.medium || product.images?.[0]?.image || product.images?.[0]
  const imgSrc = getImageUrl(typeof primaryImg === 'string' ? primaryImg : (primaryImg?.medium || primaryImg?.image), product.name)
  const priceNum = Number(product.base_price || product.price || 0)
  const hasVariants = product.has_variants && (product.variants?.length > 0)

  const handleQuickAdd = (e) => {
    e.stopPropagation()
    if (hasVariants) {
      onQuickView()
      return
    }

    addToCart({
      id: product.public_id || product.id,
      product_id: product.id,
      name: product.name,
      unit_price: priceNum,
      price: priceNum,
      image: imgSrc,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 900)
  }

  return (
    <div
      onClick={onQuickView}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer group"
    >
      <div>
        {/* Device Photo with condition badge overlay */}
        <div className="aspect-square bg-slate-950 relative overflow-hidden">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Condition pill */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-sm ${badge.pillBg}`}>
              {badge.tag}
            </span>
          </div>

          {/* Variant pill */}
          {hasVariants && (
            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-blue-300 border border-slate-700">
              {product.variants.length} Options
            </span>
          )}
        </div>

        {/* Specs & Info */}
        <div className="p-3.5 space-y-2 text-left">
          {/* Detected specs chips */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specs.map((s, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-black text-blue-400">
              ₦{priceNum.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3.5 pt-0">
        <button
          type="button"
          onClick={handleQuickAdd}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500'
          }`}
        >
          {added ? (
            <span>✓ In Basket</span>
          ) : hasVariants ? (
            <span>Configure Specs</span>
          ) : (
            <span>Add to Basket</span>
          )}
        </button>
      </div>
    </div>
  )
}

/* =======================================================================
   4. QUICK VIEW MODAL (WITH LIVE VARIANT PHOTO & SPEC SWITCHER)
   ======================================================================= */
function GadgetsModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return product.variants?.find(v => v.is_default) || product.variants?.[0] || null
  })
  const [activeVariantImage, setActiveVariantImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [setupNote, setSetupNote] = useState('')
  const [added, setAdded] = useState(false)

  const badge = getItemBadge(product)
  const specs = extractSpecs(product)

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
      bespoke_notes: setupNote ? `[TECH SETUP]: ${setupNote}` : undefined,
    })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0F172A] rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-700 p-6 relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Main Photo with Dynamic Variant Switch */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Hardware Checklist Note */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${badge.bg}`}>
              <div className="font-bold flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Inspection & Escrow Check:</span>
              </div>
              <p className="text-[11px] opacity-90">{badge.conditionNote}</p>
            </div>
          </div>

          {/* Details & Controls */}
          <div className="space-y-4 text-left">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border mb-2 ${badge.bg}`}>
                {badge.text}
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                {product.name}
              </h2>
              <div className="text-xl font-black text-blue-400 mt-1">
                ₦{priceNum.toLocaleString()}
              </div>
            </div>

            {/* Extracted Specs Preview */}
            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specs.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {product.description && (
              <p className="text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                {product.description}
              </p>
            )}

            {/* Storage / Color Variant Picker */}
            {product.variants?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Select Storage / Color Option:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map(v => (
                    <button
                      key={v.id || v.name}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        selectedVariant?.id === v.id
                          ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {v.image && <span className="text-xs">📸</span>}
                      <span>{v.name}</span>
                      <span className="text-[10px] opacity-80">
                        (₦{Number(v.price || product.base_price).toLocaleString()})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Setup & Accessory Note Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Setup, Screen Protector or Packaging Note (Optional):
              </label>
              <input
                type="text"
                value={setupNote}
                onChange={e => setSetupNote(e.target.value)}
                placeholder="e.g. Pre-install 9D glass / include 20W head / SIM pin..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className={`flex-1 py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                {added ? '✓ Added to Basket!' : `Add to Basket • ₦${(priceNum * quantity).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =======================================================================
   5. GADGETS CART DRAWER
   ======================================================================= */
function GadgetsCart({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart()
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const subtotal = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0F172A] border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <h2 className="text-base font-black text-white">Your Tech Basket</h2>
              <span className="text-xs bg-blue-600/30 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/40">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <span className="text-4xl">📱</span>
                <p className="text-sm font-bold text-white">Your Tech Basket is empty</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse our inventory of smartphones, laptops, audio gear, and charging accessories.
                </p>
                <button
                  onClick={() => { setIsCartOpen(false); navigate(`/shop/${base}/catalog`) }}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Browse Tech Catalog
                </button>
              </div>
            ) : (
              items.map((item, idx) => {
                const itemPrice = Number(item.unit_price || item.price || 0)
                return (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                        {item.image && (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs font-black text-blue-400">
                          ₦{itemPrice.toLocaleString()}
                        </p>
                        {item.bespoke_notes && (
                          <p className="text-[10px] text-slate-400 italic truncate">
                            {item.bespoke_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
                        <button
                          onClick={() => updateQuantity?.(item.id || item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                          className="px-2 py-0.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-white">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity?.(item.id || item.product_id, (item.quantity || 1) + 1)}
                          className="px-2 py-0.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <span className="text-xs font-black text-white">
                          ₦{(itemPrice * (item.quantity || 1)).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id || item.product_id)}
                          className="text-slate-500 hover:text-rose-400 text-xs font-bold"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span className="font-bold text-white">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Doorstep Escrow Inspection:</span>
                <span className="font-bold text-emerald-400">INCLUDED</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-white">
                <span>Estimated Total:</span>
                <span className="text-blue-400">₦{subtotal.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false)
                  navigate(`/shop/${base}/checkout`)
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Escrow Checkout</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =======================================================================
   6. GADGETS CHECKOUT VIEW
   ======================================================================= */
function GadgetsCheckout({ shop, shopSlug }) {
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
    setup_notes: '',
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
      const fullAddress = form.setup_notes
        ? `${form.shipping_address} [TECH SETUP & ACCESSORY NOTE: ${form.setup_notes}]`
        : form.shipping_address

      const r = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: fullAddress,
        city: state,
        state,
        country: 'NG',
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : 'tech-' + Date.now(),
        shop_slug: base,
      })
      clearCart?.()
      setDone(r.order || r || { public_id: 'CONFIRMED' })
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMsg(err.response?.data?.detail || err.message || 'Error processing tech checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const code = done.delivery_code || done.order?.delivery_code || '------'
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500 text-blue-400 flex items-center justify-center text-2xl font-black mx-auto">
          ✓
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Hardware Order Confirmed!</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your hardware has been logged for multi-point testing, dispatch packaging, and courier allocation.
          </p>
        </div>

        {/* 6-Digit Escrow Confirmation Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-3 text-center shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
            DOORSTEP ESCROW VERIFICATION CODE
          </span>
          <div className="p-4 rounded-xl bg-slate-950 text-white font-mono text-3xl font-black tracking-widest inline-block border border-slate-800 shadow-inner">
            {code}
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            ⚠️ <strong>CRITICAL SECURITY INSTRUCTION:</strong> Do NOT release this code to the courier until you have inspected the device, powered it on, tested FaceID/Cameras, and confirmed the condition.
          </p>
        </div>

        <div>
          <Link
            to={`/shop/${base}`}
            className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white">TechVault Escrow Checkout</h1>
        <p className="text-xs text-slate-400">
          Fast doorstep delivery with 6-digit test-before-release buyer protection
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Trust Notice Card */}
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center gap-3 text-blue-200 text-xs">
        <span className="text-2xl shrink-0">🛡️</span>
        <div className="leading-tight">
          <p className="font-bold text-white">Doorstep Hardware Inspection Guarantee</p>
          <p className="text-[11px] text-blue-300/80 mt-0.5">
            Your funds remain safely held in MultiShop Escrow. When the courier arrives, thoroughly test the phone before providing your confirmation code.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number (For Courier) *</label>
            <input
              type="tel"
              required
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Delivery State (Nigeria) *</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Delta', 'Ogun', 'Kano', 'Enugu', 'Akwa Ibom', 'Edo', 'Bayelsa', 'Cross River', 'Anambra', 'Imo', 'Kaduna'].map(s => (
              <option key={s} value={s}>{s} State</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Full Delivery Street Address *</label>
          <textarea
            required
            rows={2}
            value={form.shipping_address}
            onChange={e => setForm({ ...form, shipping_address: e.target.value })}
            placeholder="Apartment/Flat number, building name, street address, landmark or estate..."
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Setup & Packaging Custom Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <span>⚙️ Hardware Setup / Screen Protector / Accessory Requests (Optional)</span>
          </label>
          <textarea
            rows={2}
            value={form.setup_notes}
            onChange={e => setForm({ ...form, setup_notes: e.target.value })}
            placeholder="e.g. Please pre-install 9D Screen Protector / Include extra Type-C fast charging cable / Data migration note..."
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">
            The merchant will read these instructions during hardware preparation prior to dispatch.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Total Payable:</span>
          <span className="text-base font-black text-blue-400">₦{total.toLocaleString()}</span>
        </div>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
        >
          {loading ? 'Securing Hardware Escrow Order…' : `Confirm Order • ₦${total.toLocaleString()}`}
        </button>
      </form>
    </div>
  )
}

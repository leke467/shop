import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import Logo from '../../components/Logo'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
]

export default function GenericTemplateEngine({ config, shop, products = [], reviews = [], shopSlug }) {
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <div
      style={{
        backgroundColor: config.bgColor || '#ffffff',
        color: config.textColor || '#111827',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        minHeight: '100vh',
      }}
    >
      <EngineNavbar config={config} shop={shop} shopSlug={shopSlug} />
      <EngineCartDrawer config={config} shop={shop} shopSlug={shopSlug} />

      <Routes>
        <Route
          index
          element={
            <EngineHome
              config={config}
              shop={shop}
              products={products}
              shopSlug={shopSlug}
              onQuickView={setQuickViewProduct}
            />
          }
        />
        <Route
          path="catalog"
          element={
            <EngineCatalogPage
              config={config}
              shop={shop}
              products={products}
              shopSlug={shopSlug}
              onQuickView={setQuickViewProduct}
            />
          }
        />
        <Route
          path="menu"
          element={
            <EngineCatalogPage
              config={config}
              shop={shop}
              products={products}
              shopSlug={shopSlug}
              onQuickView={setQuickViewProduct}
            />
          }
        />
        <Route
          path="about"
          element={<EngineAboutPage config={config} shop={shop} shopSlug={shopSlug} />}
        />
        <Route
          path="contact"
          element={<EngineContactPage config={config} shop={shop} shopSlug={shopSlug} />}
        />
        <Route
          path="checkout"
          element={<EngineCheckoutPage config={config} shop={shop} shopSlug={shopSlug} />}
        />
        <Route
          path="*"
          element={
            <EngineHome
              config={config}
              shop={shop}
              products={products}
              shopSlug={shopSlug}
              onQuickView={setQuickViewProduct}
            />
          }
        />
      </Routes>

      {quickViewProduct && (
        <EngineQuickViewModal
          config={config}
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <EngineFooter config={config} shop={shop} shopSlug={shopSlug} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TOOLBAR / NAVBAR COMPONENT
   ───────────────────────────────────────────────────────────── */
function EngineNavbar({ config, shop, shopSlug }) {
  const location = useLocation()
  const { cart, setIsCartOpen } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cartCount = (cart?.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const aboutUrl = baseSlug ? `/shop/${baseSlug}/about` : '/about'
  const contactUrl = baseSlug ? `/shop/${baseSlug}/contact` : '/contact'

  const primaryAccent = config.primaryColor || '#2563eb'

  return (
    <header
      style={{
        backgroundColor: config.navBg || config.cardBg || '#ffffff',
        borderBottom: `1px solid ${config.borderColor || '#e5e7eb'}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to={homeUrl} className="flex items-center gap-3">
          {shop?.logo ? (
            <img
              src={getImageUrl(shop.logo)}
              alt={shop.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white"
              style={{ backgroundColor: primaryAccent }}
            >
              {shop?.name?.charAt(0) || 'M'}
            </div>
          )}
          <span className="font-extrabold text-xl" style={{ color: config.textColor }}>
            {shop?.name || config.defaultName || 'Store'}
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <Link to={homeUrl} style={{ color: location.pathname === homeUrl ? primaryAccent : config.subtextColor }}>
            Home
          </Link>
          <Link to={catalogUrl} style={{ color: location.pathname.includes('/catalog') ? primaryAccent : config.subtextColor }}>
            Catalog
          </Link>
          <Link to={aboutUrl} style={{ color: location.pathname.includes('/about') ? primaryAccent : config.subtextColor }}>
            About
          </Link>
          <Link to={contactUrl} style={{ color: location.pathname.includes('/contact') ? primaryAccent : config.subtextColor }}>
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all"
            style={{
              borderColor: primaryAccent,
              color: primaryAccent,
              backgroundColor: `${primaryAccent}15`,
            }}
          >
            <Logo size="sm" />
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl border text-lg"
            style={{ borderColor: config.borderColor, color: config.textColor, backgroundColor: config.cardBg }}
          >
            🛒
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                style={{ backgroundColor: primaryAccent }}
              >
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-xl border"
            style={{ borderColor: config.borderColor, color: config.textColor }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-6 py-4 space-y-3 border-t" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
          <Link to={homeUrl} onClick={() => setMobileOpen(false)} className="block font-semibold" style={{ color: config.textColor }}>Home</Link>
          <Link to={catalogUrl} onClick={() => setMobileOpen(false)} className="block font-semibold" style={{ color: config.textColor }}>Catalog</Link>
          <Link to={aboutUrl} onClick={() => setMobileOpen(false)} className="block font-semibold" style={{ color: config.textColor }}>About</Link>
          <Link to={contactUrl} onClick={() => setMobileOpen(false)} className="block font-semibold" style={{ color: config.textColor }}>Contact</Link>
          <Link to="/" onClick={() => setMobileOpen(false)} className="block font-bold text-sm pt-2 border-t" style={{ color: primaryAccent, borderColor: config.borderColor }}>
            🏪 Return to MultiShop Marketplace
          </Link>
        </div>
      )}
    </header>
  )
}

/* ─────────────────────────────────────────────────────────────
   HOME PAGE COMPONENT
   ───────────────────────────────────────────────────────────── */
function EngineHome({ config, shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const { setIsCartOpen } = useCart()
  const primaryAccent = config.primaryColor || '#2563eb'

  const extra = shop?.theme?.extra_tokens || {}
  const headline = extra.hero_headline || shop?.name || config.heroTitle || 'Premium Quality Store'
  const subtitle = extra.hero_subtitle || shop?.tagline || shop?.description || config.heroSubtitle || 'Discover curated products designed to meet your highest standards.'

  const heroImg1 = extra.hero_image_1
    ? getImageUrl(extra.hero_image_1)
    : config.heroImg1 || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'

  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span
              className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${primaryAccent}20`, color: primaryAccent }}
            >
              {config.badgeText || 'Exclusive Selection'}
            </span>

            <h1 className="text-4xl sm:text-6xl font-black leading-tight" style={{ color: config.textColor }}>
              {headline}
            </h1>

            <p className="text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0" style={{ color: config.subtextColor }}>
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate(catalogUrl)}
                className="px-8 py-4 rounded-2xl font-extrabold text-white shadow-lg hover:scale-105 transition-all text-base"
                style={{ backgroundColor: primaryAccent }}
              >
                {config.ctaPrimary || 'Explore Catalog ➔'}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-8 py-4 rounded-2xl font-bold border transition-all text-base"
                style={{ borderColor: config.borderColor, color: config.textColor, backgroundColor: config.cardBg }}
              >
                View Cart 🛒
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border" style={{ borderColor: config.borderColor }}>
            <img src={heroImg1} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 border-y" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(config.features || [
            { icon: '🚀', title: 'Express Delivery', desc: 'Fast nationwide shipping to your doorstep' },
            { icon: '🛡️', title: 'Escrow Security', desc: 'Protected by MultiShop Escrow' },
            { icon: '💎', title: 'Verified Quality', desc: 'Authentic products direct from source' },
            { icon: '🎧', title: '24/7 Support', desc: 'Dedicated customer assistance' },
          ]).map((f, i) => (
            <div key={i} className="p-5 rounded-2xl border" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor }}>
              <span className="text-3xl block mb-2">{f.icon}</span>
              <h3 className="font-bold text-base" style={{ color: config.textColor }}>{f.title}</h3>
              <p className="text-xs mt-1" style={{ color: config.subtextColor }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog Grid */}
      <EngineCatalogGrid config={config} products={products} shop={shop} onQuickView={onQuickView} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CATALOG GRID COMPONENT
   ───────────────────────────────────────────────────────────── */
function EngineCatalogGrid({ config, products = [], shop, onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('default')
  const primaryAccent = config.primaryColor || '#2563eb'

  const categories = useMemo(() => {
    const set = new Set()
    products.forEach(p => {
      const catName = p.category?.name || p.category_name || p.category
      if (catName) set.add(catName)
    })
    return ['all', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const catName = p.category?.name || p.category_name || p.category
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'all' || catName === category
      return matchSearch && matchCategory
    })

    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    return list
  }, [products, search, category, sort])

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryAccent }}>Catalog</span>
            <h2 className="text-3xl font-extrabold" style={{ color: config.textColor }}>Our Collection</h2>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full md:w-64 px-4 py-3 rounded-2xl border text-sm outline-none"
              style={{ borderColor: config.borderColor, backgroundColor: config.cardBg, color: config.textColor }}
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-3 py-3 rounded-2xl border text-xs font-bold outline-none cursor-pointer"
              style={{ borderColor: config.borderColor, backgroundColor: config.cardBg, color: config.textColor }}
            >
              <option value="default">Featured</option>
              <option value="low">Price: Low → High</option>
              <option value="high">Price: High → Low</option>
            </select>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border"
                style={{
                  backgroundColor: category === cat ? primaryAccent : config.cardBg,
                  color: category === cat ? '#ffffff' : config.textColor,
                  borderColor: category === cat ? primaryAccent : config.borderColor,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border" style={{ borderColor: config.borderColor }}>
            <span className="text-4xl">📦</span>
            <p className="mt-2 text-sm" style={{ color: config.subtextColor }}>No products found matching search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p => {
              const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
              const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
              const price = Number(p.base_price || p.price || 0)

              return (
                <div
                  key={p.id || p.slug}
                  className="rounded-3xl border overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl"
                  style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}
                >
                  <div className="relative h-60 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white text-xs backdrop-blur-md hover:bg-black"
                    >
                      👁️
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {p.category?.name && (
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: primaryAccent }}>{p.category.name}</span>
                      )}
                      <h3 className="font-bold text-base line-clamp-1 mt-0.5 cursor-pointer hover:underline" style={{ color: config.textColor }} onClick={() => onQuickView && onQuickView(p)}>{p.name}</h3>
                      <p className="text-xs line-clamp-2 mt-1" style={{ color: config.subtextColor }}>{p.description || 'Quality product'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: config.borderColor }}>
                      <span className="text-lg font-black" style={{ color: config.textColor }}>₦{price.toLocaleString()}</span>
                      <button
                        onClick={() => addToCart(p)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
                        style={{ backgroundColor: primaryAccent }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGES (CATALOG, ABOUT, CONTACT, CHECKOUT, QUICK VIEW, DRAWER)
   ───────────────────────────────────────────────────────────── */
function EngineCatalogPage({ config, shop, products, shopSlug, onQuickView }) {
  return (
    <div className="py-8">
      <EngineCatalogGrid config={config} products={products} shop={shop} onQuickView={onQuickView} />
    </div>
  )
}

function EngineAboutPage({ config, shop }) {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="p-8 sm:p-12 rounded-3xl border space-y-6" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
        <h1 className="text-4xl font-black" style={{ color: config.textColor }}>About {shop?.name || 'Us'}</h1>
        <p className="text-base leading-relaxed" style={{ color: config.subtextColor }}>
          {shop?.description || 'Welcome to our official storefront. We take pride in delivering exceptionally high quality products and providing reliable, customer-first service.'}
        </p>
      </div>
    </div>
  )
}

function EngineContactPage({ config, shop }) {
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="py-20 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="p-8 sm:p-12 rounded-3xl border space-y-6" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
        <h1 className="text-3xl font-black" style={{ color: config.textColor }}>Contact Store Support</h1>
        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-center font-bold">Message sent! Thank you.</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
            <input required placeholder="Your Name" className="w-full p-3.5 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
            <input required type="email" placeholder="Your Email" className="w-full p-3.5 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
            <textarea required rows={4} placeholder="Your Message" className="w-full p-3.5 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
            <button type="submit" className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-md" style={{ backgroundColor: config.primaryColor || '#2563eb' }}>Send Message ✉️</button>
          </form>
        )}
      </div>
    </div>
  )
}

function EngineCheckoutPage({ config, shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const primaryAccent = config.primaryColor || '#2563eb'

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
    provider: 'monnify',
  })
  const [selectedState, setSelectedState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(null)

  const cartList = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = cartList.reduce((sum, i) => sum + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (cartList.length === 0) {
      alert('Your cart is empty.')
      return
    }
    setLoading(true)
    try {
      const res = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: selectedState,
        state: selectedState,
        country: 'NG',
        delivery_state: selectedState,
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : '123-uuid',
        shop_slug: shop?.slug || shopSlug,
      })
      clearCart?.()
      const orderData = res.order || { public_id: res.order_id || 'SUCCESS' }
      const deliveryCode = res.delivery_code || res.order?.delivery_code || res.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setOrderComplete({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      alert(err.response?.data?.detail || 'Order checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center">
        <div className="p-8 rounded-3xl border space-y-4" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
          <span className="text-5xl block">🎉</span>
          <h2 className="text-2xl font-extrabold" style={{ color: config.textColor }}>Order Placed Successfully!</h2>
          {orderComplete.delivery_code && (
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-900 border font-mono text-2xl font-black">
              Code: {orderComplete.delivery_code}
            </div>
          )}
          <button onClick={() => navigate(`/shop/${shopSlug || shop?.slug || ''}`)} className="px-6 py-3 rounded-xl text-white font-bold" style={{ backgroundColor: primaryAccent }}>Back to Store</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl font-black mb-6" style={{ color: config.textColor }}>Checkout</h1>
      <form onSubmit={handleCheckout} className="space-y-6">
        <div className="p-6 rounded-3xl border space-y-4" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
          <h3 className="font-bold text-lg" style={{ color: config.textColor }}>1. Delivery Address</h3>
          <input required placeholder="Full Name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Phone Number *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }}>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="Delivery Street Address *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 rounded-xl border text-sm" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor, color: config.textColor }} />
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg" style={{ backgroundColor: primaryAccent }}>
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

function EngineQuickViewModal({ config, product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="p-6 sm:p-8 rounded-3xl border max-w-md w-full relative shadow-2xl space-y-4" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
        <button onClick={onClose} className="absolute top-4 right-4 font-bold text-lg">✕</button>
        
        {imgSrc && (
          <div className="h-52 rounded-2xl overflow-hidden bg-gray-100">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h3 className="text-xl font-bold" style={{ color: config.textColor }}>{product.name}</h3>
        <p className="text-xs" style={{ color: config.subtextColor }}>{product.description || 'Quality product'}</p>
        
        <div className="flex items-center justify-between border-y py-3" style={{ borderColor: config.borderColor }}>
          <div className="text-2xl font-black" style={{ color: config.textColor }}>₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border rounded-xl" style={{ borderColor: config.borderColor }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 font-bold">-</button>
            <span className="px-3 text-xs font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 font-bold">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-3.5 rounded-xl text-white font-bold shadow-md hover:opacity-90" style={{ backgroundColor: config.primaryColor || '#2563eb' }}>Add to Cart 🛒</button>
      </div>
    </div>
  )
}

function EngineCartDrawer({ config, shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full border-l p-6 flex flex-col justify-between shadow-2xl" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg }}>
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: config.borderColor }}>
          <h3 className="font-bold text-lg" style={{ color: config.textColor }}>Shopping Cart ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <span className="text-4xl block">🛒</span>
              <p className="text-sm font-medium" style={{ color: config.subtextColor }}>Your cart is empty.</p>
              <button
                onClick={() => { setIsCartOpen(false); navigate(shopSlug ? `/shop/${shopSlug}/catalog` : '/catalog') }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: config.primaryColor || '#2563eb' }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: config.borderColor }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: config.textColor }}>{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: config.subtextColor }}>
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border rounded-lg" style={{ borderColor: config.borderColor }}>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-2 py-0.5 font-bold">-</button>
                        <span className="px-2 font-bold">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-2 py-0.5 font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: config.textColor }}>₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-rose-500 font-bold mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t space-y-3" style={{ borderColor: config.borderColor }}>
            <div className="flex justify-between text-lg font-black" style={{ color: config.textColor }}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <button onClick={() => { setIsCartOpen(false); navigate(`/shop/${shopSlug || shop?.slug || ''}/checkout`) }} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ backgroundColor: config.primaryColor || '#2563eb' }}>Proceed to Checkout ➔</button>
          </div>
        )}
      </div>
    </div>
  )
}

function EngineFooter({ config, shop, shopSlug }) {
  return (
    <footer className="border-t py-12 text-center text-xs" style={{ borderColor: config.borderColor, backgroundColor: config.cardBg, color: config.subtextColor }}>
      <p>© {new Date().getFullYear()} {shop?.name || 'Storefront'}. Powered by MultiShop Platform.</p>
    </footer>
  )
}

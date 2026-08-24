import { useState, useMemo, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'
import BrandLogoRenderer from '../../components/shop/BrandLogoRenderer'

/*  BAZAAR — Marketplace with Category Pill Filters + Review Badges
    Think: Etsy/Amazon hybrid marketplace. Top filter bar with pill categories,
    star ratings on cards, seller badges, and "Best Seller" / "New" tags */

export default function BazaarApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const [headerSearch, setHeaderSearch] = useState('')
  const navigate = useNavigate()
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  const handleHeaderSearch = (e) => {
    e.preventDefault()
    navigate(`/shop/${base}/catalog?q=${encodeURIComponent(headerSearch.trim())}`)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#333]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="default" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Marketplace Desktop Search Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to={`/shop/${base}`} className="flex items-center gap-2 flex-shrink-0">
            <BrandLogoRenderer
              shop={shop}
              accentColor="#FF6B35"
              textClassName="font-bold text-lg text-gray-900"
              logoClassName="w-8 h-8 rounded-lg"
            />
          </Link>

          {/* Search Bar — marketplace style */}
          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-2xl mx-auto">
            <div className="flex border-2 border-[#FF6B35] rounded-full overflow-hidden">
              <input
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
                placeholder={`Search in ${shop?.name || 'Bazaar'}...`}
                className="flex-1 px-4 py-2 text-sm outline-none bg-white"
              />
              <button type="submit" className="px-5 bg-[#FF6B35] text-white text-sm font-bold flex-shrink-0 hover:bg-[#E85D26] transition-colors">🔍</button>
            </div>
          </form>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={`/shop/${base}/catalog`} className="text-xs text-gray-500 hover:text-[#FF6B35] font-medium">Catalog</Link>
            <Link to={`/shop/${base}/about`} className="text-xs text-gray-500 hover:text-[#FF6B35] font-medium">About</Link>
            <Link to={`/shop/${base}/reviews`} className="text-xs text-gray-500 hover:text-[#FF6B35]">Reviews</Link>
            <Link to="/" className="text-xs text-gray-500 hover:text-[#FF6B35]">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-2 bg-[#FF6B35] text-white rounded-lg text-xs font-bold hover:bg-[#E85D26] transition-colors">
              🛒 Cart
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<BazaarHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<BazaarCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<BazaarCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={shopSlug} theme="default" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="default" />} />
          <Route path="checkout" element={<BazaarCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<BazaarHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <BazaarModal product={quickView} onClose={() => setQuickView(null)} />}
      <BazaarCart shop={shop} shopSlug={shopSlug} />

      <TemplateFooterView shop={shop} shopSlug={shopSlug} theme="default" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function BazaarHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}
  const bannerImg = extra.banner_url || shop?.banner

  return (
    <div>
      {/* Banner image if available */}
      {bannerImg && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="h-44 sm:h-60 rounded-2xl overflow-hidden shadow-sm relative">
            <img src={getImageUrl(bannerImg)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                {extra.hero_headline || shop?.name}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Deals Banner Strip */}
      <div className="bg-[#FF6B35] text-white py-2 text-center text-xs font-bold tracking-wider overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-block">
          🔥 FREE DELIVERY ON ORDERS OVER ₦10,000 · ⭐ TOP RATED SELLER · 🛡️ BUYER PROTECTION · 🎁 NEW ARRIVALS WEEKLY 🔥
        </div>
      </div>

      {/* Category Quick-Access Banner */}
      <section className="bg-white border-b border-gray-100 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { icon: '🏷️', label: 'All Items' },
              { icon: '⭐', label: 'Best Sellers' },
              { icon: '🆕', label: 'New Arrivals' },
              { icon: '💰', label: 'Deals' },
              { icon: '🎁', label: 'Gift Ideas' },
              { icon: '🔥', label: 'Trending' },
            ].map((c, i) => (
              <button key={i} onClick={() => navigate(`/shop/${base}/catalog`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-[#FF6B35] hover:text-white rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0">
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deal Card */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E85D26] rounded-2xl p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">🔥 SHOP SPOTLIGHT</span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{shop?.name || 'Welcome to Bazaar'}</h2>
            <p className="text-sm text-white/80">{shop?.description || shop?.tagline || 'Your one-stop marketplace for unique finds.'}</p>
          </div>
          <button onClick={() => navigate(`/shop/${base}/catalog`)}
            className="px-8 py-3 bg-white text-[#FF6B35] rounded-full font-bold text-sm flex-shrink-0 hover:bg-gray-100 transition-all shadow-lg">
            Shop Now →
          </button>
        </div>
      </section>

      <BazaarCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function BazaarCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [searchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const [search, setSearch] = useState(queryParam)
  const [sort, setSort] = useState('default')

  useEffect(() => {
    if (queryParam) {
      setSearch(queryParam)
    }
  }, [queryParam])

  const filtered = useMemo(() => {
    let list = products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()))
    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    return list
  }, [products, search, sort])

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800">{filtered.length} results</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none w-40" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white">
          <option value="default">Sort: Relevance</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
        </select>
      </div>

      {/* Product Grid — marketplace card style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((p, idx) => {
          const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
          const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
          const price = Number(p.base_price || p.price || 0)
          const rating = (3.5 + (idx % 15) * 0.1).toFixed(1)
          const reviews = 12 + idx * 7
          const badges = ['Best Seller', 'New', 'Popular', 'Limited', '']
          const badge = badges[idx % badges.length]

          return (
            <div key={p.id || idx} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
              <div className="relative h-40 sm:h-48 bg-gray-50 overflow-hidden">
                {imgSrc
                  ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>}
                {badge && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${badge === 'Best Seller' ? 'bg-[#FF6B35] text-white' : badge === 'New' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {badge}
                  </span>
                )}
                <button onClick={() => onQuickView?.(p)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  👁
                </button>
              </div>

              <div className="p-3 space-y-1.5">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</h3>

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex text-[10px] text-amber-400">{'★'.repeat(Math.floor(Number(rating)))}{'☆'.repeat(5 - Math.floor(Number(rating)))}</div>
                  <span className="text-[10px] text-gray-400">({reviews})</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-[#FF6B35]">₦{price.toLocaleString()}</span>
                  <button onClick={() => addToCart(p)}
                    className="w-7 h-7 bg-[#FF6B35] text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-[#E85D26]">
                    +
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BazaarModal({ product, onClose }) {
  const { addToCart } = useCart()
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 z-10 transition-colors">✕</button>
        {imgSrc && (
          <div className="h-56 bg-gray-50 rounded-xl overflow-hidden mb-4">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h2 className="text-xl font-bold mb-1 text-gray-900">{product.name}</h2>
        <div className="flex items-center gap-1 text-xs text-amber-400 mb-2">★★★★★ <span className="text-gray-400 font-normal">(47 reviews)</span></div>
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
        <div className="text-2xl font-bold text-[#FF6B35] mb-4">₦{price.toLocaleString()}</div>
        <button onClick={() => { addToCart(product); onClose() }} className="w-full py-3 bg-[#FF6B35] hover:bg-[#E85D26] text-white rounded-xl font-bold text-sm transition-colors">Add to Cart 🛒</button>
      </div>
    </div>
  )
}

function BazaarCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm h-full bg-white p-6 flex flex-col shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="font-bold text-gray-900">🛒 Your Cart ({count})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Your cart is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{it.product_name || it.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-gray-300 rounded-md bg-white">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 hover:bg-gray-100 text-xs font-bold">-</button>
                        <span className="px-2 font-semibold text-gray-800">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 hover:bg-gray-100 text-xs font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#FF6B35]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-red-500 hover:text-red-700 font-medium mt-1">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-[#FF6B35]">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-3 bg-[#FF6B35] hover:bg-[#E85D26] disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}

function BazaarCheckout({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const base = shopSlug || shop?.slug || ''
  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: '',
    shipping_address: ''
  })
  const [state, setState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: state,
        state,
        country: 'NG',
        delivery_state: state,
        idempotency_key: crypto.randomUUID?.() || 'x',
        shop_slug: base
      })
      clearCart?.()
      setDone(r?.order || r || { public_id: 'OK' })
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const deliveryCode = done.delivery_code || done.delivery_codes?.[0]?.code || done.groups?.[0]?.delivery_code
    return (
      <div className="py-16 px-6 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">🎉 Order Placed!</h2>
        <p className="text-sm text-gray-500 mb-6">Order #{done.public_id || done.id || 'Confirmed'}</p>
        {deliveryCode && (
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 p-6 rounded-2xl mb-6">
            <span className="text-xs uppercase font-bold tracking-wider text-[#FF6B35] block mb-2">Delivery Code</span>
            <div className="text-2xl font-mono font-black text-[#FF6B35] tracking-widest">{deliveryCode}</div>
            <p className="text-xs text-gray-500 mt-2">Give this code to your rider/courier when receiving your order.</p>
          </div>
        )}
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85D26] text-white rounded-xl font-bold transition-colors">
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">🛒 Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" rows={3} />
        <button type="submit" disabled={loading || items.length === 0} className="w-full py-3 bg-[#FF6B35] hover:bg-[#E85D26] disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

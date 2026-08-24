import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import BrandLogoRenderer from '../../components/shop/BrandLogoRenderer'

/*  DEPARTMENT — Traditional E-Commerce with Sidebar Category Filters
    Think: Traditional department store with left sidebar filters,
    breadcrumbs, grid controls, and formal product listing. */

export default function DepartmentApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-white text-[#333]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top Utility Bar */}
      <div className="bg-[#1B3A5C] text-white text-[10px] py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>Free delivery on orders over ₦15,000 · Customer support: 09:00 – 18:00</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:underline">← MultiShop Marketplace</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="flex items-center gap-2">
            <BrandLogoRenderer
              shop={shop}
              accentColor="#1B3A5C"
              textClassName="font-bold text-xl text-[#1B3A5C]"
              logoClassName="w-8 h-8 rounded-lg"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <Link to={`/shop/${base}`} className="hover:text-[#1B3A5C]">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#1B3A5C]">All Products</Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#1B3A5C]">About Us</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#1B3A5C]">Reviews</Link>
          </nav>

          <button onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B3A5C] hover:bg-[#15304D] text-white rounded text-xs font-bold transition-colors">
            🛒 Cart ({cartCount})
          </button>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<DeptHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<DeptCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<DeptCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={shopSlug} theme="default" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="default" />} />
          <Route path="checkout" element={<DeptCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<DeptHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <DeptModal product={quickView} onClose={() => setQuickView(null)} />}
      <DeptCart shop={shop} shopSlug={shopSlug} />

      <TemplateFooterView shop={shop} shopSlug={shopSlug} theme="default" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function DeptHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Slim promotional banner */}
      {(() => {
        const extra = shop?.theme?.extra_tokens || {}
        const bannerImg = extra.banner_url || shop?.banner
        return (
          <section 
            className="bg-[#F0F4F8] border-b border-gray-200"
            style={bannerImg ? {
              backgroundImage: `linear-gradient(rgba(240, 244, 248, 0.88), rgba(240, 244, 248, 0.92)), url(${getImageUrl(bannerImg)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-[#1B3A5C] mb-2">{extra.hero_headline || shop?.tagline || `Welcome to ${shop?.name || 'Our Store'}`}</h1>
                <p className="text-sm text-gray-600 max-w-lg">{extra.hero_subtitle || shop?.description || 'Browse our curated selection of premium products across all departments.'}</p>
              </div>
              <button onClick={() => navigate(`/shop/${base}/catalog`)}
                className="px-6 py-3 bg-[#1B3A5C] text-white rounded text-sm font-bold flex-shrink-0 hover:bg-[#15304D]">
                {extra.hero_cta_primary || 'Shop All Products →'}
              </button>
            </div>
          </section>
        )
      })()}

      <DeptCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function DeptCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [sort, setSort] = useState('default')
  const [cols, setCols] = useState(3)

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.name || 'General'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products
    if (selectedCat !== 'All') list = list.filter(p => (p.category?.name || 'General') === selectedCat)
    if (search) list = list.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()))
    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    if (sort === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return list
  }, [products, selectedCat, search, sort])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <div className="text-xs text-gray-400 mb-6">
        Home / {shop?.name || 'Store'} / {selectedCat === 'All' ? 'All Products' : selectedCat}
      </div>

      <div className="flex gap-8">
        {/* LEFT SIDEBAR — Category Filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Categories</h3>
            <ul className="space-y-1.5">
              {categories.map(cat => (
                <li key={cat}>
                  <button onClick={() => setSelectedCat(cat)}
                    className={`w-full text-left text-sm py-1.5 px-2 rounded ${selectedCat === cat ? 'bg-[#1B3A5C] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Filter</h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none" />
          </div>
        </aside>

        {/* RIGHT CONTENT — Product Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-gray-200 rounded p-3 mb-6">
            <span className="text-xs text-gray-500">{filtered.length} products</span>
            <div className="flex items-center gap-3">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 outline-none">
                <option value="default">Default</option>
                <option value="name">Name A-Z</option>
                <option value="low">Price: Low-High</option>
                <option value="high">Price: High-Low</option>
              </select>
              <div className="hidden sm:flex border border-gray-200 rounded overflow-hidden">
                {[3, 4, 5].map(n => (
                  <button key={n} onClick={() => setCols(n)}
                    className={`px-2.5 py-1 text-xs ${cols === n ? 'bg-[#1B3A5C] text-white' : 'text-gray-500'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4" style={{ gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `repeat(${cols}, minmax(0, 1fr))` : undefined }}>
            {filtered.map((p, idx) => {
              const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
              const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
              const price = Number(p.base_price || p.price || 0)
              return (
                <div key={p.id || idx} className="border border-gray-200 rounded bg-white hover:shadow-md transition-shadow group">
                  <div className="h-40 bg-gray-50 overflow-hidden relative">
                    {imgSrc
                      ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">📦</div>}
                    <button onClick={() => onQuickView?.(p)}
                      className="absolute bottom-2 left-2 right-2 py-1.5 bg-white/90 text-center text-[10px] font-bold text-[#1B3A5C] rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      Quick View
                    </button>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[9px] text-gray-400 uppercase">{p.category?.name || 'General'}</span>
                    <h3 className="text-xs font-semibold text-gray-800 line-clamp-2">{p.name}</h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-sm text-[#1B3A5C]">₦{price.toLocaleString()}</span>
                      <button onClick={() => addToCart(p)}
                        className="px-2 py-1 bg-[#1B3A5C] text-white rounded text-[10px] font-bold hover:bg-[#15304D]">
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeptModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative border max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full font-bold">✕</button>
        {imgSrc && (
          <div className="h-56 bg-gray-50 rounded overflow-hidden mb-4">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <span className="text-[9px] text-gray-400 uppercase font-semibold">{product.category?.name || 'General'}</span>
        <h2 className="text-lg font-bold mt-1 mb-2 text-gray-900">{product.name}</h2>
        <p className="text-sm text-gray-600 mb-4">{product.description || 'Quality department merchandise.'}</p>
        
        <div className="flex items-center justify-between border-y border-gray-200 py-3 mb-4">
          <div className="text-xl font-bold text-[#1B3A5C]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-gray-300 rounded">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 py-0.5 text-xs hover:bg-gray-100 font-bold">-</button>
            <span className="px-2.5 text-xs font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 py-0.5 text-xs hover:bg-gray-100 font-bold">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-3 bg-[#1B3A5C] hover:bg-[#15304D] text-white rounded font-bold text-sm transition-colors">Add to Cart</button>
      </div>
    </div>
  )
}

function DeptCart({ shop, shopSlug }) {
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
      <div className="w-full max-w-sm h-full bg-white p-6 flex flex-col shadow-2xl border-l">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="font-bold text-[#1B3A5C]">Shopping Cart ({count})</h3>
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
                <div key={it.id || idx} className="flex justify-between items-center p-3 border border-gray-100 rounded text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-gray-200 rounded">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 hover:bg-gray-100 text-xs font-bold text-gray-600">-</button>
                        <span className="px-2 font-bold text-gray-800">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 hover:bg-gray-100 text-xs font-bold text-gray-600">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1B3A5C]">₦{(itemPrice * qty).toLocaleString()}</p>
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
            <span className="text-[#1B3A5C]">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-3 bg-[#1B3A5C] hover:bg-[#15304D] disabled:opacity-50 text-white rounded font-bold transition-colors">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

function DeptCheckout({ shop, shopSlug }) {
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
        <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Order Confirmed ✓</h2>
        <p className="text-sm text-gray-500 mb-6">Order #{done.public_id || done.id || 'Confirmed'}</p>
        {deliveryCode && (
          <div className="bg-[#F0F4F8] border border-[#1B3A5C]/20 p-6 rounded-lg mb-6">
            <span className="text-xs uppercase font-bold tracking-wider text-[#1B3A5C] block mb-2">Delivery Code</span>
            <div className="text-2xl font-mono font-bold text-[#1B3A5C] tracking-widest">{deliveryCode}</div>
            <p className="text-xs text-gray-500 mt-2">Present this code to the courier when your order arrives.</p>
          </div>
        )}
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#1B3A5C] hover:bg-[#15304D] text-white rounded font-bold transition-colors">
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border border-gray-200 rounded text-sm outline-none focus:border-[#1B3A5C]" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-3 border border-gray-200 rounded text-sm outline-none focus:border-[#1B3A5C]" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-3 border border-gray-200 rounded text-sm outline-none focus:border-[#1B3A5C]">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 border border-gray-200 rounded text-sm outline-none focus:border-[#1B3A5C]" rows={3} />
        <button type="submit" disabled={loading || items.length === 0} className="w-full py-3 bg-[#1B3A5C] hover:bg-[#15304D] disabled:opacity-50 text-white rounded font-bold transition-colors">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

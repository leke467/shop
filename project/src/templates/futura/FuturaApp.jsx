import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  FUTURA — Glassmorphic Floating Panels + Holographic Gradients
    Think: Apple Vision Pro UI, frosted glass cards, iridescent gradients
    Products in floating transparent panels with depth and glow */

export default function FuturaApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = cart?.items || cart || []
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(135deg, #0c0015 0%, #1a0a2e 30%, #0d1b2a 60%, #0a0a0a 100%)' }}>
      {/* Floating ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #ec4899, transparent)', filter: 'blur(100px)' }} />
        <div className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(100px)' }} />
      </div>

      {/* Glassmorphic Header */}
      <header className="sticky top-4 z-40 mx-4 sm:mx-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="px-6 h-16 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>F</div>
            <span className="font-semibold text-sm tracking-wider">{shop?.name || 'FUTURA'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-white/50">
            <Link to={`/shop/${base}`} className="hover:text-white transition-colors">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-white transition-colors">Explore</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-white transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:block text-xs text-white/40 hover:text-white">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Routes>
          <Route index element={<FuturaHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<FuturaCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<FuturaCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="futura" />} />
          <Route path="checkout" element={<FuturaCheckout shop={shop} shopSlug={shopSlug || base} />} />
          <Route path="*" element={<FuturaHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <FuturaModal product={quickView} onClose={() => setQuickView(null)} />}
      <FuturaCart shop={shop} shopSlug={shopSlug || base} />

      <footer className="relative z-10 py-10 text-center text-[10px] text-white/20 tracking-widest uppercase">
        FUTURA HOLOGRAPHIC INTERFACE · © {new Date().getFullYear()} · {shop?.name}
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function FuturaHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Holographic Hero */}
      <section className="pt-20 pb-16 px-8 max-w-5xl mx-auto text-center">
        <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          ✦ Next-Gen Shopping Experience
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6"
          style={{ background: 'linear-gradient(135deg, #fff 0%, #c084fc 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {shop?.name || 'Welcome to Futura'}
        </h1>

        <p className="text-sm text-white/50 max-w-lg mx-auto leading-relaxed mb-10">
          {shop?.description || shop?.tagline || 'Discover tomorrow\u0027s technology today. Premium gadgets, wearables, and smart devices curated for the future.'}
        </p>

        <button onClick={() => navigate(`/shop/${base}/catalog`)}
          className="px-8 py-4 rounded-2xl font-bold text-sm text-white hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
          Explore Collection ✦
        </button>
      </section>

      <FuturaCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function FuturaCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Holographic'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Holographic'
      const matchCat = selectedCategory === 'All' || cat === selectedCategory
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    return list
  }, [products, search, selectedCategory, sort])

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-semibold text-white/80">✦ Collection</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="px-4 py-2 rounded-xl text-xs text-white outline-none w-40 sm:w-48"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="default" className="bg-[#1a0a2e]">Sort: Featured</option>
            <option value="low" className="bg-[#1a0a2e]">Price: Low → High</option>
            <option value="high" className="bg-[#1a0a2e]">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: selectedCategory === cat ? '#fff' : 'rgba(255,255,255,0.7)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Glassmorphic floating panels */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-xs text-white/40">No items found matching your filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div key={p.id || idx}
                className="rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

                <div className="h-56 overflow-hidden relative cursor-pointer"
                  onClick={() => onQuickView?.(p)}
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))' }}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl text-white/20">✦</div>}

                  <button onClick={(e) => { e.stopPropagation(); onQuickView?.(p) }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    Quick View
                  </button>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-semibold text-sm text-white truncate cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-[11px] text-white/40 line-clamp-1">{p.description || 'Premium item'}</p>
                  <div className="flex items-center justify-between pt-3">
                    <span className="font-bold"
                      style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ₦{price.toLocaleString()}
                    </span>
                    <button onClick={() => addToCart(p)}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold text-white hover:scale-105 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function FuturaModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl relative"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white font-bold text-lg">✕</button>
        
        {imgSrc && (
          <div className="h-52 rounded-2xl overflow-hidden mb-4 border border-white/10">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-xl font-bold mb-2 text-white">{product.name}</h2>
        <p className="text-sm text-white/60 mb-4">{product.description || 'Futuristic engineered excellence.'}</p>
        
        <div className="flex items-center justify-between py-3 mb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ₦{(price * quantity).toLocaleString()}
          </div>
          <div className="flex items-center rounded-xl px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-white/80 hover:text-white">-</button>
            <span className="px-2 text-xs font-bold text-white">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-white/80 hover:text-white">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
          Add to Cart ✦
        </button>
      </div>
    </div>
  )
}

function FuturaCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md h-full p-6 flex flex-col"
        style={{ background: 'rgba(15,10,25,0.95)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold text-sm">Your Cart ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-white/40 hover:text-white font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center py-8 text-xs text-white/40">Your cart is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p className="font-semibold text-sm text-white">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center rounded-lg px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1 text-xs text-white/70 hover:text-white font-bold">-</button>
                        <span className="px-1.5 text-xs text-white font-bold">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1 text-xs text-white/70 hover:text-white font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ₦{(itemPrice * qty).toLocaleString()}
                    </p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-rose-400 hover:text-rose-300 font-semibold mt-1">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₦{total.toLocaleString()}
            </span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            Proceed to Checkout ✦
          </button>
        </div>
      </div>
    </div>
  )
}

function FuturaCheckout({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
  })
  const [state, setState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      console.error('Checkout error:', err);
      return
    }
    setLoading(true)
    try {
      const r = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: state,
        state,
        country: 'NG',
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : 'x-' + Date.now(),
        shop_slug: base,
      })
      clearCart?.()
      const orderData = r.order || r || { public_id: 'OK' }
      const deliveryCode = r.delivery_code || r.order?.delivery_code || r.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setDone({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="p-16 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">✦ Order Confirmed</h2>
        {done.delivery_code && (
          <div className="text-xl font-bold p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Delivery Code: {done.delivery_code}
          </div>
        )}
        <p className="text-xs text-white/50">Your transaction has been confirmed on the holographic network. Keep your delivery code safe.</p>
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
          Return to Store
        </button>
      </div>
    )
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">✦ Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 rounded-xl text-sm text-white outline-none" style={inputStyle} />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 rounded-xl text-sm text-white outline-none" style={inputStyle} />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 rounded-xl text-sm text-white outline-none" style={inputStyle}>
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Kaduna', 'Delta'].map(s => <option key={s} value={s} className="bg-[#1a0a2e] text-white">{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 rounded-xl text-sm text-white outline-none" style={inputStyle} />
        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-bold text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  ZENITH — Dashboard / Analytics-Panel Layout with Stats Sidebar
    Think: Stripe dashboard meets product catalog, data-driven storefront
    Left stats sidebar on catalog, metric cards, clean tables */

export default function ZenithApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = cart?.items || cart || []
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top Utility Bar */}
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155]">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between text-sm">
          <Link to={`/shop/${base}`} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">Z</div>
            <span className="font-semibold text-white">{shop?.name || 'Zenith'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[#94A3B8] text-xs font-medium">
            <Link to={`/shop/${base}`} className="hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155] transition-all">Overview</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155] transition-all">Products</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155] transition-all">Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:block text-xs text-[#94A3B8] hover:text-white">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all">
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<ZenithHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<ZenithCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<ZenithCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="dark" />} />
          <Route path="checkout" element={<ZenithCheckout shop={shop} shopSlug={shopSlug || base} />} />
          <Route path="*" element={<ZenithHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <ZenithModal product={quickView} onClose={() => setQuickView(null)} />}
      <ZenithCart shop={shop} shopSlug={shopSlug || base} />

      <footer className="border-t border-[#334155] py-8 text-center text-xs text-[#94A3B8]">
        © {new Date().getFullYear()} {shop?.name || 'Zenith'}. All rights reserved.
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function ZenithHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const totalProducts = products.length
  const avgPrice = totalProducts > 0 ? Math.round(products.reduce((s, p) => s + Number(p.base_price || p.price || 0), 0) / totalProducts) : 0

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Dashboard Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: totalProducts, color: 'from-indigo-500 to-blue-600', icon: '📦' },
          { label: 'Avg. Price', value: `₦${avgPrice.toLocaleString()}`, color: 'from-emerald-500 to-teal-600', icon: '💰' },
          { label: 'Categories', value: new Set(products.map(p => p.category?.name || 'General')).size, color: 'from-amber-500 to-orange-600', icon: '🏷️' },
          { label: 'Store Rating', value: '4.8★', color: 'from-pink-500 to-rose-600', icon: '⭐' },
        ].map((m, i) => (
          <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#94A3B8] font-medium">{m.label}</span>
              <span className="text-lg">{m.icon}</span>
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Hero Banner Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-8 sm:p-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{shop?.name || 'Welcome to Zenith'}</h1>
        <p className="text-sm text-indigo-200 max-w-lg mb-6">{shop?.description || shop?.tagline || 'Premium tech accessories, gadgets, and electronics — data-driven shopping experience.'}</p>
        <button onClick={() => navigate(`/shop/${base}/catalog`)}
          className="px-6 py-3 bg-white text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-50 transition-all">
          Browse Products →
        </button>
      </div>

      <ZenithCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function ZenithCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const [view, setView] = useState('grid') // 'grid' or 'table'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'GENERAL').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'GENERAL').toUpperCase()
      const matchCat = selectedCategory === 'ALL' || cat === selectedCategory
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    return list
  }, [products, search, selectedCategory, sort])

  return (
    <section className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-[#1E293B] border border-[#334155] rounded-xl p-4 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-white">Products ({filtered.length})</h2>
          <div className="hidden sm:flex border border-[#334155] rounded-lg overflow-hidden">
            <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-[#94A3B8]'}`}>Grid</button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 text-xs ${view === 'table' ? 'bg-indigo-600 text-white' : 'text-[#94A3B8]'}`}>Table</button>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2 text-xs text-white outline-none w-full sm:w-48" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-xs text-[#94A3B8] outline-none cursor-pointer">
            <option value="default">Featured</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:border-indigo-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {view === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#334155] text-[#94A3B8] text-left">
              <th className="p-4">#</th><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4 text-right">Price</th><th className="p-4"></th>
            </tr></thead>
            <tbody>
              {filtered.map((p, idx) => {
                const price = Number(p.base_price || p.price || 0)
                return (
                  <tr key={p.id || idx} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="p-4 text-[#94A3B8]">{idx + 1}</td>
                    <td className="p-4 font-semibold text-white cursor-pointer hover:underline" onClick={() => onQuickView?.(p)}>{p.name}</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px]">{p.category?.name || 'General'}</span></td>
                    <td className="p-4 text-right font-bold text-white">₦{price.toLocaleString()}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => onQuickView?.(p)} className="px-2 py-1 bg-[#334155] text-white rounded-md text-[10px] hover:bg-[#475569]">View</button>
                      <button onClick={() => addToCart(p)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold hover:bg-indigo-500 transition-colors">Add</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            return (
              <div key={p.id || idx} className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden hover:border-indigo-500 transition-colors group flex flex-col justify-between">
                <div className="h-48 bg-[#0F172A] overflow-hidden relative cursor-pointer" onClick={() => onQuickView?.(p)}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl text-[#334155]">📦</div>}
                  <button onClick={(e) => { e.stopPropagation(); onQuickView?.(p); }} className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    Quick View
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] text-indigo-400 font-semibold">{p.category?.name || 'General'}</span>
                  <h3 className="font-semibold text-sm text-white truncate cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-white">₦{price.toLocaleString()}</span>
                    <button onClick={() => addToCart(p)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-500 transition-colors">+ Add</button>
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

function ZenithModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#94A3B8] hover:text-white font-bold text-lg">✕</button>
        <span className="text-[10px] text-indigo-400 font-semibold block mb-2">{product.category?.name || 'General'}</span>
        
        {imgSrc && (
          <div className="h-48 bg-[#0F172A] border border-[#334155] rounded-xl overflow-hidden mb-4">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-2">{product.name}</h2>
        <p className="text-sm text-[#94A3B8] mb-4">{product.description || 'High performance tech accessory.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#334155] py-3 mb-6">
          <div className="text-2xl font-bold text-white">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#334155] rounded-lg bg-[#0F172A]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-xs text-[#94A3B8] hover:text-white">-</button>
            <span className="px-3 text-xs font-bold text-white">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-xs text-[#94A3B8] hover:text-white">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-colors">Add to Cart →</button>
      </div>
    </div>
  )
}

function ZenithCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-md h-full bg-[#1E293B] border-l border-[#334155] p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-[#334155]">
          <h3 className="font-bold text-white text-sm">Your Cart ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#94A3B8] hover:text-white text-base font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#94A3B8]">Your cart is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-[#0F172A] rounded-lg border border-[#334155] text-sm">
                  <div>
                    <p className="font-semibold text-white">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#334155] rounded bg-[#1E293B]">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 text-xs text-[#94A3B8] hover:text-white">-</button>
                        <span className="px-2 text-xs font-bold text-white">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 text-xs text-[#94A3B8] hover:text-white">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-rose-400 hover:text-rose-300 font-semibold mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-[#334155] space-y-3">
          <div className="flex justify-between font-bold text-white">
            <span>Total</span>
            <span className="text-indigo-400">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-bold hover:bg-indigo-500 transition-colors">
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}

function ZenithCheckout({ shop, shopSlug }) {
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
        <h2 className="text-2xl font-bold text-white">Order Confirmed ✓</h2>
        {done.delivery_code && (
          <div className="text-xl font-bold text-indigo-400 bg-[#1E293B] border border-indigo-500/30 p-4 rounded-xl">
            Delivery Code: {done.delivery_code}
          </div>
        )}
        <p className="text-sm text-[#94A3B8]">Your order has been recorded. Keep your delivery code safe for courier verification.</p>
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-colors">
          Return to Store
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Kaduna', 'Delta'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-white outline-none focus:border-indigo-500 transition-colors" />
        <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-bold hover:bg-indigo-500 transition-colors">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

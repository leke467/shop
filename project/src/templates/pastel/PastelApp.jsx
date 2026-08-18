import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  PASTEL — Bento Grid Dashboard Layout
    Think: iOS widget dashboard, rounded blob shapes, soft gradients
    Products arranged in a bento-box grid with varying tile sizes */

export default function PastelApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF2F8] via-[#F3E8FF] to-[#EFF6FF] text-[#4A3560]" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
      {/* Soft Pill-Shaped Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/60 border-b border-purple-100/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold shadow-md">✦</div>
            <span className="font-extrabold text-lg text-[#4A3560]">{shop?.name || 'Pastel Dream'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-purple-400">
            <Link to={`/shop/${base}`} className="hover:text-[#4A3560] px-3 py-1.5 rounded-full hover:bg-purple-50 transition-all">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#4A3560] px-3 py-1.5 rounded-full hover:bg-purple-50 transition-all">Shop ✦</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#4A3560] px-3 py-1.5 rounded-full hover:bg-purple-50 transition-all">Reviews</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:block text-xs text-purple-400 hover:text-[#4A3560] font-bold">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all">
              🛍️ {cartCount}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<PastelHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<PastelCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<PastelCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={base} theme="pastel" />} />
          <Route path="checkout" element={<PastelCheckout shop={shop} shopSlug={base} />} />
          <Route path="*" element={<PastelHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <PastelModal product={quickView} onClose={() => setQuickView(null)} />}
      <PastelCart shop={shop} shopSlug={base} />

      <footer className="py-10 text-center text-xs text-purple-300 font-bold">
        ✦ Pastel Dream Storefront · © {new Date().getFullYear()} {shop?.name}
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function PastelHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Bento Hero Grid */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px]">
          {/* Large featured tile */}
          <div className="col-span-2 row-span-2 bg-gradient-to-br from-pink-300 to-purple-400 rounded-3xl p-8 flex flex-col justify-end text-white relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">✦ Welcome to</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{shop?.name || 'Pastel Dream'}</h1>
            <p className="text-sm opacity-80 mt-2 max-w-sm">{shop?.tagline || 'Cute stationery, kawaii accessories & dreamy lifestyle goods.'}</p>
          </div>

          {/* Small stat tiles */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 flex flex-col justify-between border border-purple-100 shadow-sm">
            <span className="text-2xl">🎀</span>
            <div><span className="text-2xl font-extrabold text-pink-500">{products.length}</span><p className="text-[10px] text-purple-400 font-bold mt-0.5">Products</p></div>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 flex flex-col justify-between border border-purple-100 shadow-sm">
            <span className="text-2xl">⭐</span>
            <div><span className="text-2xl font-extrabold text-purple-500">4.9</span><p className="text-[10px] text-purple-400 font-bold mt-0.5">Rating</p></div>
          </div>

          {/* CTA tile */}
          <div className="col-span-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl p-6 flex items-center justify-between border border-purple-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/shop/${base}/catalog`)}>
            <div><h3 className="font-extrabold text-[#4A3560]">Browse All Items ✦</h3><p className="text-xs text-purple-500">{shop?.description || 'Explore our entire collection'}</p></div>
            <span className="text-3xl">→</span>
          </div>
        </div>
      </section>

      <PastelCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function PastelCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Kawaii'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Kawaii'
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
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-extrabold text-[#4A3560]">✦ All Items</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="px-4 py-2 rounded-full bg-white/70 border border-purple-100 text-sm outline-none w-40 sm:w-48 shadow-sm" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 rounded-full bg-white/70 border border-purple-100 text-xs font-bold text-[#4A3560] outline-none shadow-sm cursor-pointer">
            <option value="default">Featured</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
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
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white border-transparent shadow-md'
                  : 'bg-white/80 text-purple-600 border-purple-100 hover:border-purple-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* BENTO product grid with varying tile sizes */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm font-bold text-purple-400">No dreamy items found ✦</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            const isWide = idx % 5 === 0

            return (
              <div key={p.id || idx}
                className={`${isWide ? 'md:col-span-2' : ''} bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-lg transition-shadow group`}>
                <div className={`${isWide ? 'h-52' : 'h-44'} bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden relative cursor-pointer`} onClick={() => onQuickView?.(p)}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">✦</div>}
                  <button onClick={(e) => { e.stopPropagation(); onQuickView?.(p); }}
                    className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-purple-500 px-2.5 py-1 rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    Quick View
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-extrabold text-sm text-[#4A3560] truncate cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-[11px] text-purple-400 line-clamp-1">{p.description || 'Dreamy item'}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-extrabold text-pink-500">₦{price.toLocaleString()}</span>
                    <button onClick={() => addToCart(p)}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full text-[10px] font-bold shadow-md hover:shadow-lg">
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

function PastelModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-purple-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-purple-400 font-bold hover:text-purple-600 text-lg">✕</button>
        {imgSrc ? (
          <div className="w-full h-48 rounded-2xl bg-purple-50 overflow-hidden mb-4 border border-purple-100">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-purple-50 flex items-center justify-center text-4xl mb-4">
            ✦
          </div>
        )}
        <h2 className="text-xl font-extrabold text-[#4A3560] mb-1">{product.name}</h2>
        <p className="text-sm text-purple-500 mb-4">{product.description || 'Dreamy kawaii item.'}</p>
        
        <div className="flex items-center justify-between border-y border-purple-100 py-3 mb-6">
          <div className="text-2xl font-extrabold text-pink-500">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-purple-200 rounded-full px-2 py-0.5 bg-white">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-purple-600">-</button>
            <span className="px-2 text-xs font-bold text-[#4A3560]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-purple-600">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all">Add to Bag ✦</button>
      </div>
    </div>
  )
}

function PastelCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  const base = shopSlug || shop?.slug || ''
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-white/90 backdrop-blur-xl border-l border-purple-100 p-6 flex flex-col shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b border-purple-100">
          <h3 className="font-extrabold text-[#4A3560] text-lg">🛍️ Your Bag ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-purple-400 hover:text-purple-600 font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-purple-400 text-sm font-bold">Your bag is empty ✦</div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <div>
                    <p className="font-bold text-sm text-[#4A3560]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-purple-400 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-purple-200 rounded-full bg-white px-1.5 py-0.5">
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty - 1)} className="px-1 text-xs font-bold text-purple-600">-</button>
                        <span className="px-1.5 font-bold text-[#4A3560]">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty + 1)} className="px-1 text-xs font-bold text-purple-600">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-pink-500">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id || it.product_id || it.product?.id)} className="text-xs text-rose-400 font-bold hover:text-rose-600 mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t border-purple-100 space-y-3">
          <div className="flex justify-between font-extrabold text-lg text-[#4A3560]">
            <span>Total</span>
            <span className="text-pink-500">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className={`w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold shadow-lg transition-all ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
          >
            Checkout ✦
          </button>
        </div>
      </div>
    </div>
  )
}

function PastelCheckout({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: user?.phone_number || '',
    shipping_address: ''
  })
  const [state, setState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const submit = async e => {
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
        idempotency_key: crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9)),
        shop_slug: base
      })
      clearCart?.()
      const orderData = r.order || r || { public_id: 'OK' }
      const deliveryCode = r.delivery_code || r.order?.delivery_code || r.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setDone({ ...orderData, delivery_code: deliveryCode })
    } catch {
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="p-16 text-center max-w-xl mx-auto">
      <h2 className="text-3xl font-extrabold text-[#4A3560] mb-4">✦ Order Confirmed!</h2>
      <p className="text-sm text-purple-400 mb-6">Thank you for your order! It has been processed successfully.</p>
      {done.delivery_code && (
        <div className="text-2xl font-bold text-pink-500 bg-white/80 p-4 rounded-2xl mb-6 border border-purple-100 shadow-sm">
          Delivery Code: {done.delivery_code}
        </div>
      )}
      <button onClick={() => nav(`/shop/${base}`)} className="px-8 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold shadow-md hover:shadow-lg">
        Back to Store
      </button>
    </div>
  )

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-[#4A3560] mb-8">✦ Checkout</h1>
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white/70 rounded-2xl border border-purple-100 p-8 space-y-4">
          <p className="text-sm font-bold text-purple-400">Your bag is currently empty.</p>
          <button onClick={() => nav(`/shop/${base}/catalog`)} className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold text-xs shadow-md hover:shadow-lg">
            Browse All Items ✦
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 rounded-2xl border border-purple-100 bg-white/70 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 rounded-2xl border border-purple-100 bg-white/70 text-sm outline-none" />
            <select value={state} onChange={e => setState(e.target.value)} className="p-4 rounded-2xl border border-purple-100 bg-white/70 text-sm outline-none">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 rounded-2xl border border-purple-100 bg-white/70 text-sm outline-none" />
          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
            {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
          </button>
        </form>
      )}
    </div>
  )
}

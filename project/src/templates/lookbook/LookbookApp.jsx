import { useState, useRef, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  LOOKBOOK — Full-Viewport Scroll-Snap Slides
    Each product is a full-screen slide. Scroll vertically to flip through.
    Like a high-fashion lookbook or Zara's product page. */

export default function LookbookApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#111] text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Floating overlay header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between mix-blend-difference">
        <Link to={`/shop/${base}`} className="text-xl font-bold tracking-[0.2em] uppercase text-white">
          {shop?.name || 'LOOKBOOK'}
        </Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
          <Link to="/" className="hidden sm:block text-white/60 hover:text-white">MultiShop</Link>
          <Link to={`/shop/${base}/catalog`} className="text-white/60 hover:text-white">Index</Link>
          <Link to={`/shop/${base}/reviews`} className="text-white/60 hover:text-white">Reviews</Link>
          <button onClick={() => setIsCartOpen(true)} className="text-white">Bag ({cartCount})</button>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<LookbookSlides shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<LookbookIndex products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<LookbookIndex products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="dark" />} />
          <Route path="checkout" element={<LookbookCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<LookbookSlides shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <LookbookModal product={quickView} onClose={() => setQuickView(null)} />}
      <LookbookCart shop={shop} shopSlug={shopSlug} />

      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs uppercase tracking-widest text-white/40">
        © {new Date().getFullYear()} {shop?.name || 'LOOKBOOK'}. All rights reserved.
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function LookbookSlides({ shop, products, base, onQuickView }) {
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto" style={{ scrollSnapType: 'y mandatory' }}>
      {/* Hero Slide */}
      <section className="h-screen relative flex items-center justify-center" style={{ scrollSnapAlign: 'start' }}>
        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80" alt=""
          className="absolute inset-0 w-full h-full object-cover brightness-[0.3]" />
        <div className="relative z-10 text-center max-w-2xl px-6">
          <span className="text-[11px] tracking-[0.5em] uppercase text-white/50 block mb-4">Scroll to Explore</span>
          <h1 className="text-6xl sm:text-8xl font-bold tracking-tight mb-4">{shop?.name || 'LOOKBOOK'}</h1>
          <p className="text-sm text-white/60 mb-8">{shop?.description || shop?.tagline || 'A visual journey through our collection. Scroll down.'}</p>
          <div className="animate-bounce text-white/40 text-2xl">↓</div>
        </div>
      </section>

      {/* Product Slides — each is a full viewport */}
      {products.map((p, idx) => {
        const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
        const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
        const price = Number(p.base_price || p.price || 0)

        return (
          <section key={p.id || idx} className="h-screen relative flex items-end" style={{ scrollSnapAlign: 'start' }}>
            {imgSrc ? (
              <img src={imgSrc} alt={p.name} className="absolute inset-0 w-full h-full object-cover brightness-[0.5]" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
            )}

            {/* Slide number */}
            <div className="absolute top-20 left-8 text-[120px] font-black text-white/5 leading-none">
              {String(idx + 1).padStart(2, '0')}
            </div>

            {/* Product Info Overlay */}
            <div className="relative z-10 w-full p-8 sm:p-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="max-w-4xl flex flex-col sm:flex-row items-end justify-between gap-6">
                <div>
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/40 block mb-2">LOOK {String(idx + 1).padStart(2, '0')}</span>
                  <h2 className="text-3xl sm:text-5xl font-bold mb-2 tracking-tight cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h2>
                  <p className="text-sm text-white/50 max-w-md">{p.description || 'Part of the collection.'}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-2xl font-bold">₦{price.toLocaleString()}</span>
                  <button onClick={() => onQuickView?.(p)} className="px-4 py-3 border border-white/40 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">
                    Inspect
                  </button>
                  <button onClick={() => addToCart(p)}
                    className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-white/90 transition-all">
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* Final CTA Slide */}
      <section className="h-screen flex items-center justify-center bg-[#111]" style={{ scrollSnapAlign: 'start' }}>
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">End of Lookbook</h2>
          <p className="text-sm text-white/40 mb-8">Explore the full index or check out.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate(`/shop/${base}/catalog`)} className="px-6 py-3 border border-white/30 text-sm hover:bg-white hover:text-black transition-all">View Index</button>
            <button onClick={() => navigate(`/shop/${base}/checkout`)} className="px-6 py-3 bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">Checkout</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function LookbookIndex({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Editorial'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Editorial'
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
    <div className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 border-b border-white/10 pb-4 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Full Index</h1>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search index..."
            className="bg-transparent border-b border-white/30 py-1 text-sm outline-none w-40 sm:w-48 text-white" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-[#111] border-b border-white/30 py-1 text-xs text-white outline-none cursor-pointer">
            <option value="default">Sort: Default</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-white/50 border-white/20 hover:border-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Minimal numbered list */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-xs text-white/40 uppercase tracking-widest">No items found in index</p>
      ) : (
        <div className="space-y-0">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            return (
              <div key={p.id || idx} className="flex items-center gap-6 py-6 border-b border-white/10 group hover:bg-white/5 px-4 -mx-4 transition-colors">
                <span className="text-3xl font-black text-white/10 w-12 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                {imgSrc && <img src={imgSrc} alt="" onClick={() => onQuickView?.(p)} className="w-16 h-16 object-cover flex-shrink-0 grayscale group-hover:grayscale-0 transition-all cursor-pointer" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-xs text-white/40 truncate">{p.description || 'Editorial collection'}</p>
                </div>
                <span className="font-bold text-lg flex-shrink-0">₦{price.toLocaleString()}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => onQuickView?.(p)} className="px-3 py-2 border border-white/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10">View</button>
                  <button onClick={() => addToCart(p)} className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all">+ Add</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LookbookModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#181818] border border-white/15 p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold text-lg">✕</button>

        {imgSrc && (
          <div className="h-64 overflow-hidden mb-4 bg-zinc-900 border border-white/10">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 block mb-1">{product.category?.name || product.category_name || 'LOOKBOOK'}</span>
        <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">{product.name}</h2>
        <p className="text-xs text-white/60 mb-4 leading-relaxed">{product.description || 'Editorial signature piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-white/10 py-3 mb-6">
          <div className="text-2xl font-bold text-white">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-white/30">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-white hover:bg-white/10 font-bold">-</button>
            <span className="px-3 text-xs font-bold text-white">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-white hover:bg-white/10 font-bold">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/90 transition-all">Add to Bag 🛍</button>
      </div>
    </div>
  )
}

function LookbookCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-[#111] border-l border-white/10 p-8 flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 text-sm font-bold uppercase tracking-widest">
          <h3>Bag ({count})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-white/40 hover:text-white font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">Your bag is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
                  <div>
                    <p className="font-bold">{it.product_name || it.name}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-white/20">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 hover:bg-white/10 text-white font-bold">-</button>
                        <span className="px-2 font-bold text-white">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 hover:bg-white/10 text-white font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-white/40 hover:text-red-400 mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 transition-all">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

function LookbookCheckout({ shop, shopSlug }) {
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
      alert(err?.response?.data?.detail || 'Order checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const deliveryCode = done.delivery_code || done.delivery_codes?.[0]?.code || done.groups?.[0]?.delivery_code
    return (
      <div className="pt-32 pb-20 text-center px-6 max-w-md mx-auto">
        <h2 className="text-3xl font-bold mb-4">Order Confirmed 🎉</h2>
        <p className="text-sm text-white/60 mb-6">Order #{done.public_id || done.id || 'Confirmed'}</p>
        {deliveryCode && (
          <div className="bg-white/5 border border-white/20 p-6 rounded-lg mb-6">
            <span className="text-xs uppercase tracking-widest text-white/50 block mb-2">Delivery Code</span>
            <div className="text-2xl font-mono font-bold text-white tracking-widest">
              {deliveryCode}
            </div>
            <p className="text-xs text-white/40 mt-2">Provide this code to the courier upon delivery</p>
          </div>
        )}
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-white/90 transition-all">
          Return to Store
        </button>
      </div>
    )
  }

  return (
    <div className="pt-28 pb-16 px-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-white/40" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-white/40" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-white/40">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s} className="bg-[#111] text-white">{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-white/40" rows={3} />
        <button type="submit" disabled={loading || items.length === 0} className="w-full py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 transition-all">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

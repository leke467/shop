import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  EMERALD — Split-Screen Vertical Layout
    Left panel = fixed brand/nav column, Right panel = scrollable content
    Think: luxury spa booking site meets editorial magazine sidebar */

export default function EmeraldApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="flex min-h-screen bg-[#F0FDF4] text-[#064E3B] font-sans">
      {/* LEFT FIXED SIDEBAR — always visible on desktop */}
      <aside className="hidden lg:flex flex-col justify-between w-72 bg-[#022C22] text-white p-8 sticky top-0 h-screen border-r border-emerald-800">
        <div className="space-y-8">
          <Link to={`/shop/${base}`} className="block">
            <span className="text-[10px] tracking-[0.4em] uppercase text-emerald-400 block mb-1">Botanical</span>
            <h1 className="text-2xl font-light tracking-wide">{shop?.name || 'VERDANT'}</h1>
          </Link>

          <nav className="space-y-4 text-sm">
            <Link to={base ? `/shop/${base}` : '/'} className="block text-emerald-300 hover:text-white transition-colors">⌂ Home</Link>
            <Link to={base ? `/shop/${base}/catalog` : '/catalog'} className="block text-emerald-300 hover:text-white transition-colors">❋ Catalog</Link>
            <Link to={base ? `/shop/${base}/reviews` : '/reviews'} className="block text-emerald-300 hover:text-white transition-colors">❋ Reviews</Link>
            <Link to="/" className="block text-emerald-500 hover:text-emerald-300 transition-colors text-xs mt-6 pt-4 border-t border-emerald-800">← MultiShop Marketplace</Link>
          </nav>
        </div>

        <div>
          <button onClick={() => setIsCartOpen(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all">
            🌿 Bag ({cartCount})
          </button>
          <p className="text-[9px] text-emerald-600 mt-4 text-center tracking-wider">100% ORGANIC · ECO CERTIFIED</p>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#022C22] text-white px-4 py-3 flex items-center justify-between">
        <Link to={base ? `/shop/${base}` : '/'} className="font-light text-lg">{shop?.name || 'VERDANT'}</Link>
        <div className="flex gap-3 items-center">
          <Link to={base ? `/shop/${base}/reviews` : '/reviews'} className="text-emerald-300 hover:text-white text-xs">Reviews</Link>
          <Link to="/" className="text-emerald-400 text-xs">← MultiShop</Link>
          <button onClick={() => setIsCartOpen(true)} className="bg-emerald-600 px-3 py-1 rounded text-xs font-bold">Bag ({cartCount})</button>
        </div>
      </div>

      {/* RIGHT SCROLLABLE CONTENT */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            <Route index element={<EmeraldHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
            <Route path="catalog" element={<EmeraldCatalog products={products} onQuickView={setQuickView} />} />
            <Route path="menu" element={<EmeraldCatalog products={products} onQuickView={setQuickView} />} />
            <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="default" />} />
            <Route path="checkout" element={<EmeraldCheckout shop={shop} shopSlug={shopSlug} />} />
            <Route path="*" element={<EmeraldHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          </Routes>
        </div>

        <footer className="border-t border-emerald-200 py-8 text-center text-xs text-emerald-700">
          🌿 {shop?.name || 'VERDANT'} · 100% ORGANIC · ECO CERTIFIED · © {new Date().getFullYear()}
          <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
        </footer>
      </main>

      {quickView && <QV product={quickView} onClose={() => setQuickView(null)} />}
      <CartDrawer shop={shop} shopSlug={shopSlug} />
    </div>
  )
}

function EmeraldHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  return (
    <div>
      {/* Full-bleed botanical hero with overlapping text block */}
      <section className="relative h-[70vh] bg-emerald-950 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80" alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16 bg-gradient-to-t from-[#022C22] via-[#022C22]/80 to-transparent">
          <span className="text-emerald-400 text-xs tracking-[0.5em] uppercase block mb-3">Ethically Sourced · Cruelty Free</span>
          <h1 className="text-4xl sm:text-6xl font-light text-white leading-tight max-w-2xl">
            {shop?.tagline || 'Nourish Your Soul With Pure Organics'}
          </h1>
          <button onClick={() => navigate(`/shop/${base}/catalog`)} className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm uppercase tracking-wider rounded-full shadow-lg transition-all">
            Shop Botanicals 🌿
          </button>
        </div>
      </section>

      {/* Horizontal scrolling feature strip */}
      <section className="bg-white border-y border-emerald-200 py-6 px-8 overflow-x-auto">
        <div className="flex gap-12 min-w-max">
          {[
            { icon: '🌱', t: 'Farm Fresh', d: 'Direct from growers' },
            { icon: '🐰', t: 'Cruelty Free', d: 'Zero animal testing' },
            { icon: '♻️', t: 'Zero Waste', d: 'Eco-friendly packaging' },
            { icon: '💚', t: 'Wellness', d: 'Money-back guarantee' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm whitespace-nowrap">
              <span className="text-2xl">{f.icon}</span>
              <div><strong className="block text-[#064E3B]">{f.t}</strong><span className="text-xs text-emerald-600">{f.d}</span></div>
            </div>
          ))}
        </div>
      </section>

      <EmeraldCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function EmeraldCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Botanical'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Botanical'
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
    <section className="p-8 sm:p-12">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 border-b border-emerald-200 pb-4 gap-4">
        <h2 className="text-2xl font-light text-[#064E3B]">Botanical Collection</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="border-b border-emerald-400 bg-transparent py-1 text-sm outline-none w-40 sm:w-48 text-[#064E3B]" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="border-b border-emerald-400 bg-transparent py-1 text-xs outline-none text-[#064E3B] cursor-pointer">
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-emerald-800 border-emerald-200 hover:border-emerald-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 2-column alternating large/small layout */}
      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm text-emerald-700">No botanicals found matching your selection.</p>
      ) : (
        <div className="space-y-12">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            const isLarge = idx % 3 === 0

            return (
              <div key={p.id || idx} className={`grid ${isLarge ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} gap-6 items-center ${idx % 2 === 1 ? 'md:direction-rtl' : ''}`}>
                <div className={`${isLarge ? 'h-80' : 'h-56'} bg-emerald-100 rounded-3xl overflow-hidden border border-emerald-200 cursor-pointer`} onClick={() => onQuickView?.(p)}>
                  {imgSrc ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>}
                </div>
                <div className={`${isLarge ? '' : 'md:col-span-2'} space-y-3 p-4`}>
                  <span className="text-xs text-emerald-600 uppercase tracking-wider">{p.category?.name || p.category_name || 'Botanical'}</span>
                  <h3 className="text-xl font-light text-[#064E3B] cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-sm text-emerald-700 line-clamp-2">{p.description || 'Pure organic botanical product.'}</p>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xl font-bold text-[#064E3B]">₦{price.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => onQuickView?.(p)} className="px-3 py-2 border border-emerald-400 text-emerald-700 rounded-full text-xs hover:bg-emerald-50">View</button>
                      <button onClick={() => addToCart(p)} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-500 transition-all">+ Add</button>
                    </div>
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

function QV({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-emerald-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-emerald-800 hover:text-emerald-950 font-bold text-lg">✕</button>
        
        {imgSrc ? (
          <div className="h-56 rounded-2xl overflow-hidden mb-4 bg-emerald-50 border border-emerald-100">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-36 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl mb-4">
            🌿
          </div>
        )}

        <h2 className="text-2xl font-light text-[#064E3B] mb-1">{product.name}</h2>
        <p className="text-sm text-emerald-700 mb-4 leading-relaxed">{product.description || 'Pure organic botanical product.'}</p>
        
        <div className="flex items-center justify-between border-y border-emerald-200 py-3 mb-6">
          <div className="text-2xl font-bold text-[#064E3B]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-emerald-300 rounded-full px-2 py-0.5 bg-emerald-50">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-emerald-900">-</button>
            <span className="px-2 text-xs font-bold text-emerald-900">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-emerald-900">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold transition-all shadow-md">Add to Bag 🌿</button>
      </div>
    </div>
  )
}

function CartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, items: ctxItems, isCartOpen, setIsCartOpen, removeFromCart, removeItem, updateQuantity, updateQty } = useCart() || {}
  if (!isCartOpen) return null
  const items = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || i.base_price || 0) * (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''
  const handleRemove = typeof removeFromCart === 'function' ? removeFromCart : removeItem
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-sm h-full bg-[#F0FDF4] border-l border-emerald-300 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-emerald-200">
          <h3 className="font-bold text-[#064E3B]">🌿 Your Bag ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="font-bold text-emerald-900">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <span className="text-4xl block">🌿</span>
              <p className="text-sm text-emerald-700 font-medium">Your bag is currently empty.</p>
              <button
                onClick={() => { setIsCartOpen(false); navigate(base ? `/shop/${base}/catalog` : '/catalog'); }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all"
              >
                Browse Botanicals
              </button>
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || it.base_price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-100">
                  <div>
                    <p className="font-bold text-sm text-[#064E3B]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600 mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-emerald-200 rounded-full px-1.5 py-0.5 bg-emerald-50">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1 text-xs font-bold text-emerald-900">-</button>
                        <span className="px-1.5 font-bold text-emerald-900">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 text-xs font-bold text-emerald-900">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#064E3B] text-sm">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => handleRemove && handleRemove(it.id)} className="text-xs text-rose-500 hover:text-rose-700 font-bold mt-1">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-emerald-200 space-y-3">
            <div className="flex justify-between font-bold text-lg text-[#064E3B]">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <button onClick={() => { setIsCartOpen(false); navigate(`/shop/${shopSlug || shop?.slug || ''}/checkout`) }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold transition-all">Checkout ➔</button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmeraldCheckout({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, items: ctxItems, clearCart } = useCart() || {}
  const { user } = useUser() || {}

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '',
    phone_number: user?.phone_number || '',
    shipping_address: ''
  })
  const [state, setState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const items = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || i.base_price || 0) * (i.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''

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
        idempotency_key: crypto.randomUUID?.() || 'x',
        shop_slug: shop?.slug || shopSlug
      })
      clearCart?.()
      const orderData = r.order || { public_id: r.order_id || 'OK' }
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
      <div className="p-8 sm:p-16 text-center max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
          <span className="text-4xl block">🎉</span>
          <h2 className="text-3xl font-light text-[#064E3B]">Order Confirmed 🌿</h2>
          <p className="text-sm text-emerald-700">Thank you for ordering with <strong>{shop?.name || 'us'}</strong>!</p>
          {done.delivery_code && (
            <div className="p-4 bg-emerald-100/80 border border-emerald-300 rounded-2xl space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">Delivery Confirmation Code</span>
              <div className="text-3xl font-black text-emerald-950 tracking-widest">{done.delivery_code}</div>
              <p className="text-xs text-emerald-700">Provide this code to the courier on delivery.</p>
            </div>
          )}
          <button onClick={() => nav(baseSlug ? `/shop/${baseSlug}` : '/')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-sm transition-all">
            Back to Store
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-8 sm:p-16 text-center max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
          <span className="text-4xl block">🌿</span>
          <h2 className="text-2xl font-light text-[#064E3B]">Your Bag is Empty</h2>
          <p className="text-sm text-emerald-700">Please add botanicals to your bag before checking out.</p>
          <button onClick={() => nav(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-sm transition-all">
            Browse Catalog
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-16 max-w-2xl">
      <h1 className="text-3xl font-light mb-2 text-[#064E3B]">Checkout</h1>
      <p className="text-sm text-emerald-700 mb-8">Fill in your delivery details to complete your order.</p>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name *" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className="w-full p-4 rounded-xl border border-emerald-300 bg-white text-sm outline-none text-[#064E3B]" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone Number *" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} className="p-4 rounded-xl border border-emerald-300 bg-white text-sm outline-none text-[#064E3B]" />
          <select value={state} onChange={e=>setState(e.target.value)} className="p-4 rounded-xl border border-emerald-300 bg-white text-sm outline-none text-[#064E3B]">{['Lagos','Abuja','Rivers','Ogun','Kano','Oyo','Enugu','Delta','Anambra'].map(s=><option key={s} value={s}>{s}</option>)}</select>
        </div>
        <textarea required placeholder="Delivery Address *" value={form.shipping_address} onChange={e=>setForm({...form,shipping_address:e.target.value})} className="w-full p-4 rounded-xl border border-emerald-300 bg-white text-sm outline-none text-[#064E3B]" />
        <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-base transition-all">
          {loading ? 'Processing Order...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

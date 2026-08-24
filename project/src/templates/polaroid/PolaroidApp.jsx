import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'

/*  POLAROID — Scattered Tilted Photo Cards on a Cork Board
    Products displayed as polaroid snapshots at random angles on a
    textured corkboard background. Handwriting-style font, tape & pin effects. */

const ROTATIONS = ['-3deg','2deg','-1deg','4deg','-2deg','3deg','1deg','-4deg','2.5deg','-1.5deg','3.5deg','-3.5deg']
const PINS = ['📌','📍','🔖','💛','']

export default function PolaroidApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen text-[#4A3728]" style={{
      fontFamily: "'Caveat', 'Comic Sans MS', cursive",
      backgroundColor: '#C4A882',
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
    }}>
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="boho" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Handwritten Desktop Header pinned to top */}
      <header className="hidden md:block sticky top-0 z-40 bg-[#C4A882]/95 backdrop-blur-sm border-b border-[#B09670]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="text-3xl font-bold text-[#4A3728]">
            📸 {shop?.name || 'Snapshots'}
          </Link>
          <div className="flex items-center gap-4" style={{ fontFamily: 'sans-serif' }}>
            <Link to="/" className="text-xs text-[#8B6F55] hover:text-[#4A3728]">← MultiShop</Link>
            <Link to={`/shop/${base}/catalog`} className="text-xs text-[#8B6F55] hover:text-[#4A3728] font-bold">All Photos</Link>
            <Link to={`/shop/${base}/about`} className="text-xs text-[#8B6F55] hover:text-[#4A3728] font-bold">About Story</Link>
            <Link to={`/shop/${base}/reviews`} className="text-xs text-[#8B6F55] hover:text-[#4A3728] font-bold">Reviews</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-[#4A3728] hover:bg-[#3A2A1C] text-[#F5E6D3] rounded-lg text-xs font-bold transition-colors">
              🛒 Bag ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<PolaroidHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<PolaroidBoard shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<PolaroidBoard shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={shopSlug} theme="boho" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="polaroid" />} />
          <Route path="checkout" element={<PolaroidCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<PolaroidHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <PolaroidModal product={quickView} onClose={() => setQuickView(null)} />}
      <PolaroidCart shop={shop} shopSlug={shopSlug} />

      <TemplateFooterView shop={shop} shopSlug={shopSlug} theme="boho" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function PolaroidHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}

  const heroHeadline = extra.hero_headline || shop?.name || 'My Snapshot Store'
  const heroSubtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'A scrapbook of beautiful things. Each item is a memory waiting to happen.'
  const heroCta = extra.hero_cta_primary || 'Browse the Board 📌'

  return (
    <div>
      {/* Scrapbook Hero — handwritten title with polaroid preview */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <div className="relative bg-[#F5E6D3] rounded-sm p-10 shadow-lg" style={{ transform: 'rotate(-0.5deg)' }}>
          {/* Tape strips */}
          <div className="absolute -top-3 left-1/4 w-20 h-6 bg-yellow-200/70 rotate-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <div className="absolute -top-3 right-1/4 w-20 h-6 bg-yellow-200/70 -rotate-2" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />

          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-7xl text-[#4A3728] leading-tight">
              {heroHeadline}
            </h1>
            <p className="text-xl text-[#8B6F55] max-w-lg mx-auto">
              {heroSubtitle}
            </p>
            <button onClick={() => navigate(`/shop/${base}/catalog`)}
              className="inline-block px-8 py-3 bg-[#4A3728] text-[#F5E6D3] rounded-lg text-sm font-bold mt-4 hover:bg-[#3A2A1C] transition-all" style={{ fontFamily: 'sans-serif' }}>
              {heroCta}
            </button>
          </div>
        </div>
      </section>

      <PolaroidBoard shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function PolaroidBoard({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.polaroid_categories_title || (extra.template_id === 'polaroid' ? extra.categories_title : null) || '📌 The Board'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Snapshots'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Snapshots'
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
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl text-[#4A3728]">{catalogTitle}</h2>
        <div className="flex items-center gap-3" style={{ fontFamily: 'sans-serif' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snapshots..."
            className="px-4 py-2 bg-[#F5E6D3] border-2 border-[#D4B896] rounded-lg text-sm outline-none w-40 sm:w-48 text-[#4A3728]" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 bg-[#F5E6D3] border-2 border-[#D4B896] rounded-lg text-xs font-bold text-[#4A3728] outline-none cursor-pointer">
            <option value="default">Featured</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8" style={{ fontFamily: 'sans-serif' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${
                selectedCategory === cat ? 'bg-[#4A3728] text-[#F5E6D3] border-[#4A3728]' : 'bg-[#F5E6D3] text-[#8B6F55] border-[#D4B896] hover:border-[#4A3728]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Scattered Polaroid Grid */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-lg text-[#8B6F55]">No snapshots found on the board 📸</p>
      ) : (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-8">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            const rotation = ROTATIONS[idx % ROTATIONS.length]
            const pin = PINS[idx % PINS.length]

            return (
              <div key={p.id || idx}
                className="relative bg-white p-2 sm:p-3 pb-12 sm:pb-16 w-full sm:w-56 shadow-md sm:shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer group"
                style={{ transform: `rotate(${rotation})` }}
                onClick={() => onQuickView?.(p)}>

                {/* Pin or tape */}
                {pin && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base sm:text-xl z-10">{pin}</span>}

                {/* Photo */}
                <div className="h-32 sm:h-52 bg-gray-100 overflow-hidden">
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl text-gray-300">📷</div>}
                </div>

                {/* Handwritten caption area */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 pt-1 sm:pt-2">
                  <h3 className="text-sm sm:text-lg text-[#4A3728] truncate leading-tight">{p.name}</h3>
                  <div className="flex items-center justify-between mt-0.5 sm:mt-1" style={{ fontFamily: 'sans-serif' }}>
                    <span className="font-bold text-xs sm:text-sm text-[#4A3728]">₦{price.toLocaleString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(p) }}
                      className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#4A3728] text-[#F5E6D3] rounded text-[9px] sm:text-[10px] font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

function PolaroidModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white p-6 pb-8 max-w-md w-full shadow-2xl relative" style={{ transform: 'rotate(1deg)' }}>
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-lg font-bold" style={{ fontFamily: 'sans-serif' }}>✕</button>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">📌</span>

        {imgSrc && <img src={imgSrc} alt={product.name} className="w-full h-64 object-cover mb-4" />}

        <h2 className="text-2xl text-[#4A3728] mb-1">{product.name}</h2>
        <p className="text-sm text-[#8B6F55] mb-3" style={{ fontFamily: 'sans-serif' }}>{product.description || 'Special snapshot piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#D4B896] py-3 mb-4" style={{ fontFamily: 'sans-serif' }}>
          <div className="text-xl font-bold text-[#4A3728]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#D4B896] rounded-md bg-[#F5E6D3] px-2 py-0.5">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-[#4A3728]">-</button>
            <span className="px-2 text-xs font-bold text-[#4A3728]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-[#4A3728]">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }}
          className="w-full py-3 bg-[#4A3728] text-[#F5E6D3] rounded-lg font-bold text-sm hover:bg-[#3A2A1C] transition-colors" style={{ fontFamily: 'sans-serif' }}>
          Add to Scrapbook Bag 📸
        </button>
      </div>
    </div>
  )
}

function PolaroidCart({ shop, shopSlug }) {
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
      <div className="w-full max-w-sm h-full bg-[#F5E6D3] p-6 flex flex-col shadow-2xl" style={{ fontFamily: 'sans-serif' }}>
        <div className="flex justify-between items-center pb-4 border-b border-[#D4B896]">
          <h3 className="font-bold text-[#4A3728]" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.4rem' }}>📸 Your Bag ({count})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#8B6F55] hover:text-[#4A3728] font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-[#8B6F55] text-center py-8">Your scrapbook bag is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm text-sm border border-[#D4B896]/40">
                  <div>
                    <p className="font-bold text-[#4A3728]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#8B6F55] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-[#D4B896] rounded bg-[#F5E6D3] px-1 py-0.5">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1 text-xs font-bold text-[#4A3728]">-</button>
                        <span className="px-1.5 font-bold text-[#4A3728]">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1 text-xs font-bold text-[#4A3728]">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#4A3728]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium mt-1">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t border-[#D4B896] space-y-3">
          <div className="flex justify-between font-bold text-lg text-[#4A3728]">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-3 bg-[#4A3728] hover:bg-[#3A2A1C] disabled:opacity-50 text-[#F5E6D3] rounded-lg font-bold transition-colors">
            Checkout 📸
          </button>
        </div>
      </div>
    </div>
  )
}

function PolaroidCheckout({ shop, shopSlug }) {
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
        <h2 className="text-3xl text-[#4A3728] mb-2">📸 Order Snapped!</h2>
        <p className="text-xs text-[#8B6F55] mb-6" style={{ fontFamily: 'sans-serif' }}>Order #{done.public_id || done.id || 'Confirmed'}</p>
        {deliveryCode && (
          <div className="bg-white border-2 border-[#D4B896] p-6 rounded-lg shadow mb-6" style={{ fontFamily: 'sans-serif' }}>
            <span className="text-xs uppercase font-bold tracking-wider text-[#8B6F55] block mb-2">Delivery Code</span>
            <div className="text-2xl font-mono font-bold text-[#4A3728] tracking-widest">{deliveryCode}</div>
            <p className="text-xs text-[#8B6F55] mt-2">Show this code to your delivery courier upon receipt.</p>
          </div>
        )}
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#4A3728] hover:bg-[#3A2A1C] text-[#F5E6D3] rounded-lg font-bold transition-colors" style={{ fontFamily: 'sans-serif' }}>
          Back to Board
        </button>
      </div>
    )
  }

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto" style={{ fontFamily: 'sans-serif' }}>
      <h1 className="text-3xl text-[#4A3728] mb-6" style={{ fontFamily: "'Caveat', cursive" }}>📸 Checkout</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 bg-white border-2 border-[#D4B896] rounded-lg text-sm outline-none focus:border-[#4A3728]" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-3 bg-white border-2 border-[#D4B896] rounded-lg text-sm outline-none focus:border-[#4A3728]" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-3 border-2 border-[#D4B896] bg-white rounded-lg text-sm outline-none focus:border-[#4A3728]">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 bg-white border-2 border-[#D4B896] rounded-lg text-sm outline-none focus:border-[#4A3728]" rows={3} />
        <button type="submit" disabled={loading || items.length === 0} className="w-full py-3 bg-[#4A3728] hover:bg-[#3A2A1C] disabled:opacity-50 text-[#F5E6D3] rounded-lg font-bold transition-colors">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

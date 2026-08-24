import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'

/*  BOHO — Masonry/Pinterest Staggered Grid + Arch-Top Cards
    Think: Etsy craft fair, handmade pottery shop, watercolor textures
    Cards have rounded-arch tops, terracotta + sage tones, organic asymmetric grid */

export default function BohoApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#5C4033] selection:bg-[#C4956A] selection:text-white" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="boho" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Bohemian Header with arch motif */}
      <header className="hidden md:block sticky top-0 z-40 bg-[#FAF5EF]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="text-center">
            <span className="text-[9px] tracking-[0.5em] uppercase text-[#C4956A] block" style={{ fontFamily: 'sans-serif' }}>handcrafted with love</span>
            <span className="text-2xl">{shop?.name || 'Bohème Artisan'}</span>
          </Link>

          <nav className="flex items-center gap-8 text-sm text-[#8B6F5C]" style={{ fontFamily: 'sans-serif' }}>
            <Link to={`/shop/${base}`} className="hover:text-[#5C4033] transition-colors">Home</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#5C4033] transition-colors">Shop All</Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#5C4033] transition-colors">About Story</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#5C4033] transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-3" style={{ fontFamily: 'sans-serif' }}>
            <Link to="/" className="text-xs text-[#C4956A] hover:text-[#5C4033]">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)} className="px-4 py-2 bg-[#5C4033] text-[#FAF5EF] rounded-full text-xs font-bold hover:bg-[#4A3B32] transition-colors">
              🧺 Basket ({cartCount})
            </button>
          </div>
        </div>
        {/* Decorative arch border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C4956A] to-transparent" />
      </header>

      <main>
        <Routes>
          <Route index element={<BohoHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<BohoCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<BohoCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={base} theme="boho" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={base} theme="boho" />} />
          <Route path="checkout" element={<BohoCheckout shop={shop} shopSlug={base} />} />
          <Route path="*" element={<BohoHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <BohoModal product={quickView} onClose={() => setQuickView(null)} />}
      <BohoCart shop={shop} shopSlug={base} />

      <TemplateFooterView shop={shop} shopSlug={base} theme="boho" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function BohoHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.boho_hero_badge || extra.hero_badge || 'HAND-THROWN IN SMALL BATCHES'
  const headline = extra.boho_hero_headline || extra.hero_headline || extra.hero_subtitle || shop?.tagline || 'Artisan Made, Soul Inspired'
  const subtitle = extra.hero_subtitle || shop?.description || 'Handmade ceramics, woven textiles, organic skincare & boho jewelry.'
  const cta = extra.boho_hero_cta_primary || extra.hero_cta_primary || 'Browse Collection ✿'
  const heroImage = extra.boho_hero_image_1 || extra.hero_image_1 || extra.banner_url || shop?.banner || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80'

  return (
    <div>
      {/* Arched Hero Section */}
      <section className="relative max-w-5xl mx-auto mt-8 px-6">
        <div className="relative overflow-hidden" style={{ borderRadius: '200px 200px 0 0' }}>
          <img src={getImageUrl(heroImage)} alt=""
            className="w-full h-[500px] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#5C4033]/80 to-transparent flex flex-col items-center justify-end pb-16 text-center">
            <span className="text-xs uppercase tracking-widest text-[#FAF5EF]/90 font-bold mb-2">{badge}</span>
            <h1 className="text-4xl sm:text-6xl text-white mb-4 leading-tight max-w-lg">
              {headline}
            </h1>
            <p className="text-sm text-white/70 max-w-sm mb-6" style={{ fontFamily: 'sans-serif' }}>
              {subtitle}
            </p>
            <button onClick={() => navigate(`/shop/${base}/catalog`)}
              className="px-8 py-3 bg-[#FAF5EF] text-[#5C4033] rounded-full text-sm font-bold hover:bg-white transition-all" style={{ fontFamily: 'sans-serif' }}>
              {cta}
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="flex flex-wrap justify-center gap-8 py-10 text-center" style={{ fontFamily: 'sans-serif' }}>
        {[{ i: '🏺', t: 'Handmade' }, { i: '🌿', t: 'Organic' }, { i: '📦', t: 'Eco-Packed' }, { i: '💛', t: 'Fair Trade' }].map((b, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{b.i}</span>
            <span className="text-xs text-[#8B6F5C]">{b.t}</span>
          </div>
        ))}
      </section>

      <BohoCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function BohoCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.boho_categories_title || (extra.template_id === 'boho' ? extra.categories_title : null) || '✿ Handpicked Treasures'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Handmade'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Handmade'
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
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl">{catalogTitle}</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search treasures..."
            className="border-b border-[#C4956A] bg-transparent py-1 text-sm outline-none w-40 sm:w-48 text-[#5C4033]" style={{ fontFamily: 'sans-serif' }} />
          <select value={sort} onChange={e => setSort(e.target.value)} className="border-b border-[#C4956A] bg-transparent py-1 text-xs outline-none text-[#5C4033]" style={{ fontFamily: 'sans-serif' }}>
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
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === cat ? 'bg-[#5C4033] text-[#FAF5EF] border-[#5C4033]' : 'bg-white text-[#8B6F5C] border-[#E8DDD2] hover:border-[#5C4033]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* MASONRY / Pinterest grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[#8B6F5C] text-sm" style={{ fontFamily: 'sans-serif' }}>No treasures found matching your search.</div>
      ) : (
        <div className="columns-2 sm:columns-2 lg:columns-3 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            const heights = ['h-48 sm:h-64', 'h-56 sm:h-72', 'h-40 sm:h-56', 'h-60 sm:h-80']
            const h = heights[idx % heights.length]

            return (
              <div key={p.id || idx} className="break-inside-avoid bg-white rounded-t-[40px] sm:rounded-t-[80px] rounded-b-xl sm:rounded-b-2xl overflow-hidden shadow-sm sm:shadow-md hover:shadow-xl transition-shadow border border-[#E8DDD2]">
                <div className={`${h} overflow-hidden cursor-pointer`} onClick={() => onQuickView?.(p)}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-[#F5EDE3] flex items-center justify-center text-3xl sm:text-4xl">🏺</div>}
                </div>
                <div className="p-3 sm:p-5 space-y-1 sm:space-y-2" style={{ fontFamily: 'sans-serif' }}>
                  <h3 className="text-sm sm:text-lg text-[#5C4033] cursor-pointer truncate" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }} onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-[10px] sm:text-xs text-[#8B6F5C] line-clamp-2 hidden sm:block">{p.description || 'Artisan handmade piece.'}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 sm:pt-2 gap-1.5">
                    <span className="text-xs sm:text-lg font-bold text-[#5C4033]">₦{price.toLocaleString()}</span>
                    <div className="flex gap-1 sm:gap-2">
                      <button onClick={() => onQuickView?.(p)} className="text-[10px] sm:text-xs text-[#C4956A] hover:underline">View</button>
                      <button onClick={() => addToCart(p)} className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 bg-[#5C4033] text-[#FAF5EF] rounded-full text-[10px] sm:text-xs font-bold hover:bg-[#4A3B32] transition-colors">+ Add</button>
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

function BohoModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FAF5EF] rounded-t-[60px] rounded-b-2xl p-8 max-w-md w-full shadow-2xl relative border border-[#E8DDD2]">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#5C4033] hover:text-[#C4956A] font-bold text-lg">✕</button>
        {imgSrc ? (
          <div className="w-full h-48 rounded-t-[40px] rounded-b-xl overflow-hidden mb-4 border border-[#E8DDD2]">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-t-[40px] rounded-b-xl bg-[#F5EDE3] flex items-center justify-center text-4xl mb-4">
            🏺
          </div>
        )}
        <h2 className="text-2xl mb-2">{product.name}</h2>
        <p className="text-sm text-[#8B6F5C] mb-4" style={{ fontFamily: 'sans-serif' }}>{product.description || 'Artisan handmade piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#E8DDD2] py-3 mb-6" style={{ fontFamily: 'sans-serif' }}>
          <div className="text-2xl font-bold text-[#5C4033]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#C4956A] rounded-full bg-white px-2 py-0.5">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 text-xs font-bold text-[#5C4033]">-</button>
            <span className="px-2 text-xs font-bold text-[#5C4033]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 text-xs font-bold text-[#5C4033]">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-[#5C4033] text-[#FAF5EF] rounded-full font-bold hover:bg-[#4A3B32] transition-colors" style={{ fontFamily: 'sans-serif' }}>Add to Basket 🧺</button>
      </div>
    </div>
  )
}

function BohoCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  const base = shopSlug || shop?.slug || ''
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-sm h-full bg-[#FAF5EF] border-l border-[#E8DDD2] p-6 flex flex-col" style={{ fontFamily: 'sans-serif' }}>
        <div className="flex justify-between items-center pb-4 border-b border-[#E8DDD2]">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'DM Serif Display', serif" }}>🧺 Your Basket ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#5C4033] hover:text-[#C4956A] font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-[#8B6F5C] text-sm">Your basket is currently empty.</div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-[#E8DDD2]">
                  <div>
                    <p className="font-bold text-sm text-[#5C4033]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#8B6F5C] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#E8DDD2] rounded-full bg-[#FAF5EF] px-1.5 py-0.5">
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty - 1)} className="px-1 text-xs font-bold text-[#5C4033]">-</button>
                        <span className="px-1.5 font-bold text-[#5C4033]">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty + 1)} className="px-1 text-xs font-bold text-[#5C4033]">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#5C4033]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id || it.product_id || it.product?.id)} className="text-xs text-rose-500 hover:text-rose-700 mt-1 block font-medium">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t border-[#E8DDD2] space-y-3">
          <div className="flex justify-between font-bold text-lg text-[#5C4033]">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className={`w-full py-4 bg-[#5C4033] text-[#FAF5EF] rounded-full font-bold transition-colors ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4A3B32]'}`}
          >
            Checkout ✿
          </button>
        </div>
      </div>
    </div>
  )
}

function BohoCheckout({ shop, shopSlug }) {
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
      setDone(r.order || r || { public_id: 'OK' })
    } catch {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="p-16 text-center max-w-xl mx-auto">
      <h2 className="text-3xl mb-4 text-[#5C4033]">✿ Order Confirmed!</h2>
      <p className="text-sm text-[#8B6F5C] mb-6" style={{ fontFamily: 'sans-serif' }}>Thank you for supporting artisan work. Your order has been placed.</p>
      {done.delivery_code && (
        <div className="text-2xl font-bold bg-white text-[#5C4033] p-4 rounded-xl mb-6 border border-[#E8DDD2]">
          Delivery Code: {done.delivery_code}
        </div>
      )}
      <button onClick={() => nav(`/shop/${base}`)} className="px-8 py-3 bg-[#5C4033] text-[#FAF5EF] rounded-full font-bold hover:bg-[#4A3B32]" style={{ fontFamily: 'sans-serif' }}>
        Back to Store
      </button>
    </div>
  )

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-3xl mb-8 text-[#5C4033]">✿ Checkout</h1>
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E8DDD2] p-8 space-y-4" style={{ fontFamily: 'sans-serif' }}>
          <p className="text-[#8B6F5C] text-sm">Your basket is empty.</p>
          <button onClick={() => nav(`/shop/${base}/catalog`)} className="px-6 py-3 bg-[#5C4033] text-[#FAF5EF] rounded-full text-xs font-bold hover:bg-[#4A3B32]">
            Browse Treasures
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" style={{ fontFamily: 'sans-serif' }}>
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 rounded-xl border border-[#E8DDD2] bg-white text-sm outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 rounded-xl border border-[#E8DDD2] bg-white text-sm outline-none" />
            <select value={state} onChange={e => setState(e.target.value)} className="p-4 rounded-xl border border-[#E8DDD2] bg-white text-sm outline-none">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 rounded-xl border border-[#E8DDD2] bg-white text-sm outline-none" />
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#5C4033] text-[#FAF5EF] rounded-full font-bold hover:bg-[#4A3B32] transition-colors">
            {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
          </button>
        </form>
      )}
    </div>
  )
}

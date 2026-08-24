import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'

/*  ROYAL — Cinematic Full-Width Hero + Horizontal-Scroll Catalog
    Think: Netflix-style horizontal carousels, gold accent borders, velvet background
    Each product row scrolls horizontally like a royal gallery */

export default function RoyalApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#1A1019] text-[#F5E6D3] font-serif selection:bg-[#C9A84C] selection:text-black">
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="royal" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Royal Crown Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-[#1A1019]/95 backdrop-blur-md border-b border-[#C9A84C]/30">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="flex items-center gap-4">
            <span className="text-[#C9A84C] text-2xl">♛</span>
            <div>
              <span className="text-[9px] tracking-[0.5em] uppercase text-[#C9A84C]/60 block">Royal Collection</span>
              <span className="text-xl tracking-widest uppercase text-[#F5E6D3]">{shop?.name || 'ROYAL MAISON'}</span>
            </div>
          </Link>

          <nav className="flex items-center gap-8 text-xs tracking-[0.3em] uppercase text-[#C9A84C]/60">
            <Link to={`/shop/${base}`} className="hover:text-[#C9A84C] transition-colors">Throne</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#C9A84C] transition-colors">Gallery</Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#C9A84C]">About</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#C9A84C]">Reviews</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-[#C9A84C]/50 hover:text-[#C9A84C] tracking-wider">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-[#1A1019] text-xs font-bold uppercase tracking-wider rounded-none hover:from-[#D4B55C]">
              ♛ Bag ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<RoyalHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<RoyalGallery products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<RoyalGallery products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={base} theme="royal" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={base} theme="royal" />} />
          <Route path="checkout" element={<RoyalCheckout shop={shop} shopSlug={base} />} />
          <Route path="*" element={<RoyalHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <RoyalModal product={quickView} onClose={() => setQuickView(null)} />}
      <RoyalCart shop={shop} shopSlug={base} />

      <TemplateFooterView shop={shop} shopSlug={base} theme="royal" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function RoyalHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.royal_hero_badge || extra.hero_badge || 'HAUTE HORLOGERIE & JOAILLERIE'
  const headline = extra.royal_hero_headline || extra.hero_headline || extra.hero_subtitle || shop?.tagline || 'Where Elegance Meets Eternity'
  const subtitle = extra.hero_subtitle || shop?.description || 'Hand-crafted luxury goods, rare collectibles, and bespoke pieces for the discerning connoisseur.'
  const cta = extra.royal_hero_cta_primary || extra.hero_cta_primary || 'Explore the Gallery ♛'
  const heroImage = extra.royal_hero_image_1 || extra.hero_image_1 || extra.banner_url || shop?.banner || 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80'

  return (
    <div>
      {/* Cinematic Wide Hero */}
      <section className="relative h-[80vh] overflow-hidden">
        <img src={getImageUrl(heroImage)} alt=""
          className="w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1019] via-transparent to-[#1A1019]/50" />
        <div className="absolute inset-0 flex flex-col justify-center px-12 sm:px-24 max-w-[800px]">
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C] block mb-3">{badge}</span>
          <div className="w-20 h-px bg-[#C9A84C] mb-6" />
          <h1 className="text-5xl sm:text-7xl font-light leading-tight mb-6 text-white">
            {headline}
          </h1>
          <p className="text-sm text-[#F5E6D3]/70 max-w-md leading-relaxed mb-8">
            {subtitle}
          </p>
          <button onClick={() => navigate(`/shop/${base}/catalog`)}
            className="self-start px-10 py-4 border-2 border-[#C9A84C] text-[#C9A84C] text-xs tracking-[0.3em] uppercase hover:bg-[#C9A84C] hover:text-[#1A1019] transition-all duration-500">
            {cta}
          </button>
        </div>
      </section>

      <RoyalGallery shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function RoyalGallery({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.royal_categories_title || (extra.template_id === 'royal' ? extra.categories_title : null) || 'The Royal Gallery'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'ROYAL').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'ROYAL').toUpperCase()
      const matchCat = selectedCategory === 'ALL' || cat === selectedCategory
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

    if (sort === 'low') list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    if (sort === 'high') list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    return list
  }, [products, search, selectedCategory, sort])

  // Split products into horizontal scroll rows of 4
  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < filtered.length; i += 4) r.push(filtered.slice(i, i + 4))
    return r
  }, [filtered])

  return (
    <section className="py-16 space-y-12">
      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 flex flex-col sm:flex-row justify-between items-baseline gap-4 border-b border-[#C9A84C]/20 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C]/60 block mb-1">Maison Collection</span>
          <h2 className="text-2xl font-light text-[#F5E6D3] tracking-widest uppercase">{catalogTitle}</h2>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH GALLERY..."
            className="bg-[#2A1F2A] border border-[#C9A84C]/30 text-xs px-4 py-2 text-[#F5E6D3] outline-none tracking-widest uppercase w-40 sm:w-64"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#2A1F2A] border border-[#C9A84C]/30 text-xs px-3 py-2 text-[#C9A84C] outline-none tracking-widest uppercase cursor-pointer"
          >
            <option value="default">FEATURED</option>
            <option value="low">PRICE: LOW → HIGH</option>
            <option value="high">PRICE: HIGH → LOW</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="max-w-[1600px] mx-auto px-8 sm:px-12 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C9A84C] text-[#1A1019] border-[#C9A84C] font-bold'
                  : 'bg-transparent text-[#C9A84C]/70 border-[#C9A84C]/30 hover:border-[#C9A84C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[#C9A84C]/50 text-xs tracking-[0.3em] uppercase">No royal items found matching criteria.</div>
      ) : (
        rows.map((row, ri) => (
          <div key={ri}>
            <div className="max-w-[1600px] mx-auto px-8 sm:px-12 mb-6 flex items-center gap-4">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <h3 className="text-xs tracking-[0.4em] uppercase text-[#C9A84C]/60">Collection {ri + 1}</h3>
            </div>

            {/* Horizontal scroll gallery row */}
            <div className="flex gap-6 overflow-x-auto px-8 sm:px-12 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {row.map((p, idx) => {
                const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
                const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
                const price = Number(p.base_price || p.price || 0)

                return (
                  <div key={p.id || idx} className="min-w-[300px] sm:min-w-[320px] max-w-[320px] snap-start group flex-shrink-0">
                    <div className="relative h-80 bg-[#2A1F2A] overflow-hidden border border-[#C9A84C]/20 hover:border-[#C9A84C] transition-colors duration-500 cursor-pointer" onClick={() => onQuickView?.(p)}>
                      {imgSrc
                        ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl text-[#C9A84C]">♛</div>}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1019] p-4">
                        <button onClick={(e) => { e.stopPropagation(); onQuickView?.(p); }} className="text-[10px] text-[#C9A84C] tracking-widest uppercase hover:underline">Quick View</button>
                      </div>
                    </div>
                    <div className="pt-4 space-y-1">
                      <h4 className="font-light text-lg text-[#F5E6D3] truncate cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-[#C9A84C] font-bold">₦{price.toLocaleString()}</span>
                        <button onClick={() => addToCart(p)} className="text-xs text-[#C9A84C] border border-[#C9A84C]/40 px-3 py-1.5 hover:bg-[#C9A84C] hover:text-[#1A1019] transition-all">
                          + Acquire
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </section>
  )
}

function RoyalModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#1A1019] border border-[#C9A84C]/40 p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#C9A84C] hover:text-white font-bold text-lg">✕</button>
        {imgSrc && (
          <div className="w-full h-52 mb-4 overflow-hidden border border-[#C9A84C]/20">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="w-12 h-px bg-[#C9A84C] mb-3" />
        <h2 className="text-2xl font-light mb-1 text-[#F5E6D3]">{product.name}</h2>
        <p className="text-sm text-[#F5E6D3]/60 mb-4">{product.description || 'Exclusive handcrafted piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#C9A84C]/20 py-3 mb-6">
          <div className="text-2xl text-[#C9A84C] font-bold">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#C9A84C]/40 bg-[#2A1F2A]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-xs text-[#C9A84C] font-bold hover:bg-[#C9A84C]/20">-</button>
            <span className="px-3 text-xs text-[#F5E6D3] font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-xs text-[#C9A84C] font-bold hover:bg-[#C9A84C]/20">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-[#1A1019] font-bold uppercase tracking-wider hover:from-[#D4B55C] transition-all">Acquire ♛</button>
      </div>
    </div>
  )
}

function RoyalCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  const base = shopSlug || shop?.slug || ''
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-md h-full bg-[#1A1019] border-l border-[#C9A84C]/30 p-8 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-[#C9A84C]/20 text-xs tracking-widest uppercase">
          <h3>♛ Royal Cart ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#C9A84C] hover:text-white font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-[#C9A84C]/50 text-xs tracking-widest uppercase">Your bag is empty.</div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 border border-[#C9A84C]/10 text-xs bg-[#2A1F2A]/50">
                  <div>
                    <p className="font-bold text-sm text-[#F5E6D3]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-[#C9A84C]/70 text-[10px] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#C9A84C]/30 bg-[#1A1019]">
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty - 1)} className="px-1.5 py-0.5 text-xs text-[#C9A84C] font-bold hover:bg-[#C9A84C]/20">-</button>
                        <span className="px-2 text-xs text-[#F5E6D3] font-bold">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty + 1)} className="px-1.5 py-0.5 text-xs text-[#C9A84C] font-bold hover:bg-[#C9A84C]/20">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#C9A84C] font-bold">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id || it.product_id || it.product?.id)} className="text-[#C9A84C]/60 hover:text-red-400 mt-1 block text-[11px]">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-[#C9A84C]/20 space-y-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-[#C9A84C]">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className={`w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-[#1A1019] font-bold uppercase tracking-wider ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#D4B55C]'}`}
          >
            Checkout ♛
          </button>
        </div>
      </div>
    </div>
  )
}

function RoyalCheckout({ shop, shopSlug }) {
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
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="p-16 text-center max-w-xl mx-auto">
      <h2 className="text-3xl font-light mb-4">♛ Order Confirmed</h2>
      <p className="text-sm text-[#F5E6D3]/70 mb-6">Thank you for your acquisition. Your order has been placed successfully.</p>
      {done.delivery_code && (
        <div className="text-2xl font-bold text-[#C9A84C] bg-[#2A1F2A] border border-[#C9A84C]/30 p-4 mb-6">
          Delivery Code: {done.delivery_code}
        </div>
      )}
      <button onClick={() => nav(`/shop/${base}`)} className="px-8 py-3 bg-[#C9A84C] text-[#1A1019] font-bold uppercase tracking-wider hover:bg-[#D4B55C] transition-all">
        Return to Store
      </button>
    </div>
  )

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-light mb-8">♛ Royal Checkout</h1>
      {items.length === 0 ? (
        <div className="text-center py-12 border border-[#C9A84C]/20 p-8 space-y-4">
          <p className="text-[#C9A84C]/60 text-sm">Your shopping bag is empty.</p>
          <button onClick={() => nav(`/shop/${base}/catalog`)} className="px-6 py-3 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-wider hover:bg-[#C9A84C] hover:text-[#1A1019]">
            Explore Collection
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 bg-[#2A1F2A] border border-[#C9A84C]/20 text-sm text-[#F5E6D3] outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 bg-[#2A1F2A] border border-[#C9A84C]/20 text-sm text-[#F5E6D3] outline-none" />
            <select value={state} onChange={e => setState(e.target.value)} className="p-4 bg-[#2A1F2A] border border-[#C9A84C]/20 text-sm text-[#F5E6D3] outline-none">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 bg-[#2A1F2A] border border-[#C9A84C]/20 text-sm text-[#F5E6D3] outline-none" />
          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-[#1A1019] font-bold uppercase tracking-wider hover:from-[#D4B55C]">
            {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
          </button>
        </form>
      )}
    </div>
  )
}

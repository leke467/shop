import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import BrandLogoRenderer from '../../components/shop/BrandLogoRenderer'

/*  ARTISAN — Newspaper / Broadsheet Editorial Column Layout
    Think: NYT Cooking section, print broadsheet with justified columns
    Products displayed in newspaper-column layout with drop caps and rule lines */

export default function ArtisanApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = cart?.items || cart || []
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#2D2D2D]" style={{ fontFamily: "'Lora', 'Georgia', serif" }}>
      {/* Broadsheet Header */}
      <header className="border-b-2 border-[#2D2D2D] bg-[#FBF8F0]">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <Link to="/" className="text-[10px] tracking-[0.4em] uppercase text-[#8B7355] block mb-1" style={{ fontFamily: 'sans-serif' }}>← Back to MultiShop</Link>
          <Link to={`/shop/${base}`}>
            <div className="border-y-2 border-[#2D2D2D] py-3 mt-2 mb-2 flex justify-center">
              <BrandLogoRenderer
                shop={shop}
                accentColor="#8B7355"
                textClassName="text-3xl sm:text-5xl font-bold tracking-tight uppercase"
                textStyle={{ fontFamily: "'Playfair Display', serif" }}
                logoClassName="w-10 h-10 rounded-full"
              />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-6 text-[10px] tracking-[0.3em] uppercase text-[#8B7355]" style={{ fontFamily: 'sans-serif' }}>
            <Link to={`/shop/${base}`} className="hover:text-[#2D2D2D] transition-colors">Front Page</Link>
            <span>·</span>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#2D2D2D] transition-colors">Classifieds</Link>
            <span>·</span>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#2D2D2D] transition-colors">Reviews</Link>
            <span>·</span>
            <button onClick={() => setIsCartOpen(true)} className="hover:text-[#2D2D2D] transition-colors">Basket ({cartCount})</button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<ArtisanHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<ArtisanCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<ArtisanCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="default" />} />
          <Route path="checkout" element={<ArtisanCheckout shop={shop} shopSlug={shopSlug || base} />} />
          <Route path="*" element={<ArtisanHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <ArtisanModal product={quickView} onClose={() => setQuickView(null)} />}
      <ArtisanCart shop={shop} shopSlug={shopSlug || base} />

      <footer className="border-t-2 border-[#2D2D2D] py-8 text-center text-xs text-[#8B7355]" style={{ fontFamily: 'sans-serif' }}>
        THE ARTISAN GAZETTE · Est. {new Date().getFullYear()} · {shop?.name} · All Rights Reserved
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function ArtisanHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const featured = products.slice(0, 2)

  return (
    <div>
      {/* Front Page Layout — Newspaper grid */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-0 border-b border-[#D4C5A9]">
        {/* Lead story — large left column */}
        <div className="md:col-span-2 md:border-r border-[#D4C5A9] md:pr-8 pb-8">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#8B7355] block mb-4" style={{ fontFamily: 'sans-serif' }}>LEAD STORY</span>
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {shop?.tagline || 'Discover Handcrafted Perfection in Every Detail'}
          </h2>
          <div className="h-64 sm:h-80 bg-[#E8E0D0] overflow-hidden mb-4">
            <img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80" alt=""
              className="w-full h-full object-cover" />
          </div>
          <p className="text-sm leading-relaxed text-[#555] max-w-xl" style={{ fontFamily: 'sans-serif', textAlign: 'justify' }}>
            <span className="text-4xl font-bold float-left mr-2 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {(shop?.description || 'Each')[0]}
            </span>
            {(shop?.description || 'Each piece in our collection is hand-crafted by master artisans using traditional techniques passed down through generations. We believe in slow craft, sustainable materials, and timeless design.').slice(1)}
          </p>
          <button onClick={() => navigate(`/shop/${base}/catalog`)}
            className="mt-6 px-6 py-3 bg-[#2D2D2D] text-[#FBF8F0] text-xs tracking-[0.2em] uppercase hover:bg-[#1A1A1A] transition-all" style={{ fontFamily: 'sans-serif' }}>
            Browse Classifieds →
          </button>
        </div>

        {/* Right sidebar — quick featured items */}
        <div className="md:pl-8 space-y-6 pt-6 md:pt-0">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#8B7355] block" style={{ fontFamily: 'sans-serif' }}>FEATURED ITEMS</span>
          {featured.map((p, idx) => {
            const price = Number(p.base_price || p.price || 0)
            return (
              <div key={p.id || idx} className="border-b border-[#D4C5A9] pb-4 cursor-pointer" onClick={() => onQuickView?.(p)}>
                <h4 className="font-bold text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{p.name}</h4>
                <p className="text-xs text-[#8B7355] line-clamp-2 mb-1" style={{ fontFamily: 'sans-serif' }}>{p.description || 'Artisan piece.'}</p>
                <span className="font-bold text-sm">₦{price.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </section>

      <ArtisanCatalog products={products} onQuickView={onQuickView} />
    </div>
  )
}

function ArtisanCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category?.name || p.category_name || p.category || 'Classifieds'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = p.category?.name || p.category_name || p.category || 'Classifieds'
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
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 border-b border-[#D4C5A9] pb-3 gap-4">
        <h2 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>Classifieds & Listings</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classifieds..."
            className="border-b border-[#D4C5A9] bg-transparent py-1 text-xs outline-none w-40 sm:w-48 text-[#2D2D2D]" style={{ fontFamily: 'sans-serif' }} />
          <select value={sort} onChange={e => setSort(e.target.value)} className="border-b border-[#D4C5A9] bg-transparent py-1 text-xs outline-none text-[#2D2D2D]" style={{ fontFamily: 'sans-serif' }}>
            <option value="default">Relevance</option>
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
              className={`px-3 py-1 text-xs tracking-wider uppercase border transition-all ${
                selectedCategory === cat ? 'bg-[#2D2D2D] text-[#FBF8F0] border-[#2D2D2D]' : 'bg-transparent text-[#8B7355] border-[#D4C5A9] hover:border-[#2D2D2D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Newspaper column layout — 2 or 3 columns like a broadsheet */}
      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm text-[#8B7355]" style={{ fontFamily: 'sans-serif' }}>No classifieds match your criteria.</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8" style={{ columnRule: '1px solid #D4C5A9' }}>
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div key={p.id || idx} className="break-inside-avoid mb-8 border-b border-[#D4C5A9] pb-6">
                {imgSrc && (
                  <div className="h-48 overflow-hidden mb-3 bg-[#E8E0D0] cursor-pointer" onClick={() => onQuickView?.(p)}>
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover sepia hover:sepia-0 transition-all duration-500" />
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1 cursor-pointer" style={{ fontFamily: "'Playfair Display', serif" }} onClick={() => onQuickView?.(p)}>{p.name}</h3>
                <p className="text-xs text-[#555] mb-2 leading-relaxed" style={{ fontFamily: 'sans-serif', textAlign: 'justify' }}>
                  {p.description || 'A finely crafted artisan piece, made with care and attention to detail.'}
                </p>
                <div className="flex items-center justify-between" style={{ fontFamily: 'sans-serif' }}>
                  <span className="font-bold text-lg text-[#2D2D2D]">₦{price.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onQuickView?.(p)} className="text-[10px] text-[#8B7355] underline uppercase hover:text-[#2D2D2D]">Details</button>
                    <button onClick={() => addToCart(p)} className="px-3 py-1.5 bg-[#2D2D2D] text-[#FBF8F0] text-[10px] uppercase tracking-wider hover:bg-[#1A1A1A] transition-all">+ Add</button>
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

function ArtisanModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FBF8F0] border-2 border-[#2D2D2D] p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl text-[#2D2D2D] hover:opacity-70">✕</button>
        {imgSrc && (
          <div className="h-56 overflow-hidden mb-4 bg-[#E8E0D0] border border-[#D4C5A9]">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover sepia" />
          </div>
        )}
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h2>
        <p className="text-sm text-[#555] mb-4 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>{product.description || 'Finely crafted artisan piece, made with care and attention to detail.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#D4C5A9] py-3 mb-6" style={{ fontFamily: 'sans-serif' }}>
          <div className="text-2xl font-bold text-[#2D2D2D]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#2D2D2D]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2.5 py-1 text-xs hover:bg-[#E8E0D0]">-</button>
            <span className="px-3 text-xs font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2.5 py-1 text-xs hover:bg-[#E8E0D0]">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-3.5 bg-[#2D2D2D] text-[#FBF8F0] font-bold text-sm uppercase tracking-wider hover:bg-[#1A1A1A] transition-all" style={{ fontFamily: 'sans-serif' }}>Add to Basket 🧺</button>
      </div>
    </div>
  )
}

function ArtisanCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-md h-full bg-[#FBF8F0] border-l-2 border-[#2D2D2D] p-6 flex flex-col" style={{ fontFamily: 'sans-serif' }}>
        <div className="flex justify-between items-center pb-4 border-b-2 border-[#2D2D2D]">
          <h3 className="font-bold text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Your Basket ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#2D2D2D] hover:opacity-70 font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#8B7355]">Your basket is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center pb-3 border-b border-[#D4C5A9] text-sm">
                  <div>
                    <p className="font-bold text-[#2D2D2D]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#8B7355] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#D4C5A9] rounded">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 text-xs hover:bg-[#E8E0D0]">-</button>
                        <span className="px-2 font-bold">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 text-xs hover:bg-[#E8E0D0]">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2D2D2D]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-xs text-rose-600 hover:text-rose-800 font-semibold mt-1">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t-2 border-[#2D2D2D] space-y-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-[#2D2D2D] disabled:opacity-50 text-[#FBF8F0] font-bold uppercase tracking-wider text-sm hover:bg-[#1A1A1A] transition-all">
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}

function ArtisanCheckout({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const base = shopSlug || shop?.slug || ''
  const items = cart?.items || cart || []
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
      setDone(r.order || r || { public_id: 'OK' })
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="p-16 text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Order Confirmed</h2>
        {done.delivery_code && (
          <div className="text-xl font-bold bg-[#E8E0D0] border border-[#D4C5A9] p-4">
            Delivery Code: {done.delivery_code}
          </div>
        )}
        <p className="text-xs text-[#8B7355]" style={{ fontFamily: 'sans-serif' }}>Your order has been placed with the artisan guild. Keep your delivery code safe.</p>
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#2D2D2D] text-[#FBF8F0] font-bold text-xs uppercase hover:bg-[#1A1A1A] transition-all" style={{ fontFamily: 'sans-serif' }}>
          Return to Gazette
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Checkout</h1>
      <form onSubmit={submit} className="space-y-4" style={{ fontFamily: 'sans-serif' }}>
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 border border-[#D4C5A9] bg-white text-sm outline-none" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 border border-[#D4C5A9] bg-white text-sm outline-none" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 border border-[#D4C5A9] bg-white text-sm outline-none">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Kaduna', 'Delta'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 border border-[#D4C5A9] bg-white text-sm outline-none" />
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#2D2D2D] disabled:opacity-50 text-[#FBF8F0] font-bold uppercase tracking-wider text-sm hover:bg-[#1A1A1A] transition-all">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

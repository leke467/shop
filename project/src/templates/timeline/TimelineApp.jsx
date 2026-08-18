import { useState, useMemo, useCallback } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

/*  TIMELINE → GALLERY MUSEUM — One-at-a-time Art Exhibition
    Products shown as framed art on dark gallery walls.
    Large prev/next arrows to walk through the exhibition.
    Think: MoMA online collection, art auction house */

export default function TimelineApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen, itemCount } = useCart()
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = itemCount !== undefined ? itemCount : cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E8E4DE]" style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}>
      {/* Museum Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to={`/shop/${base}`} className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.5em] uppercase text-[#8A7E72]" style={{ fontFamily: 'sans-serif' }}>Gallery</span>
            <span className="text-xl font-light tracking-wider">{shop?.name || 'THE GALLERY'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.3em] uppercase text-[#6B6460]" style={{ fontFamily: 'sans-serif' }}>
            <Link to={`/shop/${base}`} className="hover:text-[#E8E4DE] transition-colors">Exhibition</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#E8E4DE] transition-colors">Collection</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#E8E4DE] transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-4" style={{ fontFamily: 'sans-serif' }}>
            <Link to="/" className="hidden sm:block text-[10px] text-[#6B6460] hover:text-[#E8E4DE] tracking-wider">← MultiShop</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 border border-[#444] text-[11px] tracking-wider uppercase hover:bg-[#333] transition-all">
              Acquire ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <Routes>
          <Route index element={<GalleryExhibition shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<GalleryCollection products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<GalleryCollection products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="dark" />} />
          <Route path="checkout" element={<GalleryCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<GalleryExhibition shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <GalleryModal product={quickView} onClose={() => setQuickView(null)} />}
      <GalleryCart shop={shop} shopSlug={shopSlug} />

      <footer className="border-t border-[#333] py-8 text-center text-[10px] tracking-[0.4em] uppercase text-[#4A4540]" style={{ fontFamily: 'sans-serif' }}>
        {shop?.name || 'The Gallery'} · Curated Exhibition · © {new Date().getFullYear()}
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function GalleryExhibition({ shop, products, base, onQuickView }) {
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(-1) // -1 = intro screen

  const prev = useCallback(() => setCurrent(c => Math.max(-1, c - 1)), [])
  const next = useCallback(() => setCurrent(c => Math.min(products.length - 1, c + 1)), [products.length])

  // Intro screen
  if (current === -1) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-8 py-12 text-center">
        <span className="text-[10px] tracking-[0.6em] uppercase text-[#6B6460] block mb-6" style={{ fontFamily: 'sans-serif' }}>
          Now Showing · {products.length} Pieces
        </span>
        <h1 className="text-5xl sm:text-7xl font-light tracking-wide mb-6 max-w-3xl leading-tight">
          {shop?.tagline || `${shop?.name || 'The Gallery'} Exhibition`}
        </h1>
        <p className="text-sm text-[#8A7E72] max-w-lg mb-10" style={{ fontFamily: 'sans-serif' }}>
          {shop?.description || 'Walk through our curated exhibition. Each piece is presented individually for your contemplation.'}
        </p>
        <div className="flex gap-4" style={{ fontFamily: 'sans-serif' }}>
          <button onClick={() => setCurrent(0)}
            className="px-8 py-4 bg-[#E8E4DE] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">
            Enter Exhibition →
          </button>
          <button onClick={() => navigate(`/shop/${base}/catalog`)}
            className="px-8 py-4 border border-[#444] text-xs uppercase tracking-widest hover:bg-[#333] transition-all">
            View All
          </button>
        </div>
      </div>
    )
  }

  const p = products[current]
  if (!p) return null
  const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  const price = Number(p.base_price || p.price || 0)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Prev Arrow */}
      <button onClick={prev}
        className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 border border-[#444] rounded-full flex items-center justify-center text-xl text-[#6B6460] hover:text-white hover:border-white transition-all z-10 bg-[#1A1A1A]/80 backdrop-blur-xs"
        style={{ fontFamily: 'sans-serif' }}>
        ←
      </button>

      {/* Next Arrow */}
      <button onClick={next} disabled={current >= products.length - 1}
        className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 border border-[#444] rounded-full flex items-center justify-center text-xl text-[#6B6460] hover:text-white hover:border-white transition-all z-10 disabled:opacity-30 bg-[#1A1A1A]/80 backdrop-blur-xs"
        style={{ fontFamily: 'sans-serif' }}>
        →
      </button>

      {/* Artwork Display */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 sm:px-16 lg:px-20">
        {/* The "framed" artwork */}
        <div className="relative cursor-pointer" onClick={() => onQuickView?.(p)}>
          <div className="bg-[#0F0F0F] p-4 shadow-2xl" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 1px rgba(255,255,255,0.1)' }}>
            <div className="aspect-square bg-[#222] overflow-hidden">
              {imgSrc
                ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl text-[#333]">🖼</div>}
            </div>
          </div>
          {/* Museum label */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-[#333] px-4 py-1.5 text-[9px] tracking-widest text-[#6B6460] uppercase whitespace-nowrap" style={{ fontFamily: 'sans-serif' }}>
            Piece {current + 1} of {products.length}
          </div>
        </div>

        {/* Artwork Information */}
        <div className="space-y-6">
          <div>
            <span className="text-[9px] tracking-[0.5em] uppercase text-[#6B6460] block mb-2" style={{ fontFamily: 'sans-serif' }}>
              {p.category?.name || 'Exhibition Piece'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-wide leading-tight cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h2>
          </div>

          <div className="w-16 h-px bg-[#444]" />

          <p className="text-sm text-[#8A7E72] leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
            {p.description || 'A carefully curated piece from our collection, selected for its exceptional quality and artistry.'}
          </p>

          <div className="space-y-4 pt-4 border-t border-[#333]" style={{ fontFamily: 'sans-serif' }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] tracking-widest uppercase text-[#6B6460]">Valuation</span>
              <span className="text-2xl font-light text-[#E8E4DE]">₦{price.toLocaleString()}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onQuickView?.(p)}
                className="px-4 py-4 border border-[#444] text-[11px] uppercase tracking-widest hover:bg-[#333] transition-all">
                Inspect 🔍
              </button>
              <button onClick={() => addToCart(p)}
                className="flex-1 py-4 bg-[#E8E4DE] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">
                Acquire This Piece
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {products.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-[#E8E4DE] scale-125' : 'bg-[#444] hover:bg-[#666]'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GalleryCollection({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'EXHIBITION').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'EXHIBITION').toUpperCase()
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
    <div className="max-w-6xl mx-auto px-8 py-16">
      <div className="flex flex-col sm:flex-row justify-between items-baseline mb-8 border-b border-[#333] pb-6 gap-4">
        <div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#6B6460] block mb-1" style={{ fontFamily: 'sans-serif' }}>Curated Index</span>
          <h1 className="text-3xl font-light tracking-wider">Full Collection</h1>
        </div>
        <div className="flex items-center gap-4" style={{ fontFamily: 'sans-serif' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search collection..."
            className="bg-transparent border-b border-[#444] py-1 text-xs outline-none w-36 sm:w-48 text-[#E8E4DE] uppercase tracking-wider" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-[#1A1A1A] border-b border-[#444] py-1 text-xs outline-none text-[#8A7E72] uppercase tracking-wider cursor-pointer">
            <option value="default">Default</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-12" style={{ fontFamily: 'sans-serif' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-all ${
                selectedCategory === cat
                  ? 'bg-[#E8E4DE] text-[#1A1A1A] border-[#E8E4DE] font-bold'
                  : 'bg-transparent text-[#6B6460] border-[#333] hover:border-[#666]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 2-column gallery grid with generous spacing */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[#6B6460] text-sm" style={{ fontFamily: 'sans-serif' }}>No exhibition pieces found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)
            return (
              <div key={p.id || idx} className="group">
                <div className="bg-[#0F0F0F] p-3 shadow-xl mb-4 cursor-pointer" style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)' }} onClick={() => onQuickView?.(p)}>
                  <div className="aspect-[4/3] bg-[#222] overflow-hidden">
                    {imgSrc
                      ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl text-[#333]">🖼</div>}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[9px] tracking-[0.4em] uppercase text-[#6B6460] block mb-1" style={{ fontFamily: 'sans-serif' }}>{p.category?.name || 'Piece'}</span>
                    <h3 className="text-xl font-light tracking-wide cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  </div>
                  <div className="text-right flex-shrink-0" style={{ fontFamily: 'sans-serif' }}>
                    <span className="text-lg font-light block">₦{price.toLocaleString()}</span>
                    <button onClick={() => addToCart(p)}
                      className="text-[10px] text-[#6B6460] hover:text-[#E8E4DE] uppercase tracking-wider mt-1 transition-colors">
                      + Acquire
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GalleryModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#1A1A1A] border border-[#333] p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8A7E72] hover:text-white font-bold text-lg" style={{ fontFamily: 'sans-serif' }}>✕</button>
        <span className="text-[10px] tracking-[0.5em] uppercase text-[#6B6460] block mb-3" style={{ fontFamily: 'sans-serif' }}>Exhibition Inspection</span>

        {imgSrc && (
          <div className="w-full h-56 bg-[#0F0F0F] p-2 mb-4 border border-[#2A2A2A]">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-2xl font-light tracking-wide text-[#E8E4DE] mb-1">{product.name}</h2>
        <p className="text-xs text-[#8A7E72] leading-relaxed mb-4" style={{ fontFamily: 'sans-serif' }}>{product.description || 'Curated artistic piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#333] py-3 mb-6" style={{ fontFamily: 'sans-serif' }}>
          <div className="text-xl font-light text-[#E8E4DE]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#444]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-xs text-[#8A7E72] hover:text-white hover:bg-[#333]">-</button>
            <span className="px-3 text-xs font-bold text-[#E8E4DE]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-xs text-[#8A7E72] hover:text-white hover:bg-[#333]">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }}
          className="w-full py-4 bg-[#E8E4DE] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all" style={{ fontFamily: 'sans-serif' }}>
          Acquire This Piece
        </button>
      </div>
    </div>
  )
}

function GalleryCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-[#1A1A1A] border-l border-[#333] p-8 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-[#333] text-[11px] tracking-widest uppercase" style={{ fontFamily: 'sans-serif' }}>
          <h3>Acquisitions ({count})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#6B6460] hover:text-[#E8E4DE] font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-xs text-[#6B6460] text-center py-8" style={{ fontFamily: 'sans-serif' }}>No pieces selected for acquisition.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center pb-4 border-b border-[#2A2A2A]" style={{ fontFamily: 'sans-serif' }}>
                  <div>
                    <p className="font-bold text-sm text-[#E8E4DE]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#8A7E72] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#444]">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 text-xs text-[#8A7E72] hover:text-white">-</button>
                        <span className="px-2 text-xs font-bold text-[#E8E4DE]">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 text-xs text-[#8A7E72] hover:text-white">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-light text-[#E8E4DE]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-[10px] text-[#6B6460] hover:text-red-400 mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-[#333] space-y-4" style={{ fontFamily: 'sans-serif' }}>
          <div className="flex justify-between text-lg font-light">
            <span>Total</span>
            <span className="text-[#E8E4DE]">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-[#E8E4DE] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-all">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

function GalleryCheckout({ shop, shopSlug }) {
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
      alert(err?.response?.data?.detail || 'Failed to place acquisition order')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const deliveryCode = done.delivery_code || done.delivery_codes?.[0]?.code || done.groups?.[0]?.delivery_code
    return (
      <div className="py-20 px-8 max-w-md mx-auto text-center">
        <h2 className="text-3xl font-light mb-2">Acquisition Confirmed</h2>
        <p className="text-xs text-[#8A7E72] mb-6" style={{ fontFamily: 'sans-serif' }}>Ref: #{done.public_id || done.id || 'Confirmed'}</p>
        {deliveryCode && (
          <div className="bg-[#222] border border-[#444] p-6 rounded-lg mb-6" style={{ fontFamily: 'sans-serif' }}>
            <span className="text-[10px] uppercase tracking-widest text-[#8A7E72] block mb-2">Delivery Code</span>
            <div className="text-2xl font-mono text-[#E8E4DE] tracking-widest">{deliveryCode}</div>
            <p className="text-[10px] text-[#6B6460] mt-2">Present this code upon receiving your pieces</p>
          </div>
        )}
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#E8E4DE] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest hover:bg-white transition-all" style={{ fontFamily: 'sans-serif' }}>
          Return to Gallery
        </button>
      </div>
    )
  }

  return (
    <div className="py-16 px-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-light tracking-wider mb-8">Checkout</h1>
      <form onSubmit={submit} className="space-y-4" style={{ fontFamily: 'sans-serif' }}>
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 bg-[#222] border border-[#333] text-sm text-[#E8E4DE] outline-none focus:border-[#666]" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 bg-[#222] border border-[#333] text-sm text-[#E8E4DE] outline-none focus:border-[#666]" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 bg-[#222] border border-[#333] text-sm text-[#E8E4DE] outline-none focus:border-[#666]">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="Delivery Address" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 bg-[#222] border border-[#333] text-sm text-[#E8E4DE] outline-none focus:border-[#666]" rows={3} />
        <button type="submit" disabled={loading || items.length === 0} className="w-full py-4 bg-[#E8E4DE] text-[#1A1A1A] font-bold text-xs uppercase tracking-widest hover:bg-white disabled:opacity-40 transition-all">
          {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

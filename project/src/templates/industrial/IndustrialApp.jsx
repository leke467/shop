import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'

/*  INDUSTRIAL — Blueprint / Technical Schematic Layout
    Think: Construction supply catalog, engineering blueprint, exposed steel
    Monospace text, dashed grid lines, caution-stripe accents, numbered items */

export default function IndustrialApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()
  const cartItems = cart?.items || cart || []
  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#E0D8C8]" style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}>
      {/* Caution Stripe Top Bar */}
      <div className="h-2" style={{ background: 'repeating-linear-gradient(45deg, #F59E0B, #F59E0B 10px, #1C1C1C 10px, #1C1C1C 20px)' }} />

      {/* Industrial Header */}
      <header className="border-b border-dashed border-[#3D3D3D] sticky top-0 z-40 bg-[#1C1C1C]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between text-xs uppercase tracking-widest">
          <Link to={`/shop/${base}`} className="flex items-center gap-3">
            <span className="text-[#F59E0B] font-bold">⚙️</span>
            <div>
              <span className="text-[#F59E0B] text-[9px] block">DEPT. NO. 07</span>
              <span className="text-[#E0D8C8] font-bold tracking-[0.3em]">{shop?.name || 'FORGE WORKS'}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[#6B6B6B]">
            <Link to={`/shop/${base}`} className="hover:text-[#F59E0B] transition-colors">[MAIN]</Link>
            <Link to={`/shop/${base}/catalog`} className="hover:text-[#F59E0B] transition-colors">[INVENTORY]</Link>
            <Link to={`/shop/${base}/about`} className="hover:text-[#F59E0B] transition-colors">[ABOUT]</Link>
            <Link to={`/shop/${base}/reviews`} className="hover:text-[#F59E0B] transition-colors">[REVIEWS]</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/" className="hidden sm:block text-[#6B6B6B] hover:text-[#F59E0B]">[← MULTISHOP]</Link>
            <button onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 border border-dashed border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-black transition-all">
              CRATE [{cartCount}]
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route index element={<IndustrialHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<IndustrialCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<IndustrialCatalog products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={shopSlug || base} theme="industrial" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="industrial" />} />
          <Route path="checkout" element={<IndustrialCheckout shop={shop} shopSlug={shopSlug || base} />} />
          <Route path="*" element={<IndustrialHome shop={shop} products={products} base={base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <IndustrialModal product={quickView} onClose={() => setQuickView(null)} />}
      <IndustrialCart shop={shop} shopSlug={shopSlug || base} />

      <TemplateFooterView shop={shop} shopSlug={shopSlug || base} theme="industrial" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function IndustrialHome({ shop, products, base, onQuickView }) {
  const navigate = useNavigate()
  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.industrial_hero_badge || extra.hero_badge || '// HEAVY DUTY INDUSTRIAL SPECS'
  const headline = extra.industrial_hero_headline || extra.hero_headline || shop?.name || 'FORGE WORKS'
  const subtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'Industrial-grade tools, heavy machinery parts, raw materials, and fabrication supplies. Built to last.'
  const cta = extra.industrial_hero_cta_primary || extra.hero_cta_primary || 'ACCESS INVENTORY ⚙'
  const heroImage = extra.industrial_hero_image_1 || extra.hero_image_1 || extra.banner_url || shop?.banner

  return (
    <div>
      {/* Blueprint Hero with grid background */}
      <section className="relative py-24 px-8 border-b border-dashed border-[#3D3D3D] overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #3D3D3D 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {heroImage && (
          <img src={getImageUrl(heroImage)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" />
        )}
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex justify-between items-center text-[10px] text-[#6B6B6B] mb-2">
            <span>DWG NO. 001-A</span>
            <span className="text-[#F59E0B] font-bold">{badge}</span>
            <span>SCALE: 1:1</span>
          </div>

          <div className="mt-8 space-y-6">
            <h1 className="text-4xl sm:text-6xl font-bold text-[#F59E0B] tracking-tight leading-tight">
              {headline}
            </h1>
            <p className="text-sm text-[#8B8B7A] max-w-xl leading-relaxed border-l-2 border-dashed border-[#F59E0B] pl-4">
              {subtitle}
            </p>
            <button onClick={() => navigate(`/shop/${base}/catalog`)}
              className="px-8 py-3 bg-[#F59E0B] text-black font-bold tracking-widest uppercase hover:bg-[#D97706] transition-all">
              {cta}
            </button>
          </div>
        </div>
      </section>

      <IndustrialCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function IndustrialCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.industrial_categories_title || (extra.template_id === 'industrial' ? extra.categories_title : null) || '[INVENTORY MANIFEST]'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'INDUSTRIAL').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'INDUSTRIAL').toUpperCase()
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
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dashed border-[#3D3D3D] pb-4 mb-6 gap-4">
        <h2 className="text-sm tracking-[0.3em] text-[#F59E0B] uppercase">{catalogTitle}</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH..."
            className="border border-dashed border-[#3D3D3D] bg-transparent py-1.5 px-3 text-xs text-[#E0D8C8] outline-none w-40 sm:w-48" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-dashed border-[#3D3D3D] bg-[#1C1C1C] py-1.5 px-2 text-xs text-[#F59E0B] outline-none cursor-pointer uppercase"
          >
            <option value="default">SORT: DEFAULT</option>
            <option value="low">PRICE: LOW → HIGH</option>
            <option value="high">PRICE: HIGH → LOW</option>
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
              className={`px-3 py-1 text-xs uppercase tracking-wider transition-all border border-dashed ${
                selectedCategory === cat
                  ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold'
                  : 'bg-transparent text-[#8B8B7A] border-[#3D3D3D] hover:border-[#F59E0B]'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>
      )}

      {/* Technical spec list layout */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-xs text-[#8B8B7A] uppercase">[NO INVENTORY MATCHES QUERY]</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div key={p.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-dashed border-[#3D3D3D] hover:border-[#F59E0B] transition-colors p-4 items-center group"
                style={{ backgroundImage: idx % 2 === 0 ? 'none' : 'linear-gradient(90deg, #222 0%, transparent 100%)' }}>

                {/* Item Number */}
                <div className="sm:col-span-1 text-left sm:text-center">
                  <span className="text-[#F59E0B] font-bold text-xl">#{String(idx + 1).padStart(2, '0')}</span>
                </div>

                {/* Image */}
                <div className="sm:col-span-2 h-24 border border-dashed border-[#3D3D3D] overflow-hidden bg-[#2A2A2A] cursor-pointer" onClick={() => onQuickView?.(p)}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">⚙</div>}
                </div>

                {/* Info */}
                <div className="sm:col-span-5 space-y-1">
                  <h3 className="font-bold text-[#E0D8C8] uppercase tracking-wider cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{p.description || 'Industrial component.'}</p>
                  <span className="text-[9px] text-[#8B8B7A]">SKU: IND-{String(p.id || idx).slice(0, 8).toUpperCase()}</span>
                </div>

                {/* Price */}
                <div className="sm:col-span-2 text-left sm:text-right">
                  <span className="text-lg font-bold text-[#F59E0B]">₦{price.toLocaleString()}</span>
                  <span className="text-[9px] text-[#6B6B6B] block">UNIT PRICE</span>
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <button onClick={() => addToCart(p)}
                    className="px-3 py-2 bg-[#F59E0B] text-black text-[10px] font-bold uppercase tracking-wider hover:bg-[#D97706] transition-colors">
                    + REQUISITION
                  </button>
                  <button onClick={() => onQuickView?.(p)}
                    className="px-3 py-1 border border-dashed border-[#6B6B6B] text-[#6B6B6B] text-[10px] uppercase hover:text-[#F59E0B] hover:border-[#F59E0B] transition-colors">
                    SPEC SHEET
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function IndustrialModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#1C1C1C] border border-dashed border-[#F59E0B] p-6 sm:p-8 max-w-lg w-full relative"
        style={{ backgroundImage: 'radial-gradient(circle, #3D3D3D 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[#F59E0B] font-bold text-lg hover:text-white">✕</button>
        <span className="text-[9px] text-[#6B6B6B] block mb-2">[SPEC SHEET]</span>

        {imgSrc && (
          <div className="h-48 border border-dashed border-[#3D3D3D] overflow-hidden mb-4 bg-[#2A2A2A]">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-xl font-bold text-[#F59E0B] mb-2 uppercase">{product.name}</h2>
        <p className="text-xs text-[#8B8B7A] mb-4">{product.description || 'Precision engineered industrial specification component.'}</p>
        
        <div className="flex items-center justify-between border-y border-dashed border-[#3D3D3D] py-3 mb-6">
          <div className="text-2xl font-bold text-[#F59E0B]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-dashed border-[#F59E0B] bg-[#2A2A2A]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-[#F59E0B] font-bold hover:bg-[#F59E0B] hover:text-black">-</button>
            <span className="px-3 text-xs font-bold text-[#E0D8C8]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-[#F59E0B] font-bold hover:bg-[#F59E0B] hover:text-black">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-[#F59E0B] text-black font-bold uppercase tracking-widest hover:bg-[#D97706] transition-colors">REQUISITION ⚙</button>
      </div>
    </div>
  )
}

function IndustrialCart({ shop, shopSlug }) {
  const nav = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-md h-full bg-[#1C1C1C] border-l border-dashed border-[#F59E0B] p-6 flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-dashed border-[#3D3D3D] text-xs tracking-widest uppercase">
          <h3>[CRATE: {items.length} ITEMS]</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#F59E0B] text-base hover:text-white font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#8B8B7A] uppercase">[CRATE IS EMPTY]</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 border border-dashed border-[#3D3D3D] text-xs">
                  <div>
                    <p className="font-bold uppercase text-[#E0D8C8]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-[#8B8B7A] text-[10px] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-dashed border-[#3D3D3D]">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-black font-bold">-</button>
                        <span className="px-2 text-[#E0D8C8] font-bold">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-black font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#F59E0B]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-[#F59E0B] hover:text-red-400 text-[10px] uppercase font-bold mt-1">REMOVE</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pt-4 border-t border-dashed border-[#3D3D3D] space-y-3">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span className="text-[#F59E0B]">₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); nav(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-[#F59E0B] disabled:opacity-50 text-black font-bold uppercase tracking-widest hover:bg-[#D97706] transition-all">
            PROCEED TO CHECKOUT ⚙
          </button>
        </div>
      </div>
    </div>
  )
}

function IndustrialCheckout({ shop, shopSlug }) {
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
        <h2 className="text-2xl font-bold text-[#F59E0B] mb-4">[ORDER DISPATCHED]</h2>
        {done.delivery_code && (
          <div className="text-xl font-bold text-[#F59E0B] border border-dashed border-[#F59E0B] p-4 mb-4">
            DELIVERY CODE: {done.delivery_code}
          </div>
        )}
        <p className="text-xs text-[#8B8B7A]">Thank you for your requisition. Keep your delivery code safe.</p>
        <button onClick={() => nav(`/shop/${base}`)} className="px-6 py-3 bg-[#F59E0B] text-black font-bold uppercase hover:bg-[#D97706] transition-all">
          RETURN TO CATALOG
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 sm:p-16 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#F59E0B] mb-8 uppercase">[DISPATCH REQUISITION]</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="FULL NAME" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-4 bg-[#2A2A2A] border border-dashed border-[#3D3D3D] text-xs text-[#E0D8C8] outline-none uppercase" />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="PHONE" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="p-4 bg-[#2A2A2A] border border-dashed border-[#3D3D3D] text-xs text-[#E0D8C8] outline-none" />
          <select value={state} onChange={e => setState(e.target.value)} className="p-4 bg-[#2A2A2A] border border-dashed border-[#3D3D3D] text-xs text-[#E0D8C8] outline-none">
            {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Kaduna', 'Delta'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea required placeholder="DISPATCH ADDRESS" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-4 bg-[#2A2A2A] border border-dashed border-[#3D3D3D] text-xs text-[#E0D8C8] outline-none" />
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#F59E0B] disabled:opacity-50 text-black font-bold uppercase tracking-widest hover:bg-[#D97706] transition-all">
          {loading ? 'PROCESSING...' : `DISPATCH ORDER (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import TemplateMobileNav from '../../components/shop/TemplateMobileNav'
import './retro.css'

export default function RetroApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()

  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''
  const baseSlug = base
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const aboutUrl = baseSlug ? `/shop/${baseSlug}/about` : '/about'
  const reviewsUrl = baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'

  return (
    <div className="retro-template bg-[#FFFBEB] text-[#78350F] min-h-screen font-serif selection:bg-[#EA580C] selection:text-white">
      {/* Mobile Top Navigation & Drawer */}
      <TemplateMobileNav shop={shop} shopSlug={base} theme="retro" cartCount={cartCount} setIsCartOpen={setIsCartOpen} />

      {/* Groovy 70s Desktop Header */}
      <header className="hidden md:block border-b-2 border-[#D97706]/40 bg-[#FEF3C7] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-xl border-2 border-[#78350F] shadow-md">
              📻
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#78350F]">
              {shop?.name || 'RETRO 70S'}
            </span>
          </Link>

          <nav className="flex items-center gap-8 font-sans font-bold text-sm uppercase tracking-wider text-[#92400E]">
            <Link to={homeUrl} className="hover:text-[#EA580C] transition-colors">Records & Home</Link>
            <Link to={catalogUrl} className="hover:text-[#EA580C] transition-colors">Analog Index</Link>
            <Link to={aboutUrl} className="hover:text-[#EA580C] transition-colors">About Story</Link>
            <Link to={reviewsUrl} className="hover:text-[#EA580C] transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-full bg-[#FDE68A] border border-[#D97706] font-sans font-bold text-xs text-[#78350F] hover:bg-[#FCD34D] transition-colors"
            >
              ← MultiShop
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 rounded-full bg-[#EA580C] text-white font-sans font-bold text-xs uppercase shadow-md hover:bg-[#C2410C] transition-colors"
            >
              Bag ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route index element={<RetroHome shop={shop} products={products} shopSlug={baseSlug} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<RetroCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<RetroCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={baseSlug} theme="retro" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={baseSlug} theme="retro" />} />
          <Route path="checkout" element={<RetroCheckout shop={shop} shopSlug={baseSlug} />} />
          <Route path="*" element={<RetroHome shop={shop} products={products} shopSlug={baseSlug} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <RetroQuickModal product={quickView} onClose={() => setQuickView(null)} />}
      <RetroCartDrawer shop={shop} shopSlug={baseSlug} />

      <TemplateFooterView shop={shop} shopSlug={baseSlug} theme="retro" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function RetroHome({ shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.retro_hero_badge || extra.hero_badge || '📻 180g Audiophile Pressings & Vintage Gear'
  const headline = extra.retro_hero_headline || extra.hero_headline || shop?.name || 'GROOVY VINTAGE'
  const subtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'Vintage turntables, rare 70s vinyl LPs, retro cameras, and timeless mid-century audio equipment.'
  const cta = extra.retro_hero_cta_primary || extra.hero_cta_primary || 'SPIN RECORDS 📻 →'
  const heroImage = extra.retro_hero_image_1 || extra.hero_image_1 || extra.banner_url || shop?.banner || 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80'

  return (
    <div>
      {/* Groovy Curved Hero */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#FDE68A] border border-[#D97706] font-sans font-bold text-xs uppercase tracking-wider text-[#92400E]">
            {badge}
          </span>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight text-[#78350F]">
            {headline}
          </h1>

          <p className="text-lg text-[#92400E] font-sans max-w-xl leading-relaxed">
            {subtitle}
          </p>

          <div>
            <button
              onClick={() => navigate(catalogUrl)}
              className="px-8 py-4 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-sans font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all"
            >
              {cta}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative flex justify-center">
          <div className="w-80 h-80 rounded-full border-8 border-[#78350F] bg-[#1E293B] flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <img
              src={getImageUrl(heroImage)}
              alt=""
              className="w-full h-full object-cover rounded-full group-hover:rotate-45 transition-transform duration-1000 opacity-90"
            />
            <div className="w-24 h-24 rounded-full bg-[#FDE68A] border-4 border-[#78350F] absolute flex items-center justify-center font-sans font-bold text-[10px] text-[#78350F] text-center p-2">
              33 RPM VINTAGE
            </div>
          </div>
        </div>
      </section>

      <RetroCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function RetroCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.retro_categories_title || (extra.template_id === 'retro' ? extra.categories_title : null) || '/// VINYL CRATE & RETRO GEAR'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'VINYL').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'VINYL').toUpperCase()
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
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b-2 border-[#D97706]/30 mb-6 gap-4">
        <h2 className="text-2xl font-extrabold text-[#78350F]">📻 VINYL & ANALOG SELECTION</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search records..."
            className="border-2 border-[#D97706] rounded-full bg-[#FEF3C7] px-4 py-2 font-sans text-xs text-[#78350F] outline-none w-40 sm:w-64"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border-2 border-[#D97706] rounded-full bg-[#FEF3C7] px-3 py-2 font-sans text-xs font-bold text-[#78350F] outline-none cursor-pointer"
          >
            <option value="default">FEATURED</option>
            <option value="low">PRICE: LOW → HIGH</option>
            <option value="high">PRICE: HIGH → LOW</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10 font-sans">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-md'
                  : 'bg-[#FEF3C7] text-[#92400E] border-[#D97706]/40 hover:border-[#EA580C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center font-sans font-bold text-sm text-[#92400E]">NO ANALOG OBJECTS FOUND.</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div
                key={p.id || idx}
                className="bg-[#FEF3C7] border-2 border-[#D97706]/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm sm:shadow-md hover:border-[#EA580C] hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="relative h-36 sm:h-60 rounded-xl sm:rounded-2xl bg-white border border-[#D97706]/30 overflow-hidden mb-2 sm:mb-4 cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">📻</div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
                    className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-[#EA580C] text-white font-sans text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md"
                  >
                    Inspect
                  </button>
                </div>

                <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
                  <h3 className="text-xs sm:text-xl font-bold text-[#78350F] truncate cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>{p.name}</h3>
                  <p className="text-[10px] sm:text-xs font-sans text-[#92400E] line-clamp-2 hidden sm:block">{p.description || 'Vintage analog LP.'}</p>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-[#D97706]/30 flex flex-col sm:flex-row sm:items-center justify-between font-sans gap-1.5">
                  <span className="text-xs sm:text-xl font-extrabold text-[#78350F]">₦{price.toLocaleString()}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full sm:w-auto bg-[#EA580C] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase shadow-md hover:bg-[#C2410C] text-center"
                  >
                    + Bag
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

function RetroQuickModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-sans">
      <div className="bg-[#FEF3C7] border-3 border-[#EA580C] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 font-bold text-xl text-[#78350F] hover:text-[#EA580C]">✕</button>
        <span className="text-xs font-bold uppercase text-[#EA580C]">📻 Vintage Record Preview</span>
        {imgSrc ? (
          <div className="w-full h-48 rounded-2xl bg-white border border-[#D97706]/30 overflow-hidden">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl bg-white border border-[#D97706]/30 flex items-center justify-center text-4xl">
            📻
          </div>
        )}
        <h2 className="text-2xl font-serif font-bold text-[#78350F]">{product.name}</h2>
        <p className="text-xs text-[#92400E]">{product.description || 'Vintage analog pressing.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#D97706]/40 py-3">
          <div className="text-2xl font-bold text-[#78350F]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border-2 border-[#D97706] rounded-full bg-white px-2 py-0.5">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 font-bold text-sm text-[#78350F]">-</button>
            <span className="px-2 font-bold text-xs text-[#78350F]">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-2 font-bold text-sm text-[#78350F]">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-[#EA580C] text-white font-bold text-sm uppercase rounded-full shadow-lg hover:bg-[#C2410C] transition-colors">Add to Bag 📻</button>
      </div>
    </div>
  )
}

function RetroCartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  const baseSlug = shopSlug || shop?.slug || ''
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 font-sans">
      <div className="w-full max-w-md h-full bg-[#FFFBEB] border-l-2 border-[#D97706] p-6 flex flex-col justify-between shadow-2xl">
        <div className="flex justify-between items-center border-b-2 border-[#D97706]/40 pb-4">
          <h3 className="text-lg font-extrabold text-[#78350F]">📻 VINYL BAG ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#78350F] font-bold hover:text-[#EA580C]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-[#92400E] text-sm font-bold">
              YOUR VINYL BAG IS EMPTY 📻
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-[#FEF3C7] rounded-xl border border-[#D97706]/30">
                  <div>
                    <p className="font-bold text-sm text-[#78350F]">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#92400E] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-[#D97706] rounded-full bg-white px-1.5 py-0.5">
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty - 1)} className="px-1 text-xs font-bold text-[#78350F]">-</button>
                        <span className="px-1.5 font-bold text-xs text-[#78350F]">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty + 1)} className="px-1 text-xs font-bold text-[#78350F]">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#78350F]">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id || it.product_id || it.product?.id)} className="text-xs text-[#EA580C] font-bold hover:text-[#C2410C] mt-1 block">Remove</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t-2 border-[#D97706]/40 space-y-3">
          <div className="flex justify-between text-xl font-extrabold text-[#78350F]">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); navigate(`/shop/${baseSlug}/checkout`) }}
            className={`w-full py-4 bg-[#EA580C] text-white rounded-full font-bold text-sm uppercase shadow-lg transition-colors ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#C2410C]'}`}
          >
            Checkout ➔
          </button>
        </div>
      </div>
    </div>
  )
}

function RetroCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()
  const baseSlug = shopSlug || shop?.slug || ''

  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
  })
  const [selectedState, setSelectedState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(null)

  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: selectedState,
        state: selectedState,
        country: 'NG',
        idempotency_key: crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9)),
        shop_slug: baseSlug,
      })
      clearCart?.()
      const orderData = res.order || res || { public_id: 'SUCCESS' }
      const deliveryCode = res.delivery_code || res.order?.delivery_code || res.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setComplete({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false)
    }
  }

  if (complete) {
    return (
      <div className="py-24 max-w-xl mx-auto px-6 text-center font-sans">
        <div className="bg-[#FEF3C7] border-2 border-[#EA580C] rounded-3xl p-8 shadow-xl space-y-4">
          <h2 className="text-2xl font-serif font-extrabold text-[#78350F]">📻 Order Confirmed!</h2>
          <p className="text-xs text-[#92400E]">Your vintage order has been placed successfully.</p>
          {complete.delivery_code && (
            <div className="p-4 bg-[#EA580C] text-white rounded-2xl font-bold text-xl">
              CODE: {complete.delivery_code}
            </div>
          )}
          <button onClick={() => navigate(`/shop/${baseSlug}`)} className="px-6 py-3 bg-[#EA580C] text-white rounded-full font-bold text-xs uppercase shadow-md hover:bg-[#C2410C]">Back to Store</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-6 font-sans">
      <h1 className="text-3xl font-serif font-extrabold text-[#78350F] mb-6">📻 Vintage Checkout</h1>
      {items.length === 0 ? (
        <div className="bg-[#FEF3C7] border-2 border-[#D97706]/40 rounded-3xl p-8 text-center space-y-4">
          <p className="text-sm font-bold text-[#78350F]">Your vinyl bag is currently empty.</p>
          <button onClick={() => navigate(`/shop/${baseSlug}/catalog`)} className="px-6 py-3 bg-[#EA580C] text-white rounded-full font-bold text-xs uppercase shadow-md hover:bg-[#C2410C]">
            Explore Analog Index 📻
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#FEF3C7] border-2 border-[#D97706]/40 rounded-3xl p-6 space-y-4">
            <input required placeholder="Full Name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 rounded-xl border border-[#D97706]/40 text-xs text-[#78350F] outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Phone Number *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 rounded-xl border border-[#D97706]/40 text-xs text-[#78350F] outline-none" />
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 rounded-xl border border-[#D97706]/40 text-xs text-[#78350F] outline-none">
                {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea required placeholder="Delivery Address *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 rounded-xl border border-[#D97706]/40 text-xs text-[#78350F] outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#EA580C] text-white rounded-full font-bold text-base uppercase shadow-lg hover:bg-[#C2410C] transition-colors">
            {loading ? 'Processing...' : `Place Order (₦${total.toLocaleString()})`}
          </button>
        </form>
      )}
    </div>
  )
}

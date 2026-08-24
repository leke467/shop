import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import TemplateAboutView from '../../components/shop/TemplateAboutView'
import TemplateFooterView from '../../components/shop/TemplateFooterView'
import './cyberpunk.css'

export default function CyberpunkApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()

  const cartList = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartList.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''
  const baseSlug = base
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  return (
    <div className="cyber-template bg-[#080810] text-[#00F0FF] min-h-screen font-mono selection:bg-[#FF007F] selection:text-white">
      {/* Cyber Telemetry Header Bar */}
      <div className="bg-[#121220] border-b border-[#FF007F]/40 px-6 py-1 text-[11px] flex justify-between items-center text-[#FF007F]">
        <span>[SYS_STATUS: ONLINE] [NEURAL_LINK: ESTABLISHED]</span>
        <span className="hidden sm:inline">[PORTAL: MULTISHOP_HUB_v2.0]</span>
      </div>

      {/* Cyber HUD Navbar */}
      <header className="border-b border-[#00F0FF]/30 bg-[#0A0A14]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-[#FF007F] bg-[#FF007F]/10 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_#FF007F]">
              ⚡
            </div>
            <span className="text-xl font-black tracking-widest uppercase text-white group-hover:text-[#00F0FF] transition-colors">
              {shop?.name || 'CYBER_HUB'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
            <Link to={homeUrl} className="hover:text-[#00F0FF] transition-colors">[01] // HOME</Link>
            <Link to={catalogUrl} className="hover:text-[#00F0FF] transition-colors">[02] // GRID</Link>
            <Link to={baseSlug ? `/shop/${baseSlug}/about` : '/about'} className="hover:text-[#00F0FF] transition-colors">[03] // ABOUT</Link>
            <Link to={baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'} className="hover:text-[#00F0FF] transition-colors">[04] // REVIEWS</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:inline-block px-3 py-1.5 border border-[#FF007F]/50 text-[#FF007F] text-xs font-bold uppercase hover:bg-[#FF007F] hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,127,0.3)]"
            >
              ← MULTISHOP
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 border border-[#00F0FF] bg-[#00F0FF]/10 text-white font-bold text-xs uppercase hover:bg-[#00F0FF] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              CART [{cartCount}]
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route index element={<CyberpunkHome shop={shop} products={products} shopSlug={shopSlug} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<CyberpunkCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<CyberpunkCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="about" element={<TemplateAboutView shop={shop} shopSlug={shopSlug} theme="cyberpunk" products={products} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="cyberpunk" />} />
          <Route path="checkout" element={<CyberpunkCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<CyberpunkHome shop={shop} products={products} shopSlug={shopSlug} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <CyberpunkQuickModal product={quickView} onClose={() => setQuickView(null)} />}
      <CyberpunkCartDrawer shop={shop} shopSlug={shopSlug} />

      {/* Cyber HUD Footer */}
      <TemplateFooterView shop={shop} shopSlug={shopSlug} theme="cyberpunk" setIsCartOpen={setIsCartOpen} />
    </div>
  )
}

function CyberpunkHome({ shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.hero_badge || '/// PROTOCOL_v2.04 // HIGH TECH GEAR'
  const headline = extra.hero_headline || shop?.name || 'NEON MATRIX'
  const subtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'Engineered for the neon underground. High-tech armor, mechanical keyboards, and cyberpunk aesthetics.'
  const ctaText = extra.hero_cta_primary || 'ACCESS GRID MATRIX ➔'
  const heroImg = extra.hero_image_1 || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'

  return (
    <div>
      {/* Cyber Hero HUD */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-[#00F0FF]/20">
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-block px-3 py-1 bg-[#FF007F]/20 border border-[#FF007F] text-[#FF007F] text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_#FF007F]">
            {badge}
          </div>

          <h1 className="text-5xl sm:text-7xl font-black uppercase text-white tracking-wider leading-tight shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {headline}
          </h1>

          <p className="text-sm text-[#94A3B8] max-w-xl leading-relaxed border-l-2 border-[#00F0FF] pl-4">
            {subtitle}
          </p>

          <div>
            <button
              onClick={() => navigate(catalogUrl)}
              className="px-8 py-4 bg-[#FF007F] hover:bg-[#D9006C] text-white font-bold text-sm uppercase tracking-widest border border-white shadow-[0_0_25px_#FF007F] transition-all"
            >
              {ctaText}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 border border-[#00F0FF]/40 p-2 bg-[#0C0C18] relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <div className="h-80 bg-slate-900 border border-[#FF007F]/40 overflow-hidden relative">
            <img
              src={getImageUrl(heroImg)}
              alt=""
              className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-700"
            />
            <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] text-[#00F0FF]">
              [HUD_PREVIEW: #0921]
            </span>
          </div>
        </div>
      </section>

      <CyberpunkCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function CyberpunkCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')

  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.cyberpunk_categories_title || (extra.template_id === 'cyberpunk' ? extra.categories_title : null) || '/// HARDWARE_GRID'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'GEAR').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'GEAR').toUpperCase()
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
      <div className="flex flex-col sm:flex-row justify-between items-baseline pb-8 border-b border-[#00F0FF]/20 mb-8 gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#00F0FF]">{catalogTitle}</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH_SYSTEM..."
            className="border border-[#00F0FF]/50 bg-[#101020] px-4 py-2 text-xs text-[#00F0FF] outline-none w-48 sm:w-64 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-[#00F0FF]/50 bg-[#101020] px-3 py-2 text-xs text-[#00F0FF] outline-none cursor-pointer"
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
              className={`px-3 py-1 text-xs font-bold uppercase border transition-all ${
                selectedCategory === cat
                  ? 'border-[#FF007F] bg-[#FF007F] text-white shadow-[0_0_15px_#FF007F]'
                  : 'border-[#00F0FF]/40 bg-[#0C0C18] text-[#00F0FF] hover:border-[#00F0FF]'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-[#FF007F] border border-[#FF007F]/40 bg-[#120814]">
          [ERROR: NO_HARDWARE_FOUND]
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div
                key={p.id || idx}
                className="bg-[#0D0D1A] border border-[#00F0FF]/30 p-4 hover:border-[#FF007F] hover:shadow-[0_0_20px_rgba(255,0,127,0.3)] transition-all flex flex-col justify-between"
              >
                <div className="relative h-56 bg-slate-950 border border-[#00F0FF]/20 overflow-hidden mb-4 cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-[#FF007F]">⚡</div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
                    className="absolute top-2 right-2 bg-black/80 text-[#00F0FF] border border-[#00F0FF] px-2 py-1 text-[10px]"
                  >
                    INSPECT
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <span className="text-[10px] text-[#FF007F] block">[ITEM_ID: #{String(idx + 1).padStart(3, '0')}]</span>
                  <h3 className="text-base font-bold uppercase text-white truncate cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>{p.name}</h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2">{p.description || 'Cyberpunk gear.'}</p>
                </div>

                <div className="pt-3 border-t border-[#00F0FF]/20 flex items-center justify-between">
                  <span className="text-lg font-bold text-white">₦{price.toLocaleString()}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="bg-[#FF007F] text-white border border-white px-3 py-1.5 text-xs font-bold uppercase shadow-[0_0_10px_#FF007F] hover:bg-[#D9006C]"
                  >
                    + MOUNT
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

function CyberpunkQuickModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0C0C18] border border-[#FF007F] p-6 sm:p-8 max-w-lg w-full shadow-[0_0_30px_#FF007F] space-y-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-[#FF007F] font-bold text-lg hover:text-white">✕</button>
        <span className="text-xs text-[#00F0FF] block">[HARDWARE_TELEMETRY]</span>
        
        {imgSrc && (
          <div className="h-56 bg-slate-950 border border-[#00F0FF]/40 overflow-hidden">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-2xl font-bold uppercase text-white">{product.name}</h2>
        <p className="text-xs text-[#94A3B8] leading-relaxed">{product.description || 'Engineered for the neon underground. High-performance cyber hardware.'}</p>
        
        <div className="flex items-center justify-between border-y border-[#00F0FF]/30 py-3">
          <div className="text-2xl font-bold text-[#00F0FF]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-[#00F0FF] bg-[#101020]">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-[#00F0FF] font-bold hover:bg-[#00F0FF]/20">-</button>
            <span className="px-3 text-xs font-bold text-white">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-[#00F0FF] font-bold hover:bg-[#00F0FF]/20">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-[#FF007F] text-white font-bold text-sm uppercase shadow-[0_0_20px_#FF007F] hover:bg-[#D9006C] transition-all">MOUNT HARDWARE ⚡</button>
      </div>
    </div>
  )
}

function CyberpunkCartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, items: ctxItems, isCartOpen, setIsCartOpen, removeFromCart, removeItem, updateQuantity, updateQty } = useCart() || {}
  if (!isCartOpen) return null
  const items = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || i.base_price || 0) * (i.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''
  const handleRemove = typeof removeFromCart === 'function' ? removeFromCart : removeItem
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
      <div className="w-full max-w-md h-full bg-[#080812] border-l border-[#00F0FF] p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(0,240,255,0.3)]">
        <div className="flex justify-between items-center border-b border-[#00F0FF]/30 pb-4">
          <h3 className="text-base font-bold text-white uppercase">[NEURAL_CART: {items.length}]</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-[#FF007F] font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <span className="text-4xl block text-[#00F0FF]">⚡</span>
              <p className="text-xs text-[#94A3B8]">[CART_EMPTY: NO_HARDWARE_MOUNTED]</p>
              <button
                onClick={() => { setIsCartOpen(false); navigate(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'); }}
                className="px-4 py-2 border border-[#00F0FF] text-[#00F0FF] font-bold text-xs uppercase hover:bg-[#00F0FF] hover:text-black transition-all"
              >
                ACCESS GRID
              </button>
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || it.base_price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-[#101020] border border-[#00F0FF]/20">
                  <div>
                    <p className="font-bold text-sm text-white uppercase">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-[#00F0FF]/40 bg-[#080812]">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 text-xs text-[#00F0FF] hover:bg-[#00F0FF]/20">-</button>
                        <span className="px-2 text-xs font-bold text-white">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 text-xs text-[#00F0FF] hover:bg-[#00F0FF]/20">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00F0FF] text-sm">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => handleRemove && handleRemove(it.id)} className="text-xs text-[#FF007F] font-bold hover:text-red-400 mt-1">PURGE</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-[#00F0FF]/30 space-y-3">
            <div className="flex justify-between text-lg font-bold text-white">
              <span>TOTAL_CREDITS</span>
              <span className="text-[#00F0FF]">₦{total.toLocaleString()}</span>
            </div>
            <button onClick={() => { setIsCartOpen(false); navigate(`/shop/${shopSlug || shop?.slug || ''}/checkout`) }} className="w-full py-4 bg-[#FF007F] text-white font-bold text-xs uppercase shadow-[0_0_20px_#FF007F] hover:bg-[#D9006C] transition-all">EXECUTE TRANSACTION ➔</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CyberpunkCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, items: ctxItems, clearCart } = useCart() || {}
  const { user } = useUser() || {}

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
  })
  const [selectedState, setSelectedState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(null)

  const items = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || i.base_price || 0) * (i.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''

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
        idempotency_key: crypto.randomUUID ? crypto.randomUUID() : '123-uuid',
        shop_slug: shop?.slug || shopSlug,
      })
      clearCart && clearCart()
      const orderData = res.order || { public_id: res.order_id || 'SUCCESS' }
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
      <div className="py-24 max-w-xl mx-auto px-6 text-center">
        <div className="bg-[#0C0C18] border border-[#FF007F] p-8 shadow-[0_0_30px_#FF007F] space-y-4">
          <h2 className="text-2xl font-bold uppercase text-white">[TRANSACTION_SUCCESSFUL]</h2>
          {complete.delivery_code && <div className="p-4 bg-[#FF007F]/20 border border-[#FF007F] text-[#00F0FF] font-bold text-xl">CODE: {complete.delivery_code}</div>}
          <button onClick={() => navigate(`/shop/${shopSlug || shop?.slug || ''}`)} className="px-6 py-3 bg-[#FF007F] text-white font-bold text-xs uppercase shadow-[0_0_15px_#FF007F]">RETURN TO GRID</button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-24 max-w-xl mx-auto px-6 text-center">
        <div className="bg-[#0C0C18] border border-[#00F0FF]/40 p-8 space-y-4">
          <span className="text-4xl block text-[#00F0FF]">⚡</span>
          <h2 className="text-2xl font-bold uppercase text-white">[NEURAL_CART_EMPTY]</h2>
          <p className="text-xs text-[#94A3B8]">Mount items to your cart before proceeding to checkout.</p>
          <button onClick={() => navigate(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog')} className="px-6 py-3 bg-[#FF007F] text-white font-bold text-xs uppercase shadow-[0_0_15px_#FF007F]">
            ACCESS GRID MATRIX
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-6">
      <h1 className="text-3xl font-bold uppercase text-white mb-6">[EXECUTE_CHECKOUT]</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#0C0C18] border border-[#00F0FF]/40 p-6 space-y-4">
          <input required placeholder="AGENT FULL NAME *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 bg-[#101020] border border-[#00F0FF]/30 text-xs text-[#00F0FF] outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="COMMUNICATION LINE *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 bg-[#101020] border border-[#00F0FF]/30 text-xs text-[#00F0FF] outline-none" />
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 bg-[#101020] border border-[#00F0FF]/30 text-xs text-[#00F0FF] outline-none">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Delta', 'Anambra'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="DISPATCH COORDINATES (ADDRESS) *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 bg-[#101020] border border-[#00F0FF]/30 text-xs text-[#00F0FF] outline-none" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#FF007F] text-white font-bold text-sm uppercase shadow-[0_0_25px_#FF007F]">
          {loading ? 'TRANSACTING...' : `AUTHORIZE CREDITS (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

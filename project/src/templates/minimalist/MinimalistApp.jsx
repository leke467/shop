import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import './minimalist.css'

export default function MinimalistApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()

  const cartList = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartList.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''
  const base = baseSlug
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  return (
    <div className="min-template font-sans bg-white text-gray-900 min-h-screen flex flex-col selection:bg-black selection:text-white">
      {/* Top Architectural Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-3 group">
            <span className="font-mono text-xs uppercase tracking-widest text-gray-400">STUDIO //</span>
            <span className="font-black text-xl tracking-tighter uppercase text-gray-900 group-hover:text-gray-600 transition-colors">
              {shop?.name || 'MINIMAL'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 font-mono text-xs uppercase tracking-widest text-gray-500">
            <Link to={homeUrl} className="hover:text-black transition-colors">01. Home</Link>
            <Link to={catalogUrl} className="hover:text-black transition-colors">02. Index</Link>
            <Link to={baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'} className="hover:text-black transition-colors">03. Reviews</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:inline-block px-3 py-1.5 border border-gray-900 font-mono text-[11px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              ← MultiShop
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-gray-200 hover:border-black transition-all flex items-center gap-2"
            >
              Bag ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1">
        <Routes>
          <Route index element={<MinimalistHome shop={shop} products={products} shopSlug={shopSlug} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<MinimalistCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<MinimalistCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="default" />} />
          <Route path="checkout" element={<MinimalistCheckout shop={shop} shopSlug={shopSlug} />} />
          <Route path="*" element={<MinimalistHome shop={shop} products={products} shopSlug={shopSlug} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <MinimalistQuickModal product={quickView} onClose={() => setQuickView(null)} />}
      <MinimalistCartDrawer shop={shop} shopSlug={shopSlug} />

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 font-mono text-xs uppercase tracking-widest text-gray-400 text-center">
        © {new Date().getFullYear()} {shop?.name || 'STUDIO'}. ARCHITECTURAL MINIMALIST STOREFRONT.
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function MinimalistHome({ shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.hero_badge || 'Architectural Collection // 2026'
  const headline = extra.hero_headline || shop?.name || 'ESSENTIAL FORMS'
  const subtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'Pristine Scandinavian craftsmanship. Redefining everyday objects through reduction and functional perfection.'
  const ctaText = extra.hero_cta_primary || 'Explore Index [01] →'
  const heroImg = extra.hero_image_1 || 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80'

  return (
    <div>
      {/* Asymmetrical Studio Hero */}
      <section className="border-b border-gray-200 py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-8 space-y-8">
          <div className="font-mono text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-black inline-block" />
            {badge}
          </div>

          <h1 className="text-5xl sm:text-7xl font-light tracking-tighter uppercase leading-none text-black">
            {headline}
          </h1>

          <p className="text-gray-500 font-mono text-sm max-w-xl leading-relaxed">
            {subtitle}
          </p>

          <div>
            <button
              onClick={() => navigate(catalogUrl)}
              className="px-8 py-4 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-none"
            >
              {ctaText}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 border-l border-gray-200 pl-8 space-y-6">
          <div className="aspect-3/4 bg-gray-100 border border-gray-200 overflow-hidden">
            <img
              src={getImageUrl(heroImg)}
              alt=""
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
          <div className="font-mono text-xs text-gray-400 uppercase tracking-widest flex justify-between">
            <span>Fig. 01 / Objects</span>
            <span>Est. {new Date().getFullYear()}</span>
          </div>
        </div>
      </section>

      {/* Asymmetrical Minimalist Product Index */}
      <MinimalistCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function MinimalistCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')

  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.minimalist_categories_title || (extra.template_id === 'minimalist' ? extra.categories_title : null) || '/// CATALOGUE INDEX'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'OBJECT').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'OBJECT').toUpperCase()
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
      <div className="flex flex-col sm:flex-row justify-between items-baseline pb-8 border-b border-gray-200 mb-8 gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-gray-400">{catalogTitle}</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH INDEX..."
            className="border-b border-black font-mono text-xs uppercase tracking-widest py-1 outline-none w-40 sm:w-64 bg-transparent"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border-b border-black font-mono text-xs uppercase tracking-widest py-1 outline-none bg-transparent cursor-pointer"
          >
            <option value="default">SORT: DEFAULT</option>
            <option value="low">PRICE: LOW → HIGH</option>
            <option value="high">PRICE: HIGH → LOW</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-widest border transition-all ${
                selectedCategory === cat ? 'bg-black text-white border-black' : 'bg-transparent text-gray-500 border-gray-200 hover:border-black'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-gray-400">NO OBJECTS FOUND.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div key={p.id || idx} className="group flex flex-col space-y-4">
                <div className="relative aspect-4/5 bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs uppercase text-gray-400">NO IMAGE</div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
                    className="absolute top-4 right-4 bg-white text-black font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-black opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    INSPECT
                  </button>
                </div>

                <div className="flex justify-between items-baseline font-mono text-xs uppercase tracking-wider pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">[{String(idx + 1).padStart(2, '0')}]</span>
                    <h3 className="font-bold text-gray-900 group-hover:underline mt-0.5 cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>{p.name}</h3>
                  </div>
                  <span className="font-black text-black">₦{price.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="w-full py-2.5 border border-black font-mono text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all text-center"
                >
                  + Add to Bag
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function MinimalistQuickModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono text-xs uppercase">
      <div className="bg-white border border-black p-6 sm:p-8 max-w-lg w-full space-y-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 font-bold text-base hover:text-gray-600">✕</button>
        <span className="text-gray-400 text-[10px] block">/// OBJECT INSPECTION</span>
        
        {imgSrc && (
          <div className="h-56 bg-gray-100 border border-gray-200 overflow-hidden">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-2xl font-light text-black tracking-tight">{product.name}</h2>
        <p className="text-gray-500 normal-case text-xs leading-relaxed">{product.description || 'Architectural design item.'}</p>
        
        <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
          <div className="text-xl font-bold text-black">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-black">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 font-bold hover:bg-gray-100">-</button>
            <span className="px-3 font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 font-bold hover:bg-gray-100">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-black text-white font-bold tracking-widest hover:bg-gray-800 transition-all">Add to Bag →</button>
      </div>
    </div>
  )
}

function MinimalistCartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, items: ctxItems, isCartOpen, setIsCartOpen, removeFromCart, removeItem, updateQuantity, updateQty } = useCart() || {}
  if (!isCartOpen) return null
  const items = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || i.base_price || 0) * (i.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''
  const handleRemove = typeof removeFromCart === 'function' ? removeFromCart : removeItem
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-mono text-xs uppercase tracking-widest">
      <div className="w-full max-w-md h-full bg-white border-l border-black p-8 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="font-bold">/// BAG ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <span className="text-4xl block">🛒</span>
              <p className="text-gray-400">/// BAG IS EMPTY</p>
              <button
                onClick={() => { setIsCartOpen(false); navigate(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'); }}
                className="px-4 py-2 border border-black text-black font-bold hover:bg-black hover:text-white transition-all"
              >
                BROWSE INDEX
              </button>
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || it.base_price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-bold text-gray-900">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>•</span>
                      <div className="inline-flex items-center border border-gray-300">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 hover:bg-gray-100 font-bold">-</button>
                        <span className="px-2 font-bold text-gray-900">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 hover:bg-gray-100 font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => handleRemove && handleRemove(it.id)} className="text-gray-400 hover:text-black mt-1 text-[10px]">REMOVE</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-black space-y-4">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <button onClick={() => { setIsCartOpen(false); navigate(`/shop/${shopSlug || shop?.slug || ''}/checkout`) }} className="w-full py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all">CHECKOUT ➔</button>
          </div>
        )}
      </div>
    </div>
  )
}

function MinimalistCheckout({ shop, shopSlug }) {
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
      <div className="py-24 max-w-xl mx-auto px-6 text-center font-mono text-xs uppercase tracking-widest">
        <div className="p-8 border border-black space-y-4">
          <h2 className="text-2xl font-light">/// ORDER CONFIRMED</h2>
          {complete.delivery_code && <div className="p-4 border border-black font-bold text-xl">CODE: {complete.delivery_code}</div>}
          <button onClick={() => navigate(`/shop/${shopSlug || shop?.slug || ''}`)} className="px-6 py-3 bg-black text-white font-bold">RETURN TO STUDIO</button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-24 max-w-xl mx-auto px-6 text-center font-mono text-xs uppercase tracking-widest">
        <div className="p-8 border border-gray-200 space-y-4">
          <span className="text-4xl block">🛒</span>
          <h2 className="text-2xl font-light">/// BAG IS EMPTY</h2>
          <p className="text-gray-400">Add objects to your bag before inspecting checkout.</p>
          <button onClick={() => navigate(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog')} className="px-6 py-3 bg-black text-white font-bold">
            BROWSE INDEX
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-6 font-mono text-xs uppercase tracking-widest">
      <h1 className="text-3xl font-light mb-8">/// CHECKOUT</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 border border-gray-200 space-y-4">
          <input required placeholder="FULL NAME *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border border-gray-300 outline-none text-xs" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="PHONE NUMBER *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 border border-gray-300 outline-none text-xs" />
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 border border-gray-300 outline-none text-xs">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Delta', 'Anambra'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="DELIVERY ADDRESS *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 border border-gray-300 outline-none text-xs" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all">
          {loading ? 'PROCESSING...' : `PLACE ORDER (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

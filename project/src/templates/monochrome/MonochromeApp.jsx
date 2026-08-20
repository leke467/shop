import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import './monochrome.css'

export default function MonochromeApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()

  const cartItems = cart?.items || cart || []
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const baseSlug = shopSlug || shop?.slug || ''
  const base = baseSlug
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const reviewsUrl = baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'

  return (
    <div className="mono-template bg-black text-white min-h-screen font-serif selection:bg-white selection:text-black">
      {/* High-Fashion Editorial Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-40 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-3">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-500">NOIR //</span>
            <span className="font-normal text-2xl tracking-[0.2em] uppercase text-white">
              {shop?.name || 'VOGUE NOIR'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 font-sans text-[11px] uppercase tracking-[0.25em] text-zinc-400">
            <Link to={homeUrl} className="hover:text-white transition-colors">Cover</Link>
            <Link to={catalogUrl} className="hover:text-white transition-colors">Editorial</Link>
            <Link to={reviewsUrl} className="hover:text-white transition-colors">Reviews</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:inline-block px-3 py-1.5 border border-zinc-700 font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-300 hover:border-white hover:text-white transition-all"
            >
              ← MULTISHOP
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="font-sans text-[11px] uppercase tracking-[0.25em] px-4 py-2 border border-zinc-700 hover:border-white transition-all"
            >
              Bag [{cartCount}]
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route index element={<MonochromeHome shop={shop} products={products} shopSlug={shopSlug || base} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<MonochromeCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<MonochromeCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={shopSlug} theme="dark" />} />
          <Route path="checkout" element={<MonochromeCheckout shop={shop} shopSlug={shopSlug || base} />} />
          <Route path="*" element={<MonochromeHome shop={shop} products={products} shopSlug={shopSlug || base} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <MonochromeQuickModal product={quickView} onClose={() => setQuickView(null)} />}
      <MonochromeCartDrawer shop={shop} shopSlug={shopSlug || base} />

      {/* Editorial Footer */}
      <footer className="border-t border-zinc-800 py-12 px-6 font-sans text-[10px] tracking-[0.3em] uppercase text-zinc-500 text-center">
        © {new Date().getFullYear()} {shop?.name || 'NOIR'}. HAUTE COUTURE EDITORIAL STOREFRONT.
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function MonochromeHome({ shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  return (
    <div>
      {/* Editorial Magazine Hero */}
      <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-zinc-800">
        <div className="lg:col-span-7 space-y-8">
          <span className="font-sans text-[11px] tracking-[0.3em] uppercase text-zinc-400 block">
            /// ISSUE NO. 01 // HAUTE COUTURE
          </span>

          <h1 className="text-6xl sm:text-8xl font-normal tracking-tight leading-none text-white uppercase">
            {shop?.name || 'NOIR LUXE'}
          </h1>

          <p className="font-sans text-xs text-zinc-400 max-w-lg leading-relaxed tracking-wider uppercase">
            {shop?.description || shop?.tagline || 'Minimalist monochrome apparel, bespoke leather goods, and high-contrast runway editorial fashion.'}
          </p>

          <div>
            <button
              onClick={() => navigate(catalogUrl)}
              className="px-8 py-4 bg-white text-black font-sans text-[11px] font-bold tracking-[0.25em] uppercase hover:bg-zinc-200 transition-all"
            >
              VIEW EDITORIAL SPREAD ➔
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="aspect-3/4 border border-zinc-800 bg-zinc-950 overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
              alt=""
              className="w-full h-full object-cover grayscale hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 border border-zinc-800 font-sans text-[10px] tracking-widest text-zinc-300 uppercase flex justify-between">
              <span>LOOKBOOK // 2026</span>
              <span>MILAN SPREAD</span>
            </div>
          </div>
        </div>
      </section>

      <MonochromeCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function MonochromeCatalog({ products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'COUTURE').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'COUTURE').toUpperCase()
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
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col sm:flex-row justify-between items-baseline pb-6 border-b border-zinc-800 mb-8 gap-4">
        <h2 className="font-sans text-[11px] tracking-[0.3em] uppercase text-zinc-400">/// COUTURE INDEX</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH INDEX..."
            className="border-b border-zinc-600 bg-transparent py-1 font-sans text-[11px] uppercase tracking-widest text-white outline-none w-40 sm:w-64"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border-b border-zinc-600 bg-black font-sans text-[11px] uppercase tracking-widest text-zinc-300 py-1 outline-none cursor-pointer"
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
              className={`px-4 py-1.5 font-sans text-[10px] tracking-[0.2em] uppercase border transition-all ${
                selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-20 text-center font-sans text-[11px] tracking-widest text-zinc-500 uppercase">NO PIECES FOUND.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div key={p.id || idx} className="group flex flex-col space-y-4">
                <div className="relative aspect-3/4 border border-zinc-800 bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-sans text-[10px] uppercase text-zinc-600">NO MEDIA</div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(p); }}
                    className="absolute top-4 right-4 bg-white text-black font-sans text-[10px] tracking-widest uppercase px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    INSPECT
                  </button>
                </div>

                <div className="flex justify-between items-baseline border-t border-zinc-900 pt-3">
                  <div>
                    <span className="font-sans text-[9px] tracking-widest text-zinc-500 block">[{String(idx + 1).padStart(2, '0')}]</span>
                    <h3 className="font-normal text-lg uppercase tracking-wider text-white mt-0.5 cursor-pointer" onClick={() => onQuickView && onQuickView(p)}>{p.name}</h3>
                  </div>
                  <span className="font-sans font-bold text-sm text-white">₦{price.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="w-full py-3 border border-zinc-700 font-sans text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
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

function MonochromeQuickModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-serif">
      <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 max-w-lg w-full space-y-6 relative text-white shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 font-sans text-xs text-zinc-400 hover:text-white font-bold text-lg">✕</button>
        <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-zinc-500 block">/// PIECE DETAILS</span>

        {imgSrc && (
          <div className="h-60 border border-zinc-800 bg-zinc-900 overflow-hidden">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover grayscale" />
          </div>
        )}

        <h2 className="text-3xl font-normal uppercase tracking-wider">{product.name}</h2>
        <p className="font-sans text-xs text-zinc-400 uppercase leading-relaxed">{product.description || 'Monochrome haute couture signature piece.'}</p>
        
        <div className="flex items-center justify-between border-y border-zinc-800 py-3">
          <div className="text-2xl font-sans font-bold">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border border-zinc-700 font-sans">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 font-bold hover:bg-zinc-800">-</button>
            <span className="px-3 font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 font-bold hover:bg-zinc-800">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-white text-black font-sans text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all">Add to Bag →</button>
      </div>
    </div>
  )
}

function MonochromeCartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  if (!isCartOpen) return null
  const base = shopSlug || shop?.slug || ''
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 font-serif">
      <div className="w-full max-w-md h-full bg-black border-l border-zinc-800 p-8 flex flex-col justify-between text-white">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800 font-sans text-[11px] tracking-widest uppercase">
          <h3>/// BAG ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="hover:text-zinc-400 font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-center py-8 font-sans text-[11px] tracking-widest text-zinc-500 uppercase">Your bag is empty.</p>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center border-b border-zinc-900 pb-3 font-sans text-xs uppercase">
                  <div>
                    <p className="font-bold text-white">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] mt-1">
                      <span>QTY: {qty}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border border-zinc-800">
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty - 1)} className="px-1.5 py-0.5 hover:bg-zinc-800 font-bold text-zinc-300">-</button>
                        <span className="px-2 font-bold text-white">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id, qty + 1)} className="px-1.5 py-0.5 hover:bg-zinc-800 font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id)} className="text-zinc-500 hover:text-white font-bold mt-1 text-[10px]">REMOVE</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 space-y-4 font-sans text-xs uppercase tracking-widest">
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); navigate(`/shop/${base}/checkout`) }}
            className="w-full py-4 bg-white disabled:opacity-50 text-black font-bold hover:bg-zinc-200 transition-all">
            CHECKOUT ➔
          </button>
        </div>
      </div>
    </div>
  )
}

function MonochromeCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
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
  const [selectedState, setSelectedState] = useState('Lagos')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      console.error('Checkout error:', err);
      return
    }
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
      clearCart?.()
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
      <div className="py-24 max-w-xl mx-auto px-6 text-center font-serif">
        <div className="border border-zinc-800 p-12 space-y-6 bg-zinc-950">
          <span className="font-sans text-xs tracking-[0.3em] uppercase text-zinc-500 block">/// ORDER CONFIRMATION</span>
          <h2 className="text-3xl font-normal uppercase text-white tracking-wider">ACQUISITION COMPLETE</h2>
          {complete.delivery_code && (
            <div className="p-4 border border-zinc-700 bg-black font-sans text-lg tracking-widest text-white">
              CODE: {complete.delivery_code}
            </div>
          )}
          <p className="font-sans text-xs uppercase tracking-wider text-zinc-400">Your bespoke order has been archived. Keep your delivery code safe.</p>
          <button onClick={() => navigate(base ? `/shop/${base}` : '/')} className="px-8 py-4 bg-white text-black font-sans text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">RETURN TO SPREAD</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-6 font-serif text-white">
      <h1 className="text-3xl uppercase tracking-widest font-normal mb-8">/// CHECKOUT</h1>
      <form onSubmit={handleSubmit} className="space-y-6 font-sans text-xs uppercase tracking-widest">
        <div className="p-6 border border-zinc-800 space-y-4 bg-zinc-950">
          <input required placeholder="FULL NAME *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border border-zinc-800 bg-black outline-none text-white text-xs" />
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="PHONE NUMBER *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 border border-zinc-800 bg-black outline-none text-white text-xs" />
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 border border-zinc-800 bg-black outline-none text-white text-xs">
              {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo', 'Enugu', 'Kaduna', 'Delta'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea required placeholder="DELIVERY ADDRESS *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 border border-zinc-800 bg-black outline-none text-white text-xs" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 bg-white disabled:opacity-50 text-black font-bold hover:bg-zinc-200 transition-all">
          {loading ? 'PROCESSING...' : `PLACE ORDER (₦${total.toLocaleString()})`}
        </button>
      </form>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { getImageUrl, orderAPI } from '../../services/api'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'
import './popart.css'

export default function PopArtApp({ shop, products = [], reviews = [], shopSlug }) {
  const [quickView, setQuickView] = useState(null)
  const { cart, setIsCartOpen } = useCart()

  const cartItems = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const base = shopSlug || shop?.slug || ''
  const baseSlug = base
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const reviewsUrl = baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'

  return (
    <div className="pop-template bg-[#FEF08A] text-black min-h-screen font-black selection:bg-pink-500 selection:text-white">
      {/* Neobrutalist Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to={homeUrl} className="flex items-center gap-3 transform -rotate-1 hover:rotate-0 transition-transform">
            <span className="bg-pink-500 text-white px-3 py-1 text-xl font-black border-2 border-black shadow-[3px_3px_0px_#000]">
              POP!
            </span>
            <span className="text-2xl font-black tracking-tight uppercase">
              {shop?.name || 'POP STORE'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to={homeUrl} className="px-4 py-2 bg-yellow-300 border-2 border-black font-bold uppercase shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Home
            </Link>
            <Link to={catalogUrl} className="px-4 py-2 bg-cyan-300 border-2 border-black font-bold uppercase shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Catalog 💥
            </Link>
            <Link to={reviewsUrl} className="px-4 py-2 bg-lime-300 border-2 border-black font-bold uppercase shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Reviews ★
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-block px-3 py-1.5 bg-lime-300 border-2 border-black font-bold text-xs uppercase shadow-[3px_3px_0px_#000] hover:bg-lime-400"
            >
              ← MultiShop
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-pink-500 text-white border-2 border-black font-bold text-sm uppercase shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1"
            >
              🛒 Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route index element={<PopArtHome shop={shop} products={products} shopSlug={baseSlug} onQuickView={setQuickView} />} />
          <Route path="catalog" element={<PopArtCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="menu" element={<PopArtCatalog shop={shop} products={products} onQuickView={setQuickView} />} />
          <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={baseSlug} theme="popart" />} />
          <Route path="checkout" element={<PopArtCheckout shop={shop} shopSlug={baseSlug} />} />
          <Route path="*" element={<PopArtHome shop={shop} products={products} shopSlug={baseSlug} onQuickView={setQuickView} />} />
        </Routes>
      </main>

      {quickView && <PopArtQuickModal product={quickView} onClose={() => setQuickView(null)} />}
      <PopArtCartDrawer shop={shop} shopSlug={baseSlug} />

      {/* Neobrutalist Footer */}
      <footer className="border-t-4 border-black bg-white py-12 px-6 text-center">
        <div className="inline-block bg-pink-500 text-white px-6 py-2 border-3 border-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] mb-4">
          💥 NEOBRUTALIST POP STOREFRONT 💥
        </div>
        <p className="text-xs uppercase font-bold text-black">© {new Date().getFullYear()} {shop?.name || 'POP STORE'}. POWERED BY MULTISHOP.</p>
        <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
      </footer>
    </div>
  )
}

function PopArtHome({ shop, products, shopSlug, onQuickView }) {
  const navigate = useNavigate()
  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  const extra = shop?.theme?.extra_tokens || {}
  const badge = extra.popart_hero_badge || extra.hero_badge || '💥 100% LOUD & UNAPOLOGETIC!'
  const headline = extra.popart_hero_headline || extra.hero_headline || shop?.name || 'POP CULTURE!'
  const subtitle = extra.hero_subtitle || shop?.description || shop?.tagline || 'Bold streetwear, pop art toys, graphic apparel, and statement goods.'
  const cta = extra.popart_hero_cta_primary || extra.hero_cta_primary || 'EXPLORE DROPS 💥'
  const heroImage = extra.popart_hero_image_1 || extra.hero_image_1 || extra.banner_url || shop?.banner || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80'

  return (
    <div>
      {/* Neobrutalist Sticker Hero */}
      <section className="py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-block bg-cyan-300 border-3 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[4px_4px_0px_#000] rotate-1">
            {badge}
          </div>

          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-none text-black drop-shadow-[4px_4px_0px_#EC4899]">
            {headline}
          </h1>

          <p className="text-lg font-extrabold bg-white border-3 border-black p-4 shadow-[5px_5px_0px_#000] max-w-xl">
            {subtitle}
          </p>

          <div>
            <button
              onClick={() => navigate(catalogUrl)}
              className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg uppercase border-3 border-black shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all"
            >
              {cta}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_#000] rotate-2">
            <img
              src={getImageUrl(heroImage)}
              alt=""
              className="w-full h-80 object-cover border-2 border-black"
            />
            <div className="mt-3 bg-yellow-300 border-2 border-black p-2 text-center font-black text-sm uppercase">
              ★ FEATURED DROP OF THE WEEK ★
            </div>
          </div>
        </div>
      </section>

      <PopArtCatalog shop={shop} products={products} onQuickView={onQuickView} />
    </div>
  )
}

function PopArtCatalog({ shop, products = [], onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sort, setSort] = useState('default')
  const extra = shop?.theme?.extra_tokens || {}
  const catalogTitle = extra.popart_categories_title || (extra.template_id === 'popart' ? extra.categories_title : null) || '/// POP CULTURE VAULT'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => (p.category?.name || p.category_name || p.category || 'DROPS').toUpperCase()))
    return ['ALL', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category?.name || p.category_name || p.category || 'DROPS').toUpperCase()
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
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000] mb-6 gap-4">
        <h2 className="text-2xl font-black uppercase">💥 PRODUCT CATALOG</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH DROPS..."
            className="border-3 border-black px-4 py-2 font-bold text-sm bg-yellow-100 outline-none w-40 sm:w-64 shadow-[3px_3px_0px_#000]"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border-3 border-black px-3 py-2 font-bold text-xs bg-yellow-100 outline-none shadow-[3px_3px_0px_#000] cursor-pointer uppercase"
          >
            <option value="default">FEATURED</option>
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
              className={`px-4 py-1.5 border-3 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                selectedCategory === cat ? 'bg-pink-500 text-white' : 'bg-white text-black hover:bg-yellow-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 text-center font-black text-lg shadow-[6px_6px_0px_#000]">
          NO DROPS FOUND! 💥
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((p, idx) => {
            const img = p.primary_image || p.image || p.images?.[0]?.medium || p.images?.[0]?.image
            const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
            const price = Number(p.base_price || p.price || 0)

            return (
              <div
                key={p.id || idx}
                className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_#000] hover:-translate-y-1 transition-transform flex flex-col justify-between"
              >
                <div className="relative h-56 bg-pink-100 border-2 border-black overflow-hidden mb-4 cursor-pointer" onClick={() => onQuickView?.(p)}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">💥</div>
                  )}

                  <span className="absolute top-2 left-2 bg-yellow-300 border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase shadow-[2px_2px_0px_#000]">
                    HOT DROP
                  </span>

                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickView?.(p); }}
                    className="absolute top-2 right-2 bg-white border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    INSPECT 🔍
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <h3 className="text-lg font-black uppercase truncate leading-tight cursor-pointer" onClick={() => onQuickView?.(p)}>{p.name}</h3>
                  <p className="text-xs text-gray-700 font-bold line-clamp-2">{p.description || 'Exclusive item.'}</p>
                </div>

                <div className="pt-3 border-t-3 border-black flex items-center justify-between">
                  <span className="text-xl font-black bg-cyan-300 border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                    ₦{price.toLocaleString()}
                  </span>

                  <button
                    onClick={() => addToCart(p)}
                    className="bg-pink-500 text-white border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:bg-pink-600 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    + ADD
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

function PopArtQuickModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const price = Number(product.base_price || product.price || 0)
  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 font-black">
      <div className="bg-white border-4 border-black p-6 sm:p-8 max-w-md w-full shadow-[10px_10px_0px_#000] space-y-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 bg-pink-500 text-white border-2 border-black w-8 h-8 flex items-center justify-center hover:bg-pink-600 font-bold">✕</button>
        <span className="bg-yellow-300 border-2 border-black px-3 py-1 text-xs uppercase shadow-[2px_2px_0px_#000] inline-block">💥 QUICK INSPECT</span>
        {imgSrc ? (
          <div className="w-full h-48 bg-pink-100 border-3 border-black overflow-hidden shadow-[3px_3px_0px_#000]">
            <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 bg-yellow-100 border-3 border-black flex items-center justify-center text-4xl shadow-[3px_3px_0px_#000]">
            💥
          </div>
        )}
        <h2 className="text-2xl font-black uppercase">{product.name}</h2>
        <p className="text-sm font-bold text-gray-700">{product.description || 'Exclusive loud pop art piece.'}</p>
        
        <div className="flex items-center justify-between border-y-3 border-black py-2">
          <div className="text-2xl font-black bg-cyan-300 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_#000]">₦{(price * quantity).toLocaleString()}</div>
          <div className="flex items-center border-2 border-black bg-yellow-100">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 font-black text-base hover:bg-yellow-300">-</button>
            <span className="px-3 font-black text-sm">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 font-black text-base hover:bg-yellow-300">+</button>
          </div>
        </div>

        <button onClick={() => { addToCart({ ...product, quantity }); onClose() }} className="w-full py-4 bg-pink-500 text-white font-black border-3 border-black shadow-[4px_4px_0px_#000] text-base uppercase hover:bg-pink-600 active:translate-x-1 active:translate-y-1">ADD TO BAG 💥</button>
      </div>
    </div>
  )
}

function PopArtCartDrawer({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty } = useCart()
  const baseSlug = shopSlug || shop?.slug || ''
  if (!isCartOpen) return null
  const items = Array.isArray(cart) ? cart : (cart?.items || [])
  const total = items.reduce((s, i) => s + Number(i.unit_price || i.price || 0) * (i.quantity || 1), 0)
  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 font-black">
      <div className="w-full max-w-md h-full bg-[#FEF08A] border-l-4 border-black p-6 flex flex-col justify-between shadow-[8px_0px_0px_#000]">
        <div className="flex justify-between items-center border-b-4 border-black pb-4 bg-white p-3 shadow-[4px_4px_0px_#000]">
          <h3 className="text-xl uppercase">💥 CART ({items.length})</h3>
          <button onClick={() => setIsCartOpen(false)} className="bg-pink-500 text-white border-2 border-black w-8 h-8 hover:bg-pink-600 font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-700 text-sm uppercase bg-white border-3 border-black p-4 shadow-[3px_3px_0px_#000]">
              YOUR CART IS EMPTY! 💥
            </div>
          ) : (
            items.map((it, idx) => {
              const itemPrice = Number(it.unit_price || it.price || 0)
              const qty = it.quantity || 1
              return (
                <div key={it.id || idx} className="flex justify-between items-center p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#000]">
                  <div>
                    <p className="font-black text-sm uppercase">{it.name || it.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-bold mt-1">
                      <span>₦{itemPrice.toLocaleString()}</span>
                      <span>·</span>
                      <div className="inline-flex items-center border-2 border-black bg-yellow-100">
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty - 1)} className="px-1.5 py-0.2 hover:bg-yellow-300 font-black">-</button>
                        <span className="px-2 font-black text-black">{qty}</span>
                        <button onClick={() => handleUpdate && handleUpdate(it.id || it.product_id, qty + 1)} className="px-1.5 py-0.2 hover:bg-yellow-300 font-black">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-black">₦{(itemPrice * qty).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(it.id || it.product_id || it.product?.id)} className="text-xs bg-rose-500 text-white border-2 border-black px-2 py-0.5 hover:bg-rose-600 mt-1 block font-black">REMOVE</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-4 border-t-4 border-black space-y-3 bg-white p-4 shadow-[4px_4px_0px_#000]">
          <div className="flex justify-between text-xl font-black">
            <span>TOTAL</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => { setIsCartOpen(false); navigate(`/shop/${baseSlug}/checkout`) }}
            className={`w-full py-4 bg-pink-500 text-white border-3 border-black font-black text-lg uppercase shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'}`}
          >
            CHECKOUT 💥
          </button>
        </div>
      </div>
    </div>
  )
}

function PopArtCheckout({ shop, shopSlug }) {
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
      <div className="py-24 max-w-xl mx-auto px-6 text-center font-black">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000] space-y-4">
          <h2 className="text-3xl uppercase">💥 ORDER CONFIRMED!</h2>
          <p className="text-sm font-bold text-gray-700">YOUR ORDER HAS BEEN RECEIVED AND IS BEING PROCESSED.</p>
          {complete.delivery_code && (
            <div className="p-4 bg-cyan-300 border-3 border-black font-black text-2xl shadow-[4px_4px_0px_#000]">
              CODE: {complete.delivery_code}
            </div>
          )}
          <button onClick={() => navigate(`/shop/${baseSlug}`)} className="px-6 py-3 bg-pink-500 text-white border-3 border-black text-sm uppercase shadow-[4px_4px_0px_#000] hover:bg-pink-600">BACK TO STORE</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 max-w-4xl mx-auto px-6 font-black">
      <h1 className="text-4xl uppercase mb-6 drop-shadow-[3px_3px_0px_#EC4899]">💥 CHECKOUT</h1>
      {items.length === 0 ? (
        <div className="bg-white border-4 border-black p-8 shadow-[6px_6px_0px_#000] text-center space-y-4">
          <p className="text-lg uppercase">YOUR CART IS CURRENTLY EMPTY!</p>
          <button onClick={() => navigate(`/shop/${baseSlug}/catalog`)} className="px-6 py-3 bg-pink-500 text-white border-3 border-black uppercase text-sm shadow-[4px_4px_0px_#000] hover:bg-pink-600">
            EXPLORE DROPS 💥
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000] space-y-4">
            <input required placeholder="FULL NAME *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border-3 border-black bg-yellow-100 outline-none text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="PHONE NUMBER *" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 border-3 border-black bg-yellow-100 outline-none text-sm" />
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 border-3 border-black bg-yellow-100 outline-none text-sm">
                {['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Kano', 'Oyo'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea required placeholder="DELIVERY ADDRESS *" value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} className="w-full p-3 border-3 border-black bg-yellow-100 outline-none text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-pink-500 text-white border-4 border-black font-black text-xl uppercase shadow-[6px_6px_0px_#000] hover:bg-pink-600 active:translate-x-1 active:translate-y-1">
            {loading ? 'PROCESSING...' : `PLACE ORDER (₦${total.toLocaleString()})`}
          </button>
        </form>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, productAPI, getImageUrl } from '../services/api'

function ProductCard({ product }) {
  const img = product.primary_image || (product.images?.[0]?.medium || product.images?.[0]?.image)
  return (
    <Link to={`/product/${product.slug || product.public_id}`}>
      <motion.div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300" whileHover={{ y: -4 }}>
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {img ? (
            <img src={getImageUrl(typeof img === 'string' ? img : (img.medium || img.image))} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm">
            <span className="font-bold text-gray-900">${Number(product.base_price || 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{product.name}</h3>
          <div className="flex items-center gap-1 mt-2">
            <svg className="w-3.5 h-3.5 text-warning-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="text-xs text-gray-500">{Number(product.rating_average || 0).toFixed(1)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function ShopPage() {
  const { shopSlug } = useParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      shopAPI.detail(shopSlug),
      productAPI.list({ shop: shopSlug, page_size: 50 }),
      shopAPI.reviews(shopSlug),
    ]).then(([shopRes, prodRes, revRes]) => {
      if (shopRes.status === 'fulfilled') setShop(shopRes.value)
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value?.results || prodRes.value || [])
      if (revRes.status === 'fulfilled') setReviews(revRes.value?.results || revRes.value || [])
    }).finally(() => setLoading(false))
  }, [shopSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="h-64 bg-gray-200 animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 -mt-20">
          <div className="w-28 h-28 rounded-3xl bg-gray-300 animate-pulse border-4 border-white" />
          <div className="mt-4 space-y-3"><div className="h-8 bg-gray-200 rounded w-64" /><div className="h-4 bg-gray-200 rounded w-96" /></div>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900">Shop not found</h2>
          <p className="text-gray-500 mt-2">This shop may no longer exist.</p>
          <Link to="/" className="mt-6 inline-block px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold">Back to Home</Link>
        </div>
      </div>
    )
  }

  // Apply shop theme colors if available
  const theme = shop.theme || {}
  const primaryColor = theme.primary_color || '#4f46e5'
  const textColor = theme.text_color || '#111827'
  const mutedTextColor = theme.muted_text_color || '#6B7280'

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${theme.secondary_color || '#7c3aed'})` }}>
        {shop.banner && <img src={getImageUrl(shop.banner)} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      {/* Shop header */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative -mt-16 flex flex-col md:flex-row md:items-start gap-5 mb-8">
          {/* Logo */}
          <div className="w-28 h-28 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden flex-shrink-0 flex items-center justify-center">
            {shop.logo ? (
              <img src={getImageUrl(shop.logo)} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold" style={{ color: primaryColor }}>{shop.name?.[0]}</span>
            )}
          </div>

          <div className="flex-1 mb-2">
            {/* md:h-16 forces exactly 64px height on desktop so the name overlaps the banner completely */}
            <div className="md:h-16 flex items-center gap-3">
              <h1 className="text-3xl font-bold md:!text-white md:drop-shadow-lg" style={{ color: textColor }}>{shop.name}</h1>
              {shop.is_verified && (
                <span className="px-3 py-1 rounded-full bg-success-100 text-success-700 text-xs font-semibold shadow-sm">✓ Verified</span>
              )}
            </div>
            
            {/* Starts exactly below the banner line on desktop */}
            <div className="md:pt-2">
              <p className="mt-2 md:mt-0 max-w-2xl font-medium" style={{ color: mutedTextColor }}>{shop.tagline || shop.description}</p>
              <div className="flex items-center gap-5 mt-3 md:mt-2 text-sm font-medium" style={{ color: mutedTextColor }}>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-warning-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {Number(shop.rating_average || 0).toFixed(1)} ({shop.rating_count || 0} reviews)
                </span>
                <span>{products.length} products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-8">
          {[
            { key: 'products', label: 'Products', count: products.length },
            { key: 'reviews', label: 'Reviews', count: reviews.length },
            { key: 'about', label: 'About' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t.label} {t.count != null && <span className="text-gray-400 ml-1">({t.count})</span>}
              {tab === t.key && (
                <motion.div layoutId="shop-tab" className="absolute bottom-0 inset-x-0 h-0.5 rounded-full" style={{ background: primaryColor }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-16">
                  {products.map(p => <ProductCard key={p.slug || p.public_id} product={p} />)}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-500">This shop hasn't added products yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl pb-16">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm">
                          {r.user_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.user_name || 'Anonymous'}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, j) => (
                              <svg key={j} className={`w-3.5 h-3.5 ${j < r.rating ? 'text-warning-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-500">No reviews yet — be the first!</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl pb-16">
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About {shop.name}</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{shop.description || 'No description provided.'}</p>
                {shop.city && (
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {[shop.city, shop.state, shop.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
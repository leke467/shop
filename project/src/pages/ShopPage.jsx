import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, productAPI, getImageUrl, handleImageError, getProductPlaceholderUrl } from '../services/api'
import { useUser } from '../context/UserContext'
import { useShop, getTemplateShopCache, setTemplateShopCache } from '../context/ShopContext'
import { useNotification } from '../context/NotificationContext'
import SEOHead from '../components/SEOHead'
import TemplateRouter from '../templates/TemplateRouter'
import BrandLogoRenderer from '../components/shop/BrandLogoRenderer'

function ProductCard({ product }) {
  const img = product.primary_image || (product.images?.[0]?.medium || product.images?.[0]?.image)
  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image), product.name) : getProductPlaceholderUrl(product.name)

  return (
    <Link to={`/product/${product.slug || product.public_id}`}>
      <motion.div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300" whileHover={{ y: -4 }}>
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <img 
            src={imgSrc} 
            alt={product.name} 
            onError={(e) => handleImageError(e, 'product', product.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm">
            <span className="font-bold text-gray-900">₦{Number(product.base_price || 0).toLocaleString()}</span>
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
  const { user } = useUser()
  const { activeTemplateShop, setActiveTemplateShop } = useShop() || {}
  const { toast } = useNotification()

  // Report Shop State
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('scam')
  const [reportDetails, setReportDetails] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const handleReport = async (e) => {
    e.preventDefault()
    setReporting(true)
    try {
      await shopAPI.reportShop(shopSlug, { reason: reportReason, details: reportDetails })
      setReportSuccess(true)
      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess(false)
        setReportDetails('')
      }, 3000)
    } catch (err) {
      console.error('Report failed', err)
      toast(err.response?.data?.detail || err.response?.data?.error || 'Failed to report shop. Please try again.', 'error')
    } finally {
      setReporting(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      shopAPI.detail(shopSlug),
      productAPI.list({ shop: shopSlug, page_size: 50 }),
      shopAPI.reviews(shopSlug),
    ]).then(([shopRes, prodRes, revRes]) => {
      if (shopRes.status === 'fulfilled') {
        const fetchedShop = shopRes.value
        setShop(fetchedShop)
        setTemplateShopCache(fetchedShop?.slug, fetchedShop?.template_id)
        if (setActiveTemplateShop) {
          setActiveTemplateShop(fetchedShop?.template_id ? fetchedShop : null)
        }
      }
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value?.results || prodRes.value || [])
      if (revRes.status === 'fulfilled') setReviews(revRes.value?.results || revRes.value || [])
    }).finally(() => setLoading(false))

    return () => {
      if (setActiveTemplateShop) setActiveTemplateShop(null)
    }
  }, [shopSlug, setActiveTemplateShop])

  if (loading) {
    const cachedTemplateId = getTemplateShopCache(shopSlug)
    const isTemplate = Boolean(shop?.template_id || activeTemplateShop?.template_id || cachedTemplateId)

    if (isTemplate) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

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

  // If this shop has a premium template, render it instead of the default storefront
  if (shop.template_id) {
    return (
      <TemplateRouter
        shop={shop}
        products={products}
        reviews={reviews}
        shopSlug={shopSlug}
      />
    )
  }

  // Apply shop theme colors if available
  const theme = shop.theme || {}
  const primaryColor = theme.primary_color || '#4f46e5'
  const textColor = theme.text_color || '#111827'
  const mutedTextColor = theme.muted_text_color || '#6B7280'

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative">
      <SEOHead 
        title={shop.name} 
        description={shop.tagline || shop.description || `Shop ${shop.name} on our marketplace.`} 
      />

      {shop.is_locked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pt-16 bg-white/40 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md text-center mx-4">
            <div className="w-16 h-16 bg-error-50 text-error-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {user?.email === shop.owner_email ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Subscription Expired</h2>
                <p className="text-gray-500 mt-2 mb-6">Your shop is currently hidden from customers because your subscription limits have been exceeded. Please upgrade your plan or remove excess products/shops to reactivate it.</p>
                <Link to="/seller/dashboard" className="block w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Shop Unavailable</h2>
                <p className="text-gray-500 mt-2 mb-6">This shop is currently inactive and cannot accept orders at this time.</p>
                <Link to="/" className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  Back to Explore
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className={shop.is_locked ? 'pointer-events-none opacity-50 select-none' : ''}>
        {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${theme.secondary_color || '#7c3aed'})` }}>
        {(shop.banner || shop.theme?.extra_tokens?.banner_url) && (
          <img src={getImageUrl(shop.banner || shop.theme?.extra_tokens?.banner_url)} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      {/* Shop header */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative -mt-16 flex flex-col md:flex-row md:items-start gap-5 mb-8">
          {/* Logo */}
          <div className="w-28 h-28 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden flex-shrink-0 flex items-center justify-center">
            {(shop.logo || shop.theme?.extra_tokens?.logo_url) ? (
              <img src={getImageUrl(shop.logo || shop.theme?.extra_tokens?.logo_url)} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold" style={{ color: primaryColor }}>{shop.name?.[0]}</span>
            )}
          </div>

          <div className="flex-1 mb-2">
            {/* md:h-16 forces exactly 64px height on desktop so the name overlaps the banner completely */}
            <div className="md:h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold md:!text-white md:drop-shadow-lg" style={{ color: textColor }}>{shop.name}</h1>
                {shop.is_verified && (
                  <span className="px-3 py-1 rounded-full bg-success-100 text-success-700 text-xs font-semibold shadow-sm">✓ Verified</span>
                )}
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-error-50 text-error-600 hover:bg-error-100 font-medium transition-colors hidden md:flex items-center gap-1"
              >
                🚩 Report Shop
              </button>
            </div>
            
            {/* Starts exactly below the banner line on desktop */}
            <div className="md:pt-2">
              <p className="mt-2 md:mt-0 max-w-2xl font-medium" style={{ color: mutedTextColor }}>{shop.tagline || shop.description}</p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-3">
                {shop.social_facebook && (
                  <a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {shop.social_instagram && (
                  <a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {shop.social_twitter && (
                  <a href={shop.social_twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                  </a>
                )}
                {shop.website && (
                  <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </a>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 md:mt-4">
                <div className="flex items-center gap-5 text-sm font-medium" style={{ color: mutedTextColor }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-warning-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {Number(shop.rating_average || 0).toFixed(1)} ({shop.rating_count || 0} reviews)
                  </span>
                  <span>{products.length} products</span>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="md:hidden text-xs px-3 py-1.5 rounded-lg bg-error-50 text-error-600 hover:bg-error-100 font-medium transition-colors flex items-center gap-1"
                >
                  🚩 Report
                </button>
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

      </div> {/* End blur wrapper */}

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Report Shop</h3>
                {reportSuccess ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                    <p className="font-medium text-gray-900">Report Submitted</p>
                    <p className="text-sm text-gray-500 mt-1">Thank you for helping keep our community safe. Our team will review this shop shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleReport}>
                    <p className="text-sm text-gray-600 mb-6">If you believe this shop is violating our terms, please let us know.</p>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Report</label>
                        <select 
                          value={reportReason} 
                          onChange={e => setReportReason(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          <option value="scam">Scam / Fraud</option>
                          <option value="fake_products">Counterfeit / Fake Products</option>
                          <option value="harassment">Harassment / Abusive Behavior</option>
                          <option value="non_delivery">Never received my order</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (Optional)</label>
                        <textarea
                          value={reportDetails}
                          onChange={e => setReportDetails(e.target.value)}
                          rows="4"
                          placeholder="Please provide any extra context that will help us investigate..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowReportModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                      <button type="submit" disabled={reporting} className="px-5 py-2.5 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50">
                        {reporting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
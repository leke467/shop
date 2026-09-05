import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
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

  const handleShareStore = () => {
    const url = window.location.href
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      toast('Store link copied to clipboard!')
    } else {
      toast('Store link: ' + url)
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

  // If this shop has a premium template or user is previewing one, render it
  const previewTemplateId = searchParams.get('preview_template')
  const activeTemplateId = previewTemplateId || shop.template_id

  if (activeTemplateId) {
    const previewShop = previewTemplateId ? { ...shop, template_id: previewTemplateId } : shop
    return (
      <TemplateRouter
        shop={previewShop}
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
        {/* Banner Hero Showcase */}
        <div className="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-gray-900">
          {(shop.banner || shop.theme?.extra_tokens?.banner_url) ? (
            <img
              src={getImageUrl(shop.banner || shop.theme?.extra_tokens?.banner_url)}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full relative"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${theme.secondary_color || '#7c3aed'})`
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30" />
            </div>
          )}
          {/* Subtle vignette scrim to frame the banner cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Store Profile Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-14 sm:-mt-18 md:-mt-22 mb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-6">
              {/* Store Avatar / Logo */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-4 ring-white border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative z-10">
                {(shop.logo || shop.theme?.extra_tokens?.logo_url) ? (
                  <img
                    src={getImageUrl(shop.logo || shop.theme?.extra_tokens?.logo_url)}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${theme.secondary_color || '#7c3aed'})` }}
                  >
                    {shop.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>

              {/* Title & Actions Bar */}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 md:pt-0">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1
                      className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
                      style={{ color: textColor }}
                    >
                      {shop.name}
                    </h1>
                    {shop.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                        <svg className="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Seller
                      </span>
                    )}
                  </div>
                  {shop.state && (
                    <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                      <span>📍</span> {shop.state}, Nigeria
                    </p>
                  )}
                </div>

                {/* Header CTA & Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleShareStore}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold border border-gray-200 shadow-xs flex items-center gap-1.5 transition-all hover:border-gray-300"
                    title="Share Store"
                  >
                    <span>🔗</span>
                    <span>Share Store</span>
                  </button>
                  {shop.phone && (
                    <a
                      href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <span>💬</span>
                      <span>Chat Seller</span>
                    </a>
                  )}
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors flex items-center gap-1"
                    title="Report Shop"
                  >
                    <span>🚩</span>
                    <span className="hidden sm:inline">Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Store Description & Trust Pills */}
            <div className="mt-4 sm:mt-5 space-y-3.5">
              {/* Trust Signals Strip */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 font-bold">
                  <svg className="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{Number(shop.rating_average || 0).toFixed(1)}</span>
                  <span className="text-amber-700/80 font-normal">({shop.rating_count || 0} reviews)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200/80 text-gray-800 font-semibold">
                  <span>📦</span>
                  <span>{products.length} Products</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                  <span>🛡️</span>
                  <span>Escrow Buyer Protected</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
                  <span>🚚</span>
                  <span>Doorstep Delivery</span>
                </span>
              </div>

              {/* Tagline / Bio Description */}
              {(shop.tagline || shop.description) && (
                <p
                  className="text-sm sm:text-base leading-relaxed max-w-3xl font-normal"
                  style={{ color: mutedTextColor }}
                >
                  {shop.tagline || shop.description}
                </p>
              )}

              {/* Social Links & Web Pills */}
              {(shop.social_facebook || shop.social_instagram || shop.social_twitter || shop.website) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {shop.website && (
                    <a
                      href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Website</span>
                    </a>
                  )}
                  {shop.social_instagram && (
                    <a
                      href={shop.social_instagram.startsWith('http') ? shop.social_instagram : `https://instagram.com/${shop.social_instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                  )}
                  {shop.social_facebook && (
                    <a
                      href={shop.social_facebook.startsWith('http') ? shop.social_facebook : `https://facebook.com/${shop.social_facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  )}
                  {shop.social_twitter && (
                    <a
                      href={shop.social_twitter.startsWith('http') ? shop.social_twitter : `https://twitter.com/${shop.social_twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Twitter / X</span>
                    </a>
                  )}
                </div>
              )}
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
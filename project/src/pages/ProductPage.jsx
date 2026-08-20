import { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { productAPI, shopAPI, getImageUrl, orderAPI, productReviewAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import SEOHead from '../components/SEOHead'

export default function ProductPage() {
  const { productSlug } = useParams()
  const { user, isAuthenticated } = useUser()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [wishlistToast, setWishlistToast] = useState(null)
  const [tab, setTab] = useState('description')

  // Reviews State
  const [reviews, setReviews] = useState([])
  const [hasPurchased, setHasPurchased] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const handleWishlistToggle = () => {
    if (!product) return
    const added = toggleWishlist({
      id: product.id || product.public_id,
      slug: productSlug,
      name: product.name,
      price: selectedVariant?.price || product.base_price || 0,
      shop_name: product.shop_name,
      shop_slug: product.shop_slug,
      image: getImageUrl(product.images?.[0]?.thumbnail || product.images?.[0]?.image || ''),
    })
    setWishlistToast(added ? 'Added to your wishlist! ❤️' : 'Removed from your wishlist')
    setTimeout(() => setWishlistToast(null), 3000)
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    setReviewError('')
    try {
      const newReview = await productReviewAPI.create(productSlug, reviewForm)
      setReviews([newReview, ...reviews])
      setReviewForm({ rating: 5, title: '', comment: '' })
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 4000)
    } catch(err) {
      console.error(err)
      setReviewError(err.response?.data?.detail || err.response?.data?.error || 'Failed to submit review. Please try again.')
    }
    setSubmittingReview(false)
  }

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
      await shopAPI.reportShop(product.shop_slug, { reason: reportReason, description: reportDetails })
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
    productAPI.detail(productSlug)
      .then(data => {
        setProduct(data)
        if (data.variants?.length) setSelectedVariant(data.variants[0])
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))

    productReviewAPI.list(productSlug).then(data => setReviews(data.results || data || [])).catch(() => {})
    if (isAuthenticated) {
      if (orderAPI.checkPurchased) {
        orderAPI.checkPurchased(productSlug).then(data => setHasPurchased(data?.has_purchased || false)).catch(() => setHasPurchased(true))
      } else {
        setHasPurchased(true) // Mock fallback
      }
    }
  }, [productSlug, isAuthenticated])

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    setAddingToCart(true)
    try {
      await addToCart({
        variant_id: selectedVariant.id,
        quantity,
        product_name: product.name,
        variant_name: selectedVariant.name,
        unit_price: selectedVariant.price,
      })
      setCartSuccess(true)
      setTimeout(() => setCartSuccess(false), 3000)
    } catch (err) {
      console.error('Add to cart failed', err)
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-200 rounded-3xl animate-pulse" />
            <div className="space-y-4 pt-8">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-40" />
              <div className="h-24 bg-gray-200 rounded w-full mt-8" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <Link to="/" className="mt-6 inline-block px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold">Back to Home</Link>
        </div>
      </div>
    )
  }

  const images = product.images || []
  const currentImage = images[selectedImage]
  const variants = product.variants || []
  const price = selectedVariant?.price || product.base_price || 0
  const comparePrice = product.compare_at_price
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0

  const isLocked = product.is_locked

  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative">
      <SEOHead 
        title={product.name} 
        description={product.description?.substring(0, 150) || `Buy ${product.name} on our marketplace.`} 
      />

      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pt-20 bg-white/40 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md text-center mx-4">
            <div className="w-16 h-16 bg-error-50 text-error-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {user?.shops?.some(s => s.slug === product.shop_slug) ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Subscription Expired</h2>
                <p className="text-gray-500 mt-2 mb-6">This product is hidden from customers because your subscription limits have been exceeded. Please upgrade your plan or remove excess products/shops to reactivate.</p>
                <Link to="/seller/dashboard" className="block w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Product Unavailable</h2>
                <p className="text-gray-500 mt-2 mb-6">This product is currently unavailable for purchase.</p>
                <Link to="/" className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  Back to Explore
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className={isLocked ? 'pointer-events-none opacity-50 select-none' : ''}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/explore/products" className="hover:text-primary-600 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={getImageUrl(currentImage?.large || currentImage?.image || '')}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {discount > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-error-500 text-white text-sm font-bold shadow-sm">
                  -{discount}%
                </div>
              )}
              {/* Wishlist toggle button on image */}
              <button
                onClick={handleWishlistToggle}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-red-500"
                title={isInWishlist(productSlug || product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <svg
                  className={`w-6 h-6 transition-colors ${
                    isInWishlist(productSlug || product.id)
                      ? 'fill-red-500 text-red-500'
                      : 'fill-none stroke-current'
                  }`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImage === i ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={getImageUrl(img.thumbnail || img.image)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:pt-4">
            {/* Shop link and Report */}
            <div className="flex items-center justify-between mb-3">
              <Link to={`/shop/${product.shop_slug || ''}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                  {product.shop_name?.[0] || 'S'}
                </div>
                {product.shop_name || 'Shop'}
              </Link>
              {product.shop_slug && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs text-gray-400 hover:text-error-600 transition-colors flex items-center gap-1"
                >
                  🚩 Report Shop
                </button>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.round(product.rating_average || 0) ? 'text-warning-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.rating_count || 0} reviews</span>
              {product.purchase_count > 0 && <span className="text-sm text-gray-400">• {product.purchase_count} sold</span>}
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">₦{Number(price).toLocaleString()}</span>
              {comparePrice && (
                <span className="text-xl text-gray-400 line-through">₦{Number(comparePrice).toLocaleString()}</span>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.public_id || v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        selectedVariant?.id === v.id || selectedVariant?.public_id === v.public_id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {v.name || v.sku}
                      {v.price && <span className="ml-2 text-gray-400">₦{Number(v.price).toLocaleString()}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart + Wishlist Toggle */}
            <div className="mt-8 flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors font-bold">−</button>
                <span className="px-5 py-3 text-gray-900 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors font-bold">+</button>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl disabled:opacity-60 transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: addingToCart ? 1 : 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {addingToCart ? (
                  <span>Adding…</span>
                ) : cartSuccess ? (
                  <span>✓ Added to Cart!</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span>Add to Cart</span>
                  </>
                )}
              </motion.button>

              <button
                onClick={handleWishlistToggle}
                className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-center ${
                  isInWishlist(productSlug || product.id)
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-red-500 bg-white'
                }`}
                title={isInWishlist(productSlug || product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <svg
                  className={`w-6 h-6 transition-colors ${
                    isInWishlist(productSlug || product.id)
                      ? 'fill-red-500 text-red-500'
                      : 'fill-none stroke-current'
                  }`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Toasts */}
            <AnimatePresence>
              {cartSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3.5 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Added to your cart!</span>
                  </div>
                  <Link to="/cart" className="font-bold underline text-success-800 hover:text-success-900">View Cart &rarr;</Link>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {wishlistToast && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-sm flex items-center justify-between shadow-sm"
                >
                  <span>{wishlistToast}</span>
                  <Link to="/wishlist" className="font-bold underline text-purple-800 hover:text-purple-900">View Wishlist &rarr;</Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs — Description / Reviews */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <div className="flex gap-1 mb-6">
                {['description', 'reviews'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === 'description' && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description || 'No description available.'}</p>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="py-6">
                  {/* Summary */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-4xl font-bold text-gray-900">{product.rating_average?.toFixed(1) || '0.0'}</div>
                    <div>
                      <div className="flex text-warning-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-5 h-5 ${i < Math.round(product.rating_average || 0) ? 'text-warning-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">Based on {product.rating_count || 0} reviews</p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="mb-10 bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                    {reviewSuccess && (
                      <div className="mb-4 p-3.5 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium">
                        ✓ Your review has been submitted successfully!
                      </div>
                    )}
                    {reviewError && (
                      <div className="mb-4 p-3.5 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm font-medium">
                        ⚠️ {reviewError}
                      </div>
                    )}
                    {!isAuthenticated ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">You must be logged in to leave a review.</p>
                        <Link to="/login" className="inline-block px-5 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">Log In</Link>
                      </div>
                    ) : hasPurchased ? (
                      <form onSubmit={submitReview} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                          <div className="flex gap-1 cursor-pointer">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg 
                                key={star} 
                                onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                                className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-warning-400' : 'text-gray-300'} fill-current hover:text-warning-400 transition-colors`} 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <div>
                          <input type="text" required placeholder="Review Title" value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <textarea required placeholder="Write your comment..." value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} rows="4" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                        </div>
                        <button type="submit" disabled={submittingReview} className="px-6 py-2 bg-primary-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-primary-700 transition-colors">
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <p className="text-gray-600">You must purchase this product to leave a review.</p>
                    )}
                  </div>

                  {/* List */}
                  <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500">No reviews yet.</p>
                    ) : (
                      reviews.map((r, i) => (
                        <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{r.user_name || r.user?.name || 'Anonymous'}</span>
                                {r.verified_purchase && <span className="text-[10px] bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-bold uppercase">Verified Purchase</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, j) => (
                                    <svg key={j} className={`w-3.5 h-3.5 ${j < r.rating ? 'text-warning-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                              </div>
                            </div>
                          </div>
                          {r.title && <h4 className="font-semibold text-gray-800 mb-1">{r.title}</h4>}
                          <p className="text-gray-600 text-sm">{r.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
                          <option value="non_delivery">Never Received Order</option>
                          <option value="harassment">Harassment / Abusive Behavior</option>
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
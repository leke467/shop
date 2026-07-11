import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { productAPI, getImageUrl, orderAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'

export default function ProductPage() {
  const { productSlug } = useParams()
  const { isAuthenticated } = useUser()
  const { refreshCart } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [tab, setTab] = useState('description')

  useEffect(() => {
    setLoading(true)
    productAPI.detail(productSlug)
      .then(data => {
        setProduct(data)
        if (data.variants?.length) setSelectedVariant(data.variants[0])
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [productSlug])

  const handleAddToCart = async () => {
    if (!isAuthenticated) { window.location.href = '/login'; return }
    if (!selectedVariant) return
    setAddingToCart(true)
    try {
      await orderAPI.addToCart({
        variant: selectedVariant.public_id || selectedVariant.id,
        quantity,
      })
      setCartSuccess(true)
      if (refreshCart) refreshCart()
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

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
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
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-error-500 text-white text-sm font-bold">
                  -{discount}%
                </div>
              )}
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
            {/* Shop link */}
            <Link to={`/shop/${product.shop?.slug || ''}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                {product.shop?.name?.[0] || 'S'}
              </div>
              {product.shop?.name || 'Shop'}
            </Link>

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
              <span className="text-4xl font-bold text-gray-900">${Number(price).toFixed(2)}</span>
              {comparePrice && (
                <span className="text-xl text-gray-400 line-through">${Number(comparePrice).toFixed(2)}</span>
              )}
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Options</h3>
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
                      {v.price && <span className="ml-2 text-gray-400">${Number(v.price).toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors font-bold">−</button>
                <span className="px-5 py-3 text-gray-900 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors font-bold">+</button>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl disabled:opacity-60 transition-all duration-300"
                whileHover={{ scale: addingToCart ? 1 : 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {addingToCart ? 'Adding…' : cartSuccess ? '✓ Added to Cart!' : 'Add to Cart'}
              </motion.button>
            </div>

            {/* Success toast */}
            <AnimatePresence>
              {cartSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Added to your cart! <Link to="/cart" className="font-semibold underline">View Cart</Link>
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
                <div className="text-center py-10">
                  <p className="text-gray-500">Reviews coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function ProductCard({ product }) {
  const { addToCart } = useCart()
  
  // Normalize properties between backend Django API schema and legacy frontend keys
  const id = product.slug || product.public_id || product.id
  const name = product.name
  const image = product.primary_image || product.image
  const price = product.base_price || product.price
  const shopName = product.shop_name || product.shopName
  const shopId = product.shop_slug || product.shopId
  const rating = Number(product.rating_average || product.rating || 0).toFixed(1)
  const reviewCount = product.rating_count || product.reviewCount || 0
  const inventory = product.inventory ?? 100

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Normalise cart call to use standard variant if available
    const standardVariant = product.variants?.[0] || { id: id, public_id: id, price: price }
    addToCart(product, shopId)
  }

  return (
    <Link to={`/product/${id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden h-full card-hover border border-gray-100 flex flex-col"
      >
        <div className="relative h-48 overflow-hidden bg-gray-50 flex items-center justify-center">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <span className="text-gray-300 text-3xl">📦</span>
          )}
          {inventory < 10 && inventory > 0 && (
            <div className="absolute top-2 left-2 bg-warning-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              Only {inventory} left
            </div>
          )}
          {inventory === 0 && (
            <div className="absolute top-2 left-2 bg-error-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              Sold Out
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <div className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider mb-1">{shopName}</div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 leading-tight">{name}</h3>
            
            {/* Rating */}
            <div className="flex items-center mb-3">
              <svg className="h-3.5 w-3.5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-xs font-semibold text-gray-700">{rating}</span>
              <span className="mx-1 text-gray-400 text-xs">•</span>
              <span className="text-xs text-gray-400">{reviewCount} reviews</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-base font-bold text-gray-900">${Number(price || 0).toFixed(2)}</p>
            </div>
            
            <div className="flex gap-2">
              <Link 
                to={`/shop/${shopId}`} 
                className="flex-1 inline-flex items-center justify-center py-2 text-[11px] font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" 
                onClick={(e) => e.stopPropagation()}
              >
                Visit Shop
              </Link>
              <button 
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center py-2 text-[11px] font-semibold text-white bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-md shadow-primary-500/20 hover:opacity-95 transition-opacity"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default ProductCard
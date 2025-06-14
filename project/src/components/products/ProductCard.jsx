import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function ProductCard({ product }) {
  const { addToCart } = useCart()
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, product.shopId)
  }

  return (
    <Link to={`/product/${product.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden h-full card-hover"
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {product.inventory < 10 && product.inventory > 0 && (
            <div className="absolute top-2 left-2 bg-warning-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {product.inventory} left
            </div>
          )}
          {product.inventory === 0 && (
            <div className="absolute top-2 left-2 bg-error-500 text-white text-xs font-bold px-2 py-1 rounded">
              Sold Out
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-gray-500 mb-1">{product.shopName}</div>
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-xs text-gray-700">{product.rating}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-xs text-gray-500">{product.reviewCount} reviews</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
              {product.categories[0]}
            </span>
          </div>
          <div className="flex justify-between mt-4 space-x-2">
            <Link to={`/shop/${product.shopId}`} className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onClick={(e) => e.stopPropagation()}>
              Visit Shop
            </Link>
            <button 
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default ProductCard
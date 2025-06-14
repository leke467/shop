import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockProducts, mockShops } from '../data/mockData'
import { useCart } from '../context/CartContext'

function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [shop, setShop] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0)
    
    // Reset states
    setQuantity(1)
    setIsLoading(true)
    
    // Simulate API fetch
    setTimeout(() => {
      const foundProduct = mockProducts.find(p => p.id === productId)
      setProduct(foundProduct)
      
      if (foundProduct) {
        setSelectedImage(foundProduct.image)
        
        const foundShop = mockShops.find(s => s.id === foundProduct.shopId)
        setShop(foundShop)
      }
      
      setIsLoading(false)
    }, 500)
  }, [productId])

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, product.shopId)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-16 container-custom">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/explore/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-700 hover:text-primary-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <Link to="/explore/products" className="ml-1 text-gray-700 hover:text-primary-600">
                  Products
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-gray-500" aria-current="page">
                  {product.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Product Images */}
            <div className="p-6">
              <div className="mb-4 aspect-square overflow-hidden rounded-lg">
                <motion.img 
                  src={selectedImage} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  key={selectedImage}
                />
              </div>
              <div className="flex space-x-2 overflow-auto">
                {product.gallery.map((image, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === image ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} view ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="p-6 flex flex-col">
              <div className="flex justify-between">
                <Link 
                  to={`/shop/${product.shopId}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {product.shopName}
                </Link>
                <div className="flex items-center">
                  <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm text-gray-700">{product.rating}</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{product.reviewCount} reviews</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{product.name}</h1>
              
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                {product.inventory <= 5 && product.inventory > 0 && (
                  <span className="ml-2 text-sm text-warning-600">Only {product.inventory} left!</span>
                )}
                {product.inventory === 0 && (
                  <span className="ml-2 text-sm text-error-600">Out of stock</span>
                )}
              </div>

              <p className="text-gray-700 mb-4">{product.description}</p>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Features:</h3>
                <ul className="space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-600 hover:text-gray-700"
                    disabled={quantity <= 1}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center border-0 focus:ring-0"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-gray-600 hover:text-gray-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <div className="flex-grow">
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.inventory === 0}
                    className={`w-full btn ${
                      product.inventory === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-auto">
                <h3 className="font-semibold mb-2">About the shop:</h3>
                {shop && (
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src={shop.logo} 
                        alt={`${shop.name} logo`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-sm text-gray-600">{shop.ownerName}</p>
                    </div>
                    <Link 
                      to={`/shop/${shop.id}`}
                      className="ml-auto btn-outline text-sm"
                    >
                      Visit Shop
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockShops, mockProducts, mockFeatureFlags } from '../data/mockData'
import ProductCard from '../components/products/ProductCard'
import { useShop } from '../context/ShopContext'

function ShopPage() {
  const { shopId } = useParams()
  const { getShopFeatures } = useShop()
  const [shop, setShop] = useState(null)
  const [shopProducts, setShopProducts] = useState([])
  const [features, setFeatures] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0)
    
    // Simulate API fetch
    setTimeout(() => {
      const foundShop = mockShops.find(s => s.id === shopId)
      setShop(foundShop)
      
      if (foundShop) {
        // Get products for this shop
        const products = mockProducts.filter(p => p.shopId === shopId)
        setShopProducts(products)
        
        // Get feature flags for this shop
        const shopFeatures = mockFeatureFlags[shopId] || {}
        setFeatures(shopFeatures)
      }
      
      setIsLoading(false)
    }, 500)
  }, [shopId, getShopFeatures])

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen pt-24 pb-16 container-custom">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Shop Not Found</h1>
          <p className="text-gray-600 mb-8">The shop you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // Set shop colors for branded experience
  const primaryColor = shop.colors?.primary || '#3B82F6'
  const secondaryColor = shop.colors?.secondary || '#10B981'

  // Style variables for shop branding
  const shopStyle = {
    '--shop-primary': primaryColor,
    '--shop-secondary': secondaryColor,
  }

  return (
    <div className="min-h-screen pt-16 pb-16" style={shopStyle}>
      {/* Shop Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={shop.banner} 
          alt={`${shop.name} banner`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* Shop Info */}
      <div className="container-custom -mt-16 relative z-10">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex flex-col md:flex-row">
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden shadow-md flex-shrink-0">
                <img 
                  src={shop.logo} 
                  alt={`${shop.name} logo`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                <h1 className="text-3xl font-bold">{shop.name}</h1>
                <p className="text-gray-600 mt-1">{shop.description}</p>
                <div className="flex items-center justify-center md:justify-start mt-2">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-gray-700">{shop.rating}</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-gray-600">Since {new Date(shop.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Social Links (if feature is enabled) */}
            {features.socialLinks && (
              <div className="mt-6 md:mt-0 md:ml-auto flex items-center space-x-3">
                {shop.socialLinks?.facebook && (
                  <a href={shop.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {shop.socialLinks?.instagram && (
                  <a href={shop.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {shop.socialLinks?.twitter && (
                  <a href={shop.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container-custom mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {features.productListings && (
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products
              </button>
            )}
            {features.customOrders && (
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'custom'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Custom Orders
              </button>
            )}
            {features.reviews && (
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviews
              </button>
            )}
            {features.contact && (
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contact
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container-custom py-8">
        {/* Products Tab */}
        {activeTab === 'products' && features.productListings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Products</h2>
              {/* Additional filters could go here */}
            </div>

            {shopProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shopProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                <p className="mt-1 text-sm text-gray-500">This shop hasn't added any products yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Orders Tab */}
        {activeTab === 'custom' && features.customOrders && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Request a Custom Order</h2>
              <p className="text-gray-600">Need something specific? Fill out the form below and we'll get back to you.</p>
            </div>

            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input type="text" id="name" className="input mt-1" placeholder="Full Name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" id="email" className="input mt-1" placeholder="email@example.com" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Order Description</label>
                <textarea id="description" rows={4} className="input mt-1" placeholder="Describe what you're looking for in detail..." />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget Range</label>
                <select id="budget" className="input mt-1">
                  <option>Select a budget range</option>
                  <option>$0 - $50</option>
                  <option>$50 - $100</option>
                  <option>$100 - $500</option>
                  <option>$500+</option>
                </select>
              </div>
              <div>
                <button type="submit" className="btn-primary w-full">Submit Request</button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && features.reviews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
              <div className="flex justify-center items-center">
                <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-xl font-bold">{shop.rating}</span>
                <span className="mx-1 text-gray-400">•</span>
                <span className="text-gray-600">42 reviews</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mock reviews - in a real app, these would come from API */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">JD</div>
                    <div className="ml-3">
                      <p className="font-medium">John Doe</p>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`h-4 w-4 ${star <= 5 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-500">2 months ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-gray-700">
                  Absolutely love the products from this shop! Fast shipping and excellent customer service.
                  The quality exceeded my expectations and I'll definitely be ordering again.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold">AS</div>
                    <div className="ml-3">
                      <p className="font-medium">Alex Smith</p>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4].map((star) => (
                            <svg key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <svg className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">1 month ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-gray-700">
                  Good products overall, but shipping took longer than expected. The product quality was great 
                  and customer service was responsive when I had questions.
                </p>
              </div>

              <div className="text-center">
                <button className="btn-outline">Load More Reviews</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && features.contact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <span className="block font-medium">Email</span>
                      <a href={`mailto:${shop.email}`} className="text-primary-600 hover:text-primary-700">
                        {shop.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <span className="block font-medium">Phone</span>
                      <a href={`tel:${shop.phone}`} className="text-primary-600 hover:text-primary-700">
                        {shop.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <span className="block font-medium">Address</span>
                      <address className="not-italic text-gray-700">
                        {shop.address}
                      </address>
                    </div>
                  </li>
                </ul>

                {features.shipping && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Shipping Information</h3>
                    <p className="text-gray-700">
                      We typically process and ship orders within 1-2 business days.
                      Delivery times vary based on location, but generally range from 3-7 business days.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Send a Message</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Your Name</label>
                    <input type="text" id="contact-name" className="input mt-1" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="contact-email" className="input mt-1" />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input type="text" id="contact-subject" className="input mt-1" />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea id="contact-message" rows={4} className="input mt-1"></textarea>
                  </div>
                  <button type="submit" className="btn-primary">Send Message</button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ShopPage
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockProducts } from '../data/mockData'

function ShopDashboard() {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    inventory: ''
  })

  useEffect(() => {
    // Simulate fetching shop's products
    setProducts(mockProducts.slice(0, 3))
  }, [])

  const handleAddProduct = (e) => {
    e.preventDefault()
    // Add product logic here
    setProducts([...products, { ...newProduct, id: `product-${Date.now()}` }])
    setIsAddingProduct(false)
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      inventory: ''
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-custom">
        {/* Dashboard Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shop Dashboard</h1>
              <p className="text-gray-600">Manage your products, orders, and customer reviews</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="btn-primary"
              >
                Add New Product
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <nav className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'products'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inventory
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="h-10 w-10 rounded-full object-cover" 
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.categories[0]}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${product.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.inventory}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.inventory > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.inventory > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        You have 2 new orders that need processing
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Sample Order */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">Order #12345</span>
                          <span className="ml-2 px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                            Processing
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Placed on March 15, 2024</p>
                      </div>
                      <button className="btn-outline text-sm">View Details</button>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">2 items • $158.00</div>
                      <div className="mt-2 text-sm text-gray-700">
                        Shipping to: John Doe, 123 Main St, Anytown, USA
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="space-y-4">
                  {/* Sample Review */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">JD</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">John Doe</h3>
                          <p className="text-sm text-gray-500">March 16, 2024</p>
                        </div>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <svg
                              key={rating}
                              className={`h-5 w-5 ${
                                rating <= 4 ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          Great product! Exactly as described and arrived quickly.
                        </p>
                        <div className="mt-2">
                          <button className="text-sm text-primary-600 hover:text-primary-900">
                            Reply to review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <div className="max-w-3xl">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Settings</h3>
                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shop Features</label>
                      <div className="mt-2 space-y-4">
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-primary-600" />
                          <span className="ml-2 text-sm text-gray-700">Enable custom orders</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-primary-600" />
                          <span className="ml-2 text-sm text-gray-700">Show customer reviews</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox h-4 w-4 text-primary-600" />
                          <span className="ml-2 text-sm text-gray-700">Display social media links</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shop Description</label>
                      <textarea
                        rows={4}
                        className="mt-1 input"
                        placeholder="Describe your shop..."
                      ></textarea>
                    </div>

                    <div>
                      <button type="submit" className="btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Product Modal */}
        {isAddingProduct && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="input mt-1"
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="input mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Inventory</label>
                    <input
                      type="number"
                      value={newProduct.inventory}
                      onChange={(e) => setNewProduct({ ...newProduct, inventory: e.target.value })}
                      className="input mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="input mt-1"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home">Home</option>
                    <option value="Books">Books</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="input mt-1"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopDashboard
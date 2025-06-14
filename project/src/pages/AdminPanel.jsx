import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { mockShops, mockFeatureFlags } from '../data/mockData'
import { useShop } from '../context/ShopContext'
import { useUser } from '../context/UserContext'

function AdminPanel() {
  const { updateShopFeatures } = useShop()
  const { isAdmin } = useUser()
  const [shops, setShops] = useState([])
  const [features, setFeatures] = useState({})
  const [selectedShop, setSelectedShop] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setShops(mockShops)
      setFeatures(mockFeatureFlags)
      setIsLoading(false)
    }, 500)
  }, [])

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 pb-16 container-custom">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="mt-1 text-gray-500">You don't have permission to access the admin panel.</p>
          <div className="mt-6">
            <Link to="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleToggleFeature = (shopId, feature) => {
    const updatedFeatures = {
      ...features,
      [shopId]: {
        ...features[shopId],
        [feature]: !features[shopId][feature]
      }
    }
    setFeatures(updatedFeatures)
    updateShopFeatures(shopId, { [feature]: !features[shopId][feature] })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-custom">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-primary-600 text-white">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-primary-100">Manage shops and features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Sidebar - Shop List */}
            <div className="md:col-span-4 lg:col-span-3 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">All Shops</h2>
                <p className="text-sm text-gray-600">Select a shop to manage</p>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                <ul className="divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <li key={shop.id}>
                      <button
                        onClick={() => setSelectedShop(shop)}
                        className={`w-full text-left p-4 flex items-center hover:bg-gray-100 transition-colors ${
                          selectedShop?.id === shop.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={shop.logo}
                            alt={`${shop.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-grow">
                          <h3 className="font-medium text-gray-900">{shop.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{shop.ownerName}</p>
                        </div>
                        <div className="ml-2">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Content - Shop Management */}
            <div className="md:col-span-8 lg:col-span-9 p-6">
              {selectedShop ? (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="h-14 w-14 rounded-full overflow-hidden mr-4">
                      <img
                        src={selectedShop.logo}
                        alt={`${selectedShop.name} logo`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedShop.name}</h2>
                      <p className="text-gray-600">Created on {new Date(selectedShop.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto">
                      <Link
                        to={`/shop/${selectedShop.id}`}
                        className="btn-outline text-sm"
                        target="_blank"
                      >
                        View Shop
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Shop Features */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-4">Shop Features</h3>
                      <div className="space-y-4">
                        {features[selectedShop.id] && Object.entries(features[selectedShop.id]).map(([feature, enabled]) => (
                          <div key={feature} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                            <div>
                              <h4 className="font-medium">
                                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {feature === 'productListings' && 'Display product catalog'}
                                {feature === 'customOrders' && 'Allow custom product requests'}
                                {feature === 'reviews' && 'Show customer reviews and ratings'}
                                {feature === 'contact' && 'Display contact info and form'}
                                {feature === 'shipping' && 'Show shipping details'}
                                {feature === 'socialLinks' && 'Display social media links'}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`mr-3 text-sm ${enabled ? 'text-success-600' : 'text-gray-500'}`}>
                                {enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <button
                                onClick={() => handleToggleFeature(selectedShop.id, feature)}
                                disabled={feature === 'productListings'} // Core feature can't be disabled
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ease-in-out duration-200 ${
                                  feature === 'productListings' 
                                    ? 'bg-primary-600 cursor-not-allowed' 
                                    : enabled 
                                      ? 'bg-primary-600' 
                                      : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200 ${
                                    enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shop Info */}
                    <div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-lg mb-4">Shop Information</h3>
                        <dl className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">Owner</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{selectedShop.ownerName}</dd>
                          </div>
                          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{selectedShop.email}</dd>
                          </div>
                          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{selectedShop.phone || 'Not provided'}</dd>
                          </div>
                          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{selectedShop.address || 'Not provided'}</dd>
                          </div>
                          <div className="grid grid-cols-3 gap-4 py-2">
                            <dt className="text-sm font-medium text-gray-500">Categories</dt>
                            <dd className="text-sm text-gray-900 col-span-2">
                              <div className="flex flex-wrap gap-1">
                                {selectedShop.categories.map(category => (
                                  <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Action Buttons */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4">Actions</h3>
                        <div className="space-y-3">
                          <button className="w-full btn-primary">
                            Send Message to Owner
                          </button>
                          <button className="w-full btn-outline">
                            Download Shop Data
                          </button>
                          <button className="w-full btn bg-error-600 text-white hover:bg-error-700">
                            Suspend Shop
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No shop selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a shop from the list to view and manage its details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
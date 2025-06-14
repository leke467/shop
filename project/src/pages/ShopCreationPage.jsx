import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

function ShopCreationPage() {
  const navigate = useNavigate()
  const { createShop } = useShop()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    categories: [],
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981'
    },
    features: {
      productListings: true,
      customOrders: false,
      reviews: true,
      contact: true,
      shipping: false,
      socialLinks: false
    },
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  })

  const updateForm = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedForm = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }

  const handleCategoryChange = (category) => {
    setFormData(prev => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
      
      return {
        ...prev,
        categories: updatedCategories
      }
    })
  }

  const handleToggleFeature = (feature) => {
    updateNestedForm('features', feature, !formData.features[feature])
  }

  const goToNextStep = () => {
    window.scrollTo(0, 0)
    setStep(prev => prev + 1)
  }

  const goToPrevStep = () => {
    window.scrollTo(0, 0)
    setStep(prev => prev - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Create the shop
    const shopId = createShop(formData)
    
    // Navigate to the new shop page
    navigate(`/shop/${shopId}`)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.description && formData.email && formData.categories.length > 0
      case 2:
        return true // Features step always valid
      case 3:
        return true // Branding step always valid
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Shop</h1>
            <p className="text-gray-600">
              Set up your branded storefront and start selling your products to customers around the world.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      stepNumber === step 
                        ? 'bg-primary-600 text-white'
                        : stepNumber < step
                          ? 'bg-primary-200 text-primary-800'
                          : 'bg-gray-200 text-gray-600'
                    } transition-colors`}
                  >
                    {stepNumber < step ? (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <div className={`ml-2 text-sm ${stepNumber === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {stepNumber === 1 && 'Basic Information'}
                    {stepNumber === 2 && 'Shop Features'}
                    {stepNumber === 3 && 'Branding & Design'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 h-2 flex">
              <div className={`flex-1 rounded-l-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              <div className={`flex-1 rounded-r-full ${step >= 3 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Shop Name*</label>
                    <input 
                      type="text" 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      className="input mt-1" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner Name*</label>
                    <input 
                      type="text" 
                      id="owner" 
                      value={formData.ownerName}
                      onChange={(e) => updateForm('ownerName', e.target.value)}
                      className="input mt-1" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Shop Description*</label>
                  <textarea 
                    id="description" 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    className="input mt-1" 
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address*</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className="input mt-1" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      className="input mt-1" 
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Business Address</label>
                  <input 
                    type="text" 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className="input mt-1" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categories*</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports', 'Art & Crafts', 'Food', 'Books', 'Toys', 'Jewelry', 'Health'].map((category) => (
                      <label key={category} className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="form-checkbox h-5 w-5 text-primary-600 rounded" 
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                        />
                        <span className="ml-2 text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="button" 
                    onClick={goToNextStep}
                    className="btn-primary"
                    disabled={!isStepValid()}
                  >
                    Next: Shop Features
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 2: Shop Features */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Shop Features</h2>
              <p className="text-gray-600 mb-6">
                Select which features you want to enable for your shop. You can change these settings later.
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.productListings}
                        onChange={() => handleToggleFeature('productListings')}
                        disabled
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Product Listings</span>
                        <span className="text-gray-600 text-sm">
                          Display your products with photos, descriptions, and prices.
                          <span className="text-primary-700 ml-1">(Required)</span>
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.customOrders}
                        onChange={() => handleToggleFeature('customOrders')}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Custom Orders</span>
                        <span className="text-gray-600 text-sm">
                          Allow customers to request custom-made products through a form.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.reviews}
                        onChange={() => handleToggleFeature('reviews')}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Reviews</span>
                        <span className="text-gray-600 text-sm">
                          Display customer reviews and ratings for your shop.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.contact}
                        onChange={() => handleToggleFeature('contact')}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Contact Information</span>
                        <span className="text-gray-600 text-sm">
                          Display your contact details and a message form for customer inquiries.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.shipping}
                        onChange={() => handleToggleFeature('shipping')}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Shipping Information</span>
                        <span className="text-gray-600 text-sm">
                          Display shipping policies, rates, and delivery timeframes.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary-600 rounded mt-1" 
                        checked={formData.features.socialLinks}
                        onChange={() => handleToggleFeature('socialLinks')}
                      />
                      <div className="ml-3">
                        <span className="block font-medium text-gray-900">Social Media Links</span>
                        <span className="text-gray-600 text-sm">
                          Display links to your social media profiles.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.features.socialLinks && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-3">Social Media Profiles</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">Facebook URL</label>
                        <input 
                          type="url" 
                          id="facebook" 
                          value={formData.socialLinks.facebook}
                          onChange={(e) => updateNestedForm('socialLinks', 'facebook', e.target.value)}
                          className="input mt-1" 
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram URL</label>
                        <input 
                          type="url" 
                          id="instagram" 
                          value={formData.socialLinks.instagram}
                          onChange={(e) => updateNestedForm('socialLinks', 'instagram', e.target.value)}
                          className="input mt-1" 
                          placeholder="https://instagram.com/youraccount"
                        />
                      </div>
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter URL</label>
                        <input 
                          type="url" 
                          id="twitter" 
                          value={formData.socialLinks.twitter}
                          onChange={(e) => updateNestedForm('socialLinks', 'twitter', e.target.value)}
                          className="input mt-1" 
                          placeholder="https://twitter.com/youraccount"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button 
                    type="button" 
                    onClick={goToPrevStep}
                    className="btn-outline"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    onClick={goToNextStep}
                    className="btn-primary"
                  >
                    Next: Branding & Design
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Branding & Design */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Branding & Design</h2>
              <p className="text-gray-600 mb-6">
                Add your logo, banner image, and choose colors to customize the look of your shop.
              </p>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.logo ? (
                        <div className="relative">
                          <img src={formData.logo} alt="Logo preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
                          <button 
                            type="button"
                            onClick={() => updateForm('logo', '')}
                            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Upload your shop logo (square format recommended)</p>
                        </>
                      )}
                      
                      <input 
                        type="text" 
                        value={formData.logo}
                        onChange={(e) => updateForm('logo', e.target.value)}
                        placeholder="Enter logo URL"
                        className="input mt-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.banner ? (
                        <div className="relative">
                          <img src={formData.banner} alt="Banner preview" className="mx-auto h-32 w-full object-cover rounded-lg" />
                          <button 
                            type="button"
                            onClick={() => updateForm('banner', '')}
                            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Upload your banner image (1200×400px recommended)</p>
                        </>
                      )}
                      
                      <input 
                        type="text" 
                        value={formData.banner}
                        onChange={(e) => updateForm('banner', e.target.value)}
                        placeholder="Enter banner URL"
                        className="input mt-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium mb-3">Shop Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700">Primary Color</label>
                      <div className="mt-1 flex items-center">
                        <input 
                          type="color" 
                          id="primary-color" 
                          value={formData.colors.primary}
                          onChange={(e) => updateNestedForm('colors', 'primary', e.target.value)}
                          className="h-10 w-10 border border-gray-300 rounded-md p-1"
                        />
                        <input 
                          type="text" 
                          value={formData.colors.primary}
                          onChange={(e) => updateNestedForm('colors', 'primary', e.target.value)}
                          className="input ml-2 flex-grow"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700">Secondary Color</label>
                      <div className="mt-1 flex items-center">
                        <input 
                          type="color" 
                          id="secondary-color" 
                          value={formData.colors.secondary}
                          onChange={(e) => updateNestedForm('colors', 'secondary', e.target.value)}
                          className="h-10 w-10 border border-gray-300 rounded-md p-1"
                        />
                        <input 
                          type="text" 
                          value={formData.colors.secondary}
                          onChange={(e) => updateNestedForm('colors', 'secondary', e.target.value)}
                          className="input ml-2 flex-grow"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium mb-3">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="relative h-32 overflow-hidden rounded-t-lg" style={{ backgroundColor: formData.colors.primary }}>
                      {formData.banner ? (
                        <img src={formData.banner} alt="Shop banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-white text-opacity-70">Shop Banner</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-4 rounded-b-lg shadow-sm relative">
                      <div className="absolute -top-8 left-4">
                        <div className="h-16 w-16 rounded-full border-4 border-white overflow-hidden" style={{ backgroundColor: formData.colors.secondary }}>
                          {formData.logo ? (
                            <img src={formData.logo} alt="Shop logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-white text-sm">Logo</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-8">
                        <h3 className="font-bold text-lg" style={{ color: formData.colors.primary }}>{formData.name || 'Shop Name'}</h3>
                        <p className="text-gray-600 text-sm mt-1">{formData.description || 'Shop description will appear here.'}</p>
                        <div className="mt-3">
                          <span className="inline-block px-3 py-1 text-sm rounded-full text-white" style={{ backgroundColor: formData.colors.primary }}>
                            {formData.categories[0] || 'Category'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button 
                    type="button" 
                    onClick={goToPrevStep}
                    className="btn-outline"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={!formData.name || !formData.description || !formData.email || formData.categories.length === 0}
                  >
                    Create Shop
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopCreationPage
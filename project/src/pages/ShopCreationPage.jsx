import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { createShop, shopAPI } from '../services/api'
import LimitReachedModal, { extractLimitError } from '../components/subscription/LimitReachedModal'

function ShopCreationPage() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [step, setStep] = useState(1)
  // Populated when the backend rejects creation with a plan-limit (402) so we
  // can show the upgrade modal instead of a generic error.
  const [limitInfo, setLimitInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // Field-level errors from backend validation, keyed by field name.
  const [fieldErrors, setFieldErrors] = useState({})
  // General (non-field) error message.
  const [generalError, setGeneralError] = useState('')

  // Maps backend field names → the step they appear on.
  const FIELD_STEP_MAP = {
    name: 1, description: 1, email: 1, phone: 1, address: 1, slug: 1,
    enable_product_listings: 2, enable_custom_orders: 2, enable_reviews: 2,
    enable_contact: 2, enable_shipping: 2, enable_social_links: 2,
    facebook_url: 2, instagram_url: 2, twitter_url: 2,
    logo: 3, banner: 3,
  }

  /** Extract field-level and general errors from backend response. */
  const parseBackendErrors = (error) => {
    const data = error?.response?.data
    // Wrapped format: {error: {detail: {...}}}
    const detail = data?.error?.detail ?? data?.detail ?? data
    const fields = {}
    const generals = []

    if (typeof detail === 'string') {
      return { fields, general: detail }
    }
    if (Array.isArray(detail)) {
      return { fields, general: detail.join(' ') }
    }
    if (detail && typeof detail === 'object') {
      for (const [key, msgs] of Object.entries(detail)) {
        const message = Array.isArray(msgs) ? msgs.join(' ') : String(msgs)
        if (key === 'non_field_errors' || key === 'detail') {
          generals.push(message)
        } else {
          fields[key] = message
        }
      }
    }
    return { fields, general: generals.join(' ') }
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: null,
    banner: null,
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
    setFieldErrors({})
    setGeneralError('')
    setStep(prev => prev + 1)
  }

  const goToPrevStep = () => {
    window.scrollTo(0, 0)
    setFieldErrors({})
    setGeneralError('')
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    const payload = new FormData()
    payload.append('name', formData.name)
    payload.append('description', formData.description)
    if (formData.logo) payload.append('logo', formData.logo)
    if (formData.banner) payload.append('banner', formData.banner)
    payload.append('email', formData.email)
    if (formData.phone) payload.append('phone', formData.phone)
    if (formData.address) payload.append('address', formData.address)
    
    payload.append('enable_product_listings', formData.features.productListings)
    payload.append('enable_custom_orders', formData.features.customOrders)
    payload.append('enable_reviews', formData.features.reviews)
    payload.append('enable_contact', formData.features.contact)
    payload.append('enable_shipping', formData.features.shipping)
    payload.append('enable_social_links', formData.features.socialLinks)
    
    if (formData.features.socialLinks) {
      if (formData.socialLinks.facebook) payload.append('facebook_url', formData.socialLinks.facebook)
      if (formData.socialLinks.instagram) payload.append('instagram_url', formData.socialLinks.instagram)
      if (formData.socialLinks.twitter) payload.append('twitter_url', formData.socialLinks.twitter)
    }

    setSubmitting(true)
    setFieldErrors({})
    setGeneralError('')
    try {
      const result = await createShop(payload)

      // Update theme separately if needed
      try {
        await shopAPI.updateTheme(result.slug, {
          primary_color: formData.colors.primary,
          secondary_color: formData.colors.secondary
        })
      } catch (themeError) {
        console.error('Failed to update initial theme:', themeError)
      }

      // New shops are created in "draft" status, which the *public* storefront
      // (/shop/:slug) hides from everyone but the owner on a fresh load — that
      // was surfacing a misleading "Shop not found" 404. Send the owner to the
      // dashboard instead, and pre-select the shop they just created so it
      // opens directly.
      try {
        localStorage.setItem('dashboard.selectedShopSlug', result.slug)
      } catch { /* ignore */ }
      navigate('/dashboard')
    } catch (error) {

      // If the account has hit its plan's shop limit, the backend returns a
      // structured 402/403 — show the upgrade modal instead of a generic error.
      const limit = extractLimitError(error)
      if (limit) {
        setLimitInfo(limit)
      } else {
        const { fields, general } = parseBackendErrors(error)
        setFieldErrors(fields)
        setGeneralError(general || (Object.keys(fields).length === 0
          ? 'Failed to create shop. Please check your inputs and try again.'
          : ''))

        // Jump to the step that contains the first errored field.
        const firstField = Object.keys(fields)[0]
        if (firstField && FIELD_STEP_MAP[firstField]) {
          setStep(FIELD_STEP_MAP[firstField])
        }
        window.scrollTo(0, 0)
      }
    } finally {
      setSubmitting(false)
    }
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

  /** Renders an inline error message beneath a form field. */
  const FieldError = ({ field }) => {
    const msg = fieldErrors[field]
    if (!msg) return null
    return <p className="text-red-600 text-sm mt-1">{msg}</p>
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

          {/* General error banner */}
          {generalError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">Shop creation failed</p>
                <p className="text-sm mt-0.5">{generalError}</p>
              </div>
              <button onClick={() => setGeneralError('')} className="text-red-400 hover:text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-start sm:items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col sm:flex-row items-center w-1/3 sm:w-auto">
                  <div 
                    className={`flex-shrink-0 flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full ${
                      stepNumber === step 
                        ? 'bg-primary-600 text-white'
                        : stepNumber < step
                          ? 'bg-primary-200 text-primary-800'
                          : 'bg-gray-200 text-gray-600'
                    } transition-colors`}
                  >
                    {stepNumber < step ? (
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm sm:text-base">{stepNumber}</span>
                    )}
                  </div>
                  <div className={`mt-2 sm:mt-0 sm:ml-2 text-xs sm:text-sm text-center sm:text-left ${stepNumber === step ? 'font-medium text-gray-900' : 'text-gray-500 hidden sm:block'}`}>
                    {stepNumber === 1 && 'Basic Info'}
                    {stepNumber === 2 && 'Shop Features'}
                    {stepNumber === 3 && 'Branding'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 sm:mt-2 h-2 flex">
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
                      className={`input mt-1 ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      required 
                    />
                    <FieldError field="name" />
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
                    className={`input mt-1 ${fieldErrors.description ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    required
                  ></textarea>
                  <FieldError field="description" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address*</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className={`input mt-1 ${fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      required 
                    />
                    <FieldError field="email" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      className={`input mt-1 ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                    />
                    <FieldError field="phone" />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Business Address</label>
                  <input 
                    type="text" 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className={`input mt-1 ${fieldErrors.address ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                  />
                  <FieldError field="address" />
                  <FieldError field="slug" />
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
                          className={`input mt-1 ${fieldErrors.facebook_url ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                          placeholder="https://facebook.com/yourpage"
                        />
                        <FieldError field="facebook_url" />
                      </div>
                      <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram URL</label>
                        <input 
                          type="url" 
                          id="instagram" 
                          value={formData.socialLinks.instagram}
                          onChange={(e) => updateNestedForm('socialLinks', 'instagram', e.target.value)}
                          className={`input mt-1 ${fieldErrors.instagram_url ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                          placeholder="https://instagram.com/youraccount"
                        />
                        <FieldError field="instagram_url" />
                      </div>
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter URL</label>
                        <input 
                          type="url" 
                          id="twitter" 
                          value={formData.socialLinks.twitter}
                          onChange={(e) => updateNestedForm('socialLinks', 'twitter', e.target.value)}
                          className={`input mt-1 ${fieldErrors.twitter_url ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                          placeholder="https://twitter.com/youraccount"
                        />
                        <FieldError field="twitter_url" />
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
                          <img src={URL.createObjectURL(formData.logo)} alt="Logo preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
                          <button 
                            type="button"
                            onClick={() => updateForm('logo', null)}
                            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Upload your shop logo (square format recommended)</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => updateForm('logo', e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.banner ? (
                        <div className="relative">
                          <img src={URL.createObjectURL(formData.banner)} alt="Banner preview" className="mx-auto h-32 w-full object-cover rounded-lg" />
                          <button 
                            type="button"
                            onClick={() => updateForm('banner', null)}
                            className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Upload your banner image (1200×400px recommended)</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => updateForm('banner', e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
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
                    disabled={submitting || !formData.name || !formData.description || !formData.email || formData.categories.length === 0}
                  >
                    {submitting ? 'Creating…' : 'Create Shop'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      {limitInfo && (
        <LimitReachedModal info={limitInfo} onClose={() => setLimitInfo(null)} />
      )}
    </div>
  )
}


export default ShopCreationPage
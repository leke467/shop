import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI } from '../../services/api'
import { getAllTemplates } from '../../templates/registry'
import TemplateCustomizerModal from './TemplateCustomizerModal'
import TemplatePreview from './TemplatePreview'

export default function TemplatesTab({ shop, onShopUpdate }) {
  const [applying, setApplying] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const templates = getAllTemplates()
  const currentTemplate = shop?.template_id || ''

  const openManageModal = (templateId) => {
    setSelectedTemplateId(templateId || currentTemplate || 'honeyspicy')
    setShowManageModal(true)
  }

  const handleApply = async (templateId) => {
    if (!shop?.slug) return
    setError('')
    setSuccess('')
    setApplying(templateId)
    try {
      await shopAPI.setTemplate(shop.slug, templateId)
      const templateName = templates.find(t => t.id === templateId)?.name || templateId
      setSuccess(`Template "${templateName}" applied successfully!`)
      if (onShopUpdate) onShopUpdate({ ...shop, template_id: templateId })
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.detail || data?.error?.detail || 'This template requires an upgraded subscription plan. Please upgrade your plan.'
      setError(msg)
    } finally {
      setApplying(null)
    }
  }

  const handleClear = async () => {
    if (!shop?.slug) return
    setError('')
    setSuccess('')
    setApplying('__clear__')
    try {
      await shopAPI.clearTemplate(shop.slug)
      setSuccess('Template removed. Your shop is back to the default storefront.')
      if (onShopUpdate) onShopUpdate({ ...shop, template_id: '' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to remove template.')
    } finally {
      setApplying(null)
    }
  }

  const handleViewLive = () => {
    if (!shop?.slug) return
    window.open(`/shop/${shop.slug}`, '_blank')
  }

  const handlePreview = (templateId) => {
    if (!shop?.slug) return
    const url = templateId ? `/shop/${shop.slug}?preview_template=${templateId}` : `/shop/${shop.slug}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Premium Templates</h2>
        <p className="text-gray-500 mt-1">
          Choose a professionally designed template for your storefront. Templates completely transform your shop's look and feel.
        </p>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Storefront Status Banner */}
      {currentTemplate ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">Premium Template</span>
              <h3 className="text-base font-bold text-amber-950">Active: {templates.find(t => t.id === currentTemplate)?.name || currentTemplate}</h3>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Your custom template is live. Manage hero headline, feature cards, colors, and about story anytime.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleViewLive}
              className="px-4 py-2.5 rounded-xl bg-white text-amber-800 text-sm font-semibold hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
            >
              View Live
            </button>
            <button
              onClick={() => setShowManageModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white text-sm font-bold hover:opacity-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>⚙️</span> Manage
            </button>
            <button
              onClick={handleClear}
              disabled={applying === '__clear__'}
              className="px-3 py-2.5 rounded-xl text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {applying === '__clear__' ? 'Removing...' : 'Reset to Default'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">Default Storefront</span>
              <h3 className="text-base font-bold text-blue-950">Active: Standard MultiShop Storefront</h3>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              You are using the standard storefront. You can manage your hero text, feature cards, brand story, and colors anytime.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleViewLive}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-800 text-sm font-semibold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
            >
              View Live
            </button>
            <button
              onClick={() => setShowManageModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-95 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>⚙️</span> Manage Storefront
            </button>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isActive = currentTemplate === template.id
          const isApplying = applying === template.id

          return (
            <motion.div
              key={template.id}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                isActive
                  ? 'border-amber-400 shadow-lg shadow-amber-100'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
              whileHover={{ y: -4 }}
            >
              {/* Preview Image / Miniature UI Mockup */}
              <div className="aspect-video relative overflow-hidden border-b border-gray-100 bg-gray-900">
                <TemplatePreview templateId={template.id} />
                {isActive && (
                  <div className="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                    ✓ Active
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white/90 z-10 border border-white/10">
                  {template.category}
                </div>
              </div>

              {/* Template Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {template.pages.map(page => (
                    <span key={page} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 capitalize">
                      {page}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {isActive ? (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={handleViewLive}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors text-center"
                      >
                        View Live
                      </button>
                      <button
                        onClick={() => openManageModal(template.id)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>⚙️</span> Manage
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 sm:gap-2 w-full">
                      <button
                        onClick={() => handleApply(template.id)}
                        disabled={!!applying}
                        className="flex-2 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-400 text-white text-xs sm:text-sm font-semibold hover:from-amber-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplying ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                            </svg>
                            Applying...
                          </span>
                        ) : 'Apply'}
                      </button>
                      <button
                        onClick={() => openManageModal(template.id)}
                        className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1"
                        title="Manage & customize this template"
                      >
                        <span>⚙️</span>
                        <span className="hidden sm:inline">Manage</span>
                      </button>
                      <button
                        onClick={() => handlePreview(template.id)}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Coming Soon Card */}
        <div className="rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="aspect-video bg-gray-100/50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-30">🎨</div>
              <p className="text-sm text-gray-400">More coming soon</p>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-400 mb-1">More Templates</h3>
            <p className="text-sm text-gray-400 mb-4">We're designing 10+ premium templates across various industries. Stay tuned!</p>
            <div className="flex gap-2 flex-wrap">
              {['Fashion', 'Tech', 'Beauty', 'Services'].map(cat => (
                <span key={cat} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-400">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Customizer Modal */}
      <TemplateCustomizerModal
        shop={shop}
        templateId={selectedTemplateId || currentTemplate || 'honeyspicy'}
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        onSaveSuccess={onShopUpdate}
      />
    </div>
  )
}

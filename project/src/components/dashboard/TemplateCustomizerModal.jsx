import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, getImageUrl } from '../../services/api'

const COLOR_PRESETS = [
  {
    name: 'Honey Gold',
    icon: '🍯',
    primary_color: '#E5A43B',
    banner_color: '#E5A43B',
    background_color: '#FFFDF9',
    text_color: '#2B1F0C',
  },
  {
    name: 'Obsidian Dark',
    icon: '🔮',
    primary_color: '#8B5CF6',
    banner_color: '#1E1B4B',
    background_color: '#0F172A',
    text_color: '#F8FAFC',
  },
  {
    name: 'Emerald Mint',
    icon: '🌿',
    primary_color: '#10B981',
    banner_color: '#059669',
    background_color: '#F0FDF4',
    text_color: '#064E3B',
  },
  {
    name: 'Rose Berry',
    icon: '🌸',
    primary_color: '#F43F5E',
    banner_color: '#E11D48',
    background_color: '#FFF1F2',
    text_color: '#4C0519',
  },
  {
    name: 'Ocean Sky',
    icon: '🌊',
    primary_color: '#0284C7',
    banner_color: '#0369A1',
    background_color: '#F0F9FF',
    text_color: '#0C4A6E',
  },
]

export default function TemplateCustomizerModal({ shop, isOpen, onClose, onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState('colors')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: shop?.name || '',
    tagline: shop?.tagline || '',
    description: shop?.description || '',

    // Hero Section
    hero_headline: '',
    hero_subtitle: '',
    hero_cta_primary: 'Order Now',
    hero_cta_secondary: 'View Menu',

    // 4 Grouped Template Colors
    primary_color: '#E5A43B',
    banner_color: '#E5A43B',
    background_color: '#FFFDF9',
    text_color: '#2B1F0C',

    // Features Banner
    feature1_title: 'Fresh Daily',
    feature1_desc: 'All of our treats are made fresh every day',
    feature2_title: 'Quality Ingredients',
    feature2_desc: 'We use only the finest ingredients',
    feature3_title: 'Fast Delivery',
    feature3_desc: 'Doorstep delivery within 30 minutes',

    // Full About Page
    about_hero_title: 'Our Story',
    about_hero_subtitle: 'Learn about our journey and passion',
    about_mission_title: 'Our Mission',
    about_mission_highlight: 'Creating exceptional experiences through quality and passion.',
    about_text: 'We are dedicated to delivering the finest products, crafted with care and attention to detail.',

    value1_title: 'Quality First',
    value1_desc: 'We never compromise on the quality of our products.',
    value2_title: 'Customer Love',
    value2_desc: 'Every interaction is an opportunity to create a memorable experience.',
    value3_title: 'Sustainability',
    value3_desc: 'Committed to sustainable practices in everything we do.',
    value4_title: 'Community',
    value4_desc: 'We believe in giving back and supporting our local community.',

    banner_url: shop?.banner || '',
    logo_url: shop?.logo || '',
  })

  useEffect(() => {
    if (!shop?.slug) return
    shopAPI.getTheme(shop.slug)
      .then(t => {
        const tokens = t?.extra_tokens || {}
        setForm(prev => ({
          ...prev,
          name: shop?.name || '',
          tagline: shop?.tagline || '',
          description: shop?.description || '',

          hero_headline: tokens.hero_headline ?? shop?.name ?? '',
          hero_subtitle: tokens.hero_subtitle ?? shop?.tagline ?? shop?.description ?? '',
          hero_cta_primary: tokens.hero_cta_primary || 'Order Now',
          hero_cta_secondary: tokens.hero_cta_secondary || 'View Menu',

          hero_image_1: tokens.hero_image_1 || '',
          hero_image_2: tokens.hero_image_2 || '',
          hero_image_3: tokens.hero_image_3 || '',

          primary_color: tokens.primary_color || t?.primary_color || '#E5A43B',
          banner_color: tokens.banner_color || '#E5A43B',
          background_color: tokens.background_color || t?.background_color || '#FFFDF9',
          text_color: tokens.text_color || t?.text_color || '#2B1F0C',

          feature1_title: tokens.feature1_title || 'Fresh Daily',
          feature1_desc: tokens.feature1_desc || 'All of our treats are made fresh every day',
          feature2_title: tokens.feature2_title || 'Quality Ingredients',
          feature2_desc: tokens.feature2_desc || 'We use only the finest ingredients',
          feature3_title: tokens.feature3_title || 'Fast Delivery',
          feature3_desc: tokens.feature3_desc || 'Doorstep delivery within 30 minutes',

          about_hero_title: tokens.about_hero_title || tokens.about_title || 'Our Story',
          about_hero_subtitle: tokens.about_hero_subtitle || 'Learn about our journey and passion',
          about_mission_title: tokens.about_mission_title || 'Our Mission',
          about_mission_highlight: tokens.about_mission_highlight || shop?.tagline || 'Creating exceptional experiences through quality and passion.',
          about_text: tokens.about_text || shop?.description || 'We are dedicated to delivering the finest products, crafted with care and attention to detail.',

          value1_title: tokens.value1_title || 'Quality First',
          value1_desc: tokens.value1_desc || 'We never compromise on the quality of our products.',
          value2_title: tokens.value2_title || 'Customer Love',
          value2_desc: tokens.value2_desc || 'Every interaction is an opportunity to create a memorable experience.',
          value3_title: tokens.value3_title || 'Sustainability',
          value3_desc: tokens.value3_desc || 'Committed to sustainable practices in everything we do.',
          value4_title: tokens.value4_title || 'Community',
          value4_desc: tokens.value4_desc || 'We believe in giving back and supporting our local community.',

          banner_url: shop?.banner || tokens.banner_url || '',
          logo_url: shop?.logo || tokens.logo_url || '',
        }))
      })
      .catch(() => {})
  }, [shop, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageFileChange = (fieldKey, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, [fieldKey]: event.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const applyColorPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      primary_color: preset.primary_color,
      banner_color: preset.banner_color,
      background_color: preset.background_color,
      text_color: preset.text_color,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const currentTheme = await shopAPI.getTheme(shop.slug).catch(() => ({ extra_tokens: {} }))
      const existingTokens = currentTheme?.extra_tokens || {}

      const updatedShop = await shopAPI.update(shop.slug, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
      })

      const extra_tokens = {
        ...existingTokens,
        hero_headline: form.hero_headline,
        hero_subtitle: form.hero_subtitle,
        hero_cta_primary: form.hero_cta_primary,
        hero_cta_secondary: form.hero_cta_secondary,

        hero_image_1: form.hero_image_1,
        hero_image_2: form.hero_image_2,
        hero_image_3: form.hero_image_3,

        primary_color: form.primary_color,
        banner_color: form.banner_color,
        background_color: form.background_color,
        text_color: form.text_color,

        feature1_title: form.feature1_title,
        feature1_desc: form.feature1_desc,
        feature2_title: form.feature2_title,
        feature2_desc: form.feature2_desc,
        feature3_title: form.feature3_title,
        feature3_desc: form.feature3_desc,

        about_hero_title: form.about_hero_title,
        about_hero_subtitle: form.about_hero_subtitle,
        about_mission_title: form.about_mission_title,
        about_mission_highlight: form.about_mission_highlight,
        about_title: form.about_hero_title,
        about_text: form.about_text,

        value1_title: form.value1_title,
        value1_desc: form.value1_desc,
        value2_title: form.value2_title,
        value2_desc: form.value2_desc,
        value3_title: form.value3_title,
        value3_desc: form.value3_desc,
        value4_title: form.value4_title,
        value4_desc: form.value4_desc,

        banner_url: form.banner_url,
        logo_url: form.logo_url,
      }

      const updatedTheme = await shopAPI.updateTheme(shop.slug, {
        primary_color: form.primary_color,
        background_color: form.background_color,
        text_color: form.text_color,
        extra_tokens,
      })

      const fullShop = {
        ...updatedShop,
        theme: updatedTheme,
      }

      setSuccess('Storefront content and colors saved successfully!')
      if (onSaveSuccess) onSaveSuccess(fullShop)
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1200)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save customization. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          className="bg-white text-gray-900 w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-gray-100 flex flex-col"
        >
          {/* Mobile Drag Indicator / Header */}
          <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto my-2" />

          {/* Sticky Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-pink-500/10 shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <span>⚙️</span> Manage Storefront
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1">Customize 4 colors, hero, features & about story for {shop?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors shadow-xs font-bold text-sm shrink-0"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Status Banners */}
          {error && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm font-medium">
              {success}
            </div>
          )}

          {/* Scrollable Mobile Navigation Tabs */}
          <div className="px-3 sm:px-6 pt-3 pb-2 border-b border-gray-100 flex gap-1.5 sm:gap-2 overflow-x-auto bg-gray-50/80 backdrop-blur-sm shrink-0 scrollbar-none">
            {[
              { id: 'colors', label: '🎨 4 Color Scheme' },
              { id: 'hero', label: '🎯 Hero Section' },
              { id: 'features', label: '⭐ Features Banner' },
              { id: 'about', label: '📖 Full About Page' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                    : 'text-gray-600 bg-white border border-gray-200/80 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            {activeTab === 'colors' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">1-Click Palette Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyColorPreset(preset)}
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-left transition-all shadow-2xs active:scale-95"
                      >
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-xs">{preset.icon}</span>
                          <span className="text-[11px] sm:text-xs font-bold text-gray-800 truncate">{preset.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.primary_color }} />
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.banner_color }} />
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.background_color }} />
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-300" style={{ backgroundColor: preset.text_color }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Grouped Template 4 Main Colors</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Color 1 */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-bold text-gray-900">1. Primary Accent</span>
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">CTA buttons, highlights, badges</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="color"
                          name="primary_color"
                          value={form.primary_color}
                          onChange={handleChange}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer border border-gray-300 p-0.5"
                        />
                        <input
                          type="text"
                          name="primary_color"
                          value={form.primary_color}
                          onChange={handleChange}
                          className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-semibold text-gray-900 uppercase text-center"
                        />
                      </div>
                    </div>

                    {/* Color 2 */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-bold text-gray-900">2. Features Banner</span>
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">Full-width features strip background</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="color"
                          name="banner_color"
                          value={form.banner_color}
                          onChange={handleChange}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer border border-gray-300 p-0.5"
                        />
                        <input
                          type="text"
                          name="banner_color"
                          value={form.banner_color}
                          onChange={handleChange}
                          className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-semibold text-gray-900 uppercase text-center"
                        />
                      </div>
                    </div>

                    {/* Color 3 */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-bold text-gray-900">3. Page Background</span>
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">Overall site canvas background</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="color"
                          name="background_color"
                          value={form.background_color}
                          onChange={handleChange}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer border border-gray-300 p-0.5"
                        />
                        <input
                          type="text"
                          name="background_color"
                          value={form.background_color}
                          onChange={handleChange}
                          className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-semibold text-gray-900 uppercase text-center"
                        />
                      </div>
                    </div>

                    {/* Color 4 */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-bold text-gray-900">4. Text & Headings</span>
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">Main titles and body text color</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="color"
                          name="text_color"
                          value={form.text_color}
                          onChange={handleChange}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl cursor-pointer border border-gray-300 p-0.5"
                        />
                        <input
                          type="text"
                          name="text_color"
                          value={form.text_color}
                          onChange={handleChange}
                          className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-semibold text-gray-900 uppercase text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Shop Headline Title</label>
                  <input
                    type="text"
                    name="hero_headline"
                    value={form.hero_headline}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                    placeholder="e.g. Obsidian Zone 1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hero Subtitle / Tagline</label>
                  <input
                    type="text"
                    name="hero_subtitle"
                    value={form.hero_subtitle}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                    placeholder="e.g. Your premium destination for custom gaming setups."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Primary CTA Button</label>
                    <input
                      type="text"
                      name="hero_cta_primary"
                      value={form.hero_cta_primary}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                      placeholder="e.g. Order Now"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Secondary CTA Button</label>
                    <input
                      type="text"
                      name="hero_cta_secondary"
                      value={form.hero_cta_secondary}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                      placeholder="e.g. View Menu"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">🖼️ Hero Section Showcase Images (3 Cards)</h4>
                  <p className="text-[11px] text-gray-500 mb-3">Upload image files directly or paste image URLs for the 3 floating hero cards displayed on your storefront hero section.</p>

                  <div className="space-y-3">
                    {[
                      { key: 'hero_image_1', label: 'Hero Showcase Image 1' },
                      { key: 'hero_image_2', label: 'Hero Showcase Image 2' },
                      { key: 'hero_image_3', label: 'Hero Showcase Image 3' },
                    ].map(({ key, label }) => (
                      <div key={key} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <label className="block text-xs font-bold text-gray-900">{label}</label>

                        <div className="flex items-center gap-3">
                          {/* Thumbnail preview */}
                          <div className="w-14 h-14 rounded-xl border border-gray-300 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                            {form[key] ? (
                              <img src={getImageUrl(form[key])} alt={label} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl opacity-40">🖼️</span>
                            )}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs inline-flex items-center gap-1.5">
                                <span>📁</span> Choose File / Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => e.target.files?.[0] && handleImageFileChange(key, e.target.files[0])}
                                />
                              </label>

                              {form[key] && (
                                <button
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, [key]: '' }))}
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              name={key}
                              value={form[key] || ''}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono"
                              placeholder="Or paste image URL (https://...)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">🏪 Store Banner & Brand Logo</h4>
                  <p className="text-[11px] text-gray-500 mb-3">Upload custom banner artwork or store logo for your storefront.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Banner Image */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <label className="block text-xs font-bold text-gray-900">Store Banner Image</label>
                      <div className="w-full h-20 rounded-xl border border-gray-300 bg-white overflow-hidden flex items-center justify-center shadow-xs relative">
                        {form.banner_url ? (
                          <img src={getImageUrl(form.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">🏞️ No Banner Uploaded</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs text-center">
                          📁 Upload Banner
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageFileChange('banner_url', e.target.files[0])}
                          />
                        </label>
                        {form.banner_url && (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, banner_url: '' }))}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        name="banner_url"
                        value={form.banner_url || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono"
                        placeholder="Or paste banner URL"
                      />
                    </div>

                    {/* Logo Image */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <label className="block text-xs font-bold text-gray-900">Store Brand Logo</label>
                      <div className="w-full h-20 rounded-xl border border-gray-300 bg-white overflow-hidden flex items-center justify-center shadow-xs relative">
                        {form.logo_url ? (
                          <img src={getImageUrl(form.logo_url)} alt="Logo" className="w-16 h-16 object-contain" />
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">🏷️ No Logo Uploaded</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs text-center">
                          📁 Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageFileChange('logo_url', e.target.files[0])}
                          />
                        </label>
                        {form.logo_url && (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-all"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        name="logo_url"
                        value={form.logo_url || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono"
                        placeholder="Or paste logo URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-3.5">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Feature 1</h4>
                  <input
                    type="text"
                    name="feature1_title"
                    value={form.feature1_title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                    placeholder="Title (e.g. 24/7 Support)"
                  />
                  <input
                    type="text"
                    name="feature1_desc"
                    value={form.feature1_desc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                    placeholder="Description (e.g. Dedicated gaming hardware support)"
                  />
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Feature 2</h4>
                  <input
                    type="text"
                    name="feature2_title"
                    value={form.feature2_title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                    placeholder="Title (e.g. Genuine Hardware)"
                  />
                  <input
                    type="text"
                    name="feature2_desc"
                    value={form.feature2_desc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                    placeholder="Description (e.g. 100% authentic Alienware & Razer gear)"
                  />
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Feature 3</h4>
                  <input
                    type="text"
                    name="feature3_title"
                    value={form.feature3_title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                    placeholder="Title (e.g. Express Shipping)"
                  />
                  <input
                    type="text"
                    name="feature3_desc"
                    value={form.feature3_desc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                    placeholder="Description (e.g. Nationwide doorstep delivery within 24 hours)"
                  />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                {/* About Hero & Mission */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">About Page Header & Mission</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">About Hero Title</label>
                      <input
                        type="text"
                        name="about_hero_title"
                        value={form.about_hero_title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                        placeholder="e.g. Our Story"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">About Hero Subtitle</label>
                      <input
                        type="text"
                        name="about_hero_subtitle"
                        value={form.about_hero_subtitle}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                        placeholder="e.g. Learn about our journey and passion"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mission Section Title</label>
                    <input
                      type="text"
                      name="about_mission_title"
                      value={form.about_mission_title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                      placeholder="e.g. Our Mission"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mission Tagline / Highlight</label>
                    <input
                      type="text"
                      name="about_mission_highlight"
                      value={form.about_mission_highlight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                      placeholder="e.g. Creating exceptional experiences through quality and passion."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Detailed Story / Mission Content</label>
                    <textarea
                      rows={3}
                      name="about_text"
                      value={form.about_text}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-medium"
                      placeholder="Write your full brand story, custom setups, or business mission..."
                    />
                  </div>
                </div>

                {/* 4 Core Values */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Core Values Cards (About Page)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900">Value 1 (🎯)</span>
                      <input
                        type="text"
                        name="value1_title"
                        value={form.value1_title}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs font-bold"
                        placeholder="Title (e.g. Quality First)"
                      />
                      <input
                        type="text"
                        name="value1_desc"
                        value={form.value1_desc}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-[11px]"
                        placeholder="Description"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900">Value 2 (❤️)</span>
                      <input
                        type="text"
                        name="value2_title"
                        value={form.value2_title}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs font-bold"
                        placeholder="Title (e.g. Customer Love)"
                      />
                      <input
                        type="text"
                        name="value2_desc"
                        value={form.value2_desc}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-[11px]"
                        placeholder="Description"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900">Value 3 (🌱)</span>
                      <input
                        type="text"
                        name="value3_title"
                        value={form.value3_title}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs font-bold"
                        placeholder="Title (e.g. Sustainability)"
                      />
                      <input
                        type="text"
                        name="value3_desc"
                        value={form.value3_desc}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-[11px]"
                        placeholder="Description"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900">Value 4 (🤝)</span>
                      <input
                        type="text"
                        name="value4_title"
                        value={form.value4_title}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs font-bold"
                        placeholder="Title (e.g. Community)"
                      />
                      <input
                        type="text"
                        name="value4_desc"
                        value={form.value4_desc}
                        onChange={handleChange}
                        className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-[11px]"
                        placeholder="Description"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile & Desktop Sticky Submit Footer */}
            <div className="sticky bottom-0 z-20 pt-3 pb-3 -mx-4 -mb-4 px-4 sm:-mx-6 sm:-mb-6 sm:px-6 border-t border-gray-100 flex items-center justify-end gap-2.5 bg-white/95 backdrop-blur-md shadow-lg sm:shadow-none">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-2 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50 text-center"
              >
                {saving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, getImageUrl } from '../../services/api'
import { getTemplateById } from '../../templates/registry'
import { getTemplateSchema } from '../../templates/templateConfigs'
import BrandLogoRenderer from '../shop/BrandLogoRenderer'

const FONT_OPTIONS = [
  { id: 'Inter', name: 'Inter', category: 'Clean & Modern Sans', preview: 'The quick brown fox jumps over the lazy dog' },
  { id: 'Poppins', name: 'Poppins', category: 'Friendly Geometric', preview: 'Sweet bakes & fresh artisan treats' },
  { id: 'Playfair Display', name: 'Playfair Display', category: 'Luxurious Serif', preview: 'Exquisite craftsmanship & elegance' },
  { id: 'Cinzel', name: 'Cinzel', category: 'Royal Classical', preview: 'Imperial heritage & prestigious quality' },
  { id: 'Outfit', name: 'Outfit', category: 'Contemporary Minimalist', preview: 'Simplicity meets refined aesthetics' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', category: 'Crisp Digital', preview: 'High performance modern experience' },
  { id: 'Montserrat', name: 'Montserrat', category: 'Architectural Bold', preview: 'Urban energy & powerful typography' },
  { id: 'Space Grotesk', name: 'Space Grotesk', category: 'Cyberpunk & Tech', preview: 'Future tech & cybernetic systems' },
  { id: 'Syne', name: 'Syne', category: 'Avant-Garde Fashion', preview: 'Expressive style & luxury lookbook' },
  { id: 'Cormorant Garamond', name: 'Cormorant Garamond', category: 'Vintage Fine Serif', preview: 'Timeless luxury & bespoke goods' },
  { id: 'Caveat', name: 'Caveat', category: 'Handmade Bakes Script', preview: 'Handcrafted with warmth and passion' },
  { id: 'Pacifico', name: 'Pacifico', category: 'Playful Diner Script', preview: 'Delicious delights & sweet flavours' },
]

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
  {
    name: 'Royal Gold & Velvet',
    icon: '👑',
    primary_color: '#D4AF37',
    banner_color: '#1A0B2E',
    background_color: '#0D0614',
    text_color: '#FBF8F0',
  },
]

function getInitialFormForTemplate(schema, shop, tokens = {}, currentTemplateId) {
  const HONEY_DEFAULTS = [
    'Explore Our Menu',
    'Our Signature Treats',
    'Explore our most popular and delicious creations',
    'Handcrafted to perfection with premium quality',
    'What Our Happy Customers Say',
    'Fresh Daily',
    'All of our treats are made fresh every day',
    'Order Now',
    'View Menu',
    'Handcrafted Quality',
    'Explore Catalog',
    'Catalog description',
    'Client Reviews',
    'What Our Clients Say',
  ]

  const pick = (key, schemaDefault, globalDefault = '') => {
    const scopedVal = tokens[`${currentTemplateId}_${key}`]
    if (scopedVal !== undefined && scopedVal !== null && scopedVal !== '') {
      if (currentTemplateId === 'honeyspicy' || !HONEY_DEFAULTS.includes(scopedVal)) {
        return scopedVal
      }
    }

    if (tokens[key] !== undefined && tokens[key] !== null && tokens[key] !== '') {
      if (currentTemplateId === 'honeyspicy' || !HONEY_DEFAULTS.includes(tokens[key])) {
        return tokens[key]
      }
    }

    return schemaDefault !== undefined ? schemaDefault : globalDefault
  }

  return {
    name: shop?.name || '',
    tagline: shop?.tagline || '',
    description: shop?.description || '',

    // Hero Section
    hero_welcome_prefix: pick('hero_welcome_prefix', schema.hero?.welcomePrefixDefault, 'Welcome to'),
    hero_headline: pick('hero_headline', '', shop?.name || ''),
    hero_subtitle: pick('hero_subtitle', '', shop?.tagline || shop?.description || ''),
    hero_badge: pick('hero_badge', schema.hero?.badgeDefault, ''),
    hero_cta_primary: pick('hero_cta_primary', schema.hero?.ctaPrimaryDefault, 'Explore'),
    hero_cta_secondary: pick('hero_cta_secondary', schema.hero?.ctaSecondaryDefault, ''),

    // Section Titles & Subtitles
    featured_title: pick('featured_title', schema.sections?.featuredTitleDefault, ''),
    featured_subtitle: pick('featured_subtitle', schema.sections?.featuredSubtitleDefault, ''),
    categories_title: pick('categories_title', schema.sections?.catalogTitleDefault, 'Catalog Index'),
    categories_subtitle: pick('categories_subtitle', schema.sections?.categoriesSubtitleDefault, schema.tagline || ''),
    testimonials_title: pick('testimonials_title', schema.sections?.testimonialsTitleDefault, 'Client Reviews'),

    // Typography
    font_family: pick('font_family', schema.defaultFont, 'Inter'),
    heading_font: pick('heading_font', schema.defaultFont, 'Inter'),
    body_font: pick('body_font', 'Inter', 'Inter'),

    // Colors
    primary_color: pick('primary_color', schema.defaultColors?.primary, '#E5A43B'),
    banner_color: pick('banner_color', schema.defaultColors?.banner, '#E5A43B'),
    background_color: pick('background_color', schema.defaultColors?.bg, '#FFFFFF'),
    text_color: pick('text_color', schema.defaultColors?.text, '#111827'),

    // Images
    hero_image_1: pick('hero_image_1', schema.hero?.imageSlots?.[0]?.default, ''),
    hero_image_2: pick('hero_image_2', schema.hero?.imageSlots?.[1]?.default, ''),
    hero_image_3: pick('hero_image_3', schema.hero?.imageSlots?.[2]?.default, ''),

    // Features
    feature1_title: pick('feature1_title', schema.features?.defaultCards?.[0]?.val1, 'Authenticity Guaranteed'),
    feature1_desc: pick('feature1_desc', schema.features?.defaultCards?.[0]?.val2, '100% verified original quality'),
    feature2_title: pick('feature2_title', schema.features?.defaultCards?.[1]?.val1, 'Premium Care'),
    feature2_desc: pick('feature2_desc', schema.features?.defaultCards?.[1]?.val2, 'Carefully packaged and inspected'),
    feature3_title: pick('feature3_title', schema.features?.defaultCards?.[2]?.val1, 'Fast Delivery'),
    feature3_desc: pick('feature3_desc', schema.features?.defaultCards?.[2]?.val2, 'Swift insured delivery to your location'),
    feature4_title: pick('feature4_title', schema.features?.defaultCards?.[3]?.val1, 'Secure Checkout'),
    feature4_desc: pick('feature4_desc', schema.features?.defaultCards?.[3]?.val2, 'Buyer protection via MultiShop Escrow'),

    // About & Story
    about_hero_title: pick('about_hero_title', schema.about?.aboutHeroTitle, 'Our Story'),
    about_hero_subtitle: pick('about_hero_subtitle', schema.about?.aboutHeroSubtitle, 'Learn about our journey and mission'),
    about_mission_title: pick('about_mission_title', schema.about?.aboutMissionTitle, 'Our Mission'),
    about_mission_highlight: pick('about_mission_highlight', schema.about?.aboutMissionHighlight, shop?.tagline || 'Excellence in every detail.'),
    about_text: pick('about_text', schema.about?.aboutText, shop?.description || 'Dedicated to bringing you the highest quality products.'),

    value1_title: pick('value1_title', 'Quality First'),
    value1_desc: pick('value1_desc', 'We never compromise on the quality of our products.'),
    value2_title: pick('value2_title', 'Customer Experience'),
    value2_desc: pick('value2_desc', 'Every interaction is an opportunity to create value.'),
    value3_title: pick('value3_title', 'Sustainability'),
    value3_desc: pick('value3_desc', 'Committed to responsible and sustainable practices.'),
    value4_title: pick('value4_title', 'Community'),
    value4_desc: pick('value4_desc', 'We believe in empowering and supporting our community.'),

    banner_url: shop?.banner || tokens.banner_url || '',
    logo_url: shop?.logo || tokens.logo_url || '',
    logo_position: tokens.logo_position || 'left',
    footer_note: tokens.footer_note || '',
  }
}

export default function TemplateCustomizerModal({ shop, templateId, isOpen, onClose, onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState('hero')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentTemplateId = templateId || shop?.template_id || 'honeyspicy'
  const schema = getTemplateSchema(currentTemplateId)

  const [form, setForm] = useState(() => getInitialFormForTemplate(schema, shop, {}, currentTemplateId))

  // Dynamically load Google Font in Customizer preview
  useEffect(() => {
    const fontsToLoad = [form.font_family, form.heading_font, form.body_font].filter(Boolean)
    fontsToLoad.forEach(font => {
      if (!['inherit', 'sans-serif', 'serif'].includes(font)) {
        const cleanFont = font.split(',')[0].replace(/['"]/g, '').trim()
        const fontId = `google-font-${cleanFont.replace(/\s+/g, '-')}`
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link')
          link.id = fontId
          link.rel = 'stylesheet'
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFont)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap`
          document.head.appendChild(link)
        }
      }
    })
  }, [form.font_family, form.heading_font, form.body_font])

  useEffect(() => {
    if (!shop?.slug) return
    const activeSchema = getTemplateSchema(currentTemplateId)
    shopAPI.getTheme(shop.slug)
      .then(t => {
        const tokens = t?.extra_tokens || {}
        setForm(getInitialFormForTemplate(activeSchema, shop, tokens, currentTemplateId))
      })
      .catch(() => {
        setForm(getInitialFormForTemplate(activeSchema, shop, {}, currentTemplateId))
      })
  }, [shop, isOpen, templateId, currentTemplateId])

  const [bannerFile, setBannerFile] = useState(null)
  const [logoFile, setLogoFile] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageFileChange = (fieldKey, file) => {
    if (!file) return
    if (fieldKey === 'banner_url') setBannerFile(file)
    if (fieldKey === 'logo_url') setLogoFile(file)
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
      let finalBannerUrl = form.banner_url
      let finalLogoUrl = form.logo_url

      if (bannerFile || logoFile) {
        const brandingFormData = new FormData()
        if (bannerFile) brandingFormData.append('banner', bannerFile)
        if (logoFile) brandingFormData.append('logo', logoFile)
        try {
          const brandingRes = await shopAPI.uploadBranding(shop.slug, brandingFormData)
          if (brandingRes?.banner) finalBannerUrl = brandingRes.banner
          if (brandingRes?.logo) finalLogoUrl = brandingRes.logo
        } catch (bErr) {
          console.warn('Branding upload note:', bErr)
        }
      }

      const currentTheme = await shopAPI.getTheme(shop.slug).catch(() => ({ extra_tokens: {} }))
      const existingTokens = currentTheme?.extra_tokens || {}

      const updatedShop = await shopAPI.update(shop.slug, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
      })

      const targetTemplate = templateId || shop?.template_id || 'honeyspicy'
      if (templateId && templateId !== shop?.template_id) {
        await shopAPI.setTemplate(shop.slug, targetTemplate)
      }

      const extra_tokens = {
        ...existingTokens,
        template_id: targetTemplate,
        hero_welcome_prefix: form.hero_welcome_prefix,
        hero_headline: form.hero_headline,
        hero_subtitle: form.hero_subtitle,
        hero_badge: form.hero_badge,
        hero_cta_primary: form.hero_cta_primary,
        hero_cta_secondary: form.hero_cta_secondary,

        featured_title: form.featured_title,
        featured_subtitle: form.featured_subtitle,
        categories_title: form.categories_title,
        categories_subtitle: form.categories_subtitle,
        testimonials_title: form.testimonials_title,

        font_family: form.font_family,
        heading_font: form.heading_font,
        body_font: form.body_font,

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
        feature4_title: form.feature4_title,
        feature4_desc: form.feature4_desc,

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

        banner_url: finalBannerUrl,
        logo_url: finalLogoUrl,
        logo_position: form.logo_position || 'left',
        footer_note: form.footer_note,

        // Scoped overrides per template
        [`${targetTemplate}_categories_title`]: form.categories_title,
        [`${targetTemplate}_categories_subtitle`]: form.categories_subtitle,
        [`${targetTemplate}_hero_badge`]: form.hero_badge,
        [`${targetTemplate}_hero_cta_primary`]: form.hero_cta_primary,
        [`${targetTemplate}_hero_cta_secondary`]: form.hero_cta_secondary,
        [`${targetTemplate}_featured_title`]: form.featured_title,
        [`${targetTemplate}_featured_subtitle`]: form.featured_subtitle,
        [`${targetTemplate}_testimonials_title`]: form.testimonials_title,
        [`${targetTemplate}_font_family`]: form.font_family,
        [`${targetTemplate}_primary_color`]: form.primary_color,
        [`${targetTemplate}_banner_color`]: form.banner_color,
        [`${targetTemplate}_background_color`]: form.background_color,
        [`${targetTemplate}_text_color`]: form.text_color,
      }

      const updatedTheme = await shopAPI.updateTheme(shop.slug, {
        primary_color: form.primary_color,
        background_color: form.background_color,
        text_color: form.text_color,
        extra_tokens,
      })

      const fullShop = {
        ...updatedShop,
        banner: finalBannerUrl || updatedShop?.banner,
        logo: finalLogoUrl || updatedShop?.logo,
        template_id: targetTemplate,
        theme: updatedTheme,
      }

      setSuccess(`Storefront content, fonts, and template applied successfully!`)
      if (onSaveSuccess) onSaveSuccess(fullShop)
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1200)
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.detail || 'Failed to save customization. Please check plan permissions.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const TABS = [
    { id: 'hero', label: '🎯 Hero & Headline' },
    { id: 'sections', label: '🛍️ Section Titles' },
    { id: 'fonts', label: '🔤 Fonts & Typography' },
    { id: 'colors', label: '🎨 4 Colors' },
    ...(schema.features?.hasFeaturesBanner ? [{ id: 'features', label: '⭐ Features Banner' }] : []),
    { id: 'about', label: '📖 About & Story' },
    { id: 'branding', label: '🏷️ Logo & Banner' },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          className="bg-white text-gray-900 w-full sm:max-w-3xl h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-gray-100 flex flex-col"
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto my-2" />

          {/* Sticky Header with Template Badge */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-1.5">
                  <span>⚙️</span> Manage Template
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                  {schema.name}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {schema.tagline}
              </p>
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

          {/* Scrollable Navigation Tabs */}
          <div className="px-3 sm:px-6 pt-3 pb-2 border-b border-gray-100 flex gap-1.5 sm:gap-2 overflow-x-auto bg-gray-50/90 backdrop-blur-sm shrink-0 scrollbar-none">
            {TABS.map(tab => (
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
            
            {/* 1. HERO & HEADLINE TAB */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      ✨ {schema.name} — Hero Customization
                    </h3>
                  </div>
                  
                  {/* Welcome Prefix - only if template supports it (e.g. Honey Gourmet) */}
                  {schema.hero.hasWelcomePrefix && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {schema.hero.welcomePrefixLabel || 'Welcome Prefix (e.g. "Welcome to", "Introducing", or leave blank)'}
                      </label>
                      <input
                        type="text"
                        name="hero_welcome_prefix"
                        value={form.hero_welcome_prefix}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold"
                        placeholder={schema.hero.welcomePrefixDefault || 'e.g. Welcome to'}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">This text appears right before your main store headline in script/accent font.</p>
                    </div>
                  )}

                  {/* Header Tag / Badge - for Minimalist, Cyberpunk, Royal, etc. */}
                  {schema.hero.hasBadge && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {schema.hero.badgeLabel || 'Hero Header Tag / Badge Code'}
                      </label>
                      <input
                        type="text"
                        name="hero_badge"
                        value={form.hero_badge}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold"
                        placeholder={schema.hero.badgeDefault || 'e.g. Architectural Collection // 2026'}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Badge tag rendered at the top of the hero section.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {schema.hero.headlineLabel || 'Main Store Headline Title'}
                    </label>
                    <input
                      type="text"
                      name="hero_headline"
                      value={form.hero_headline}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-black"
                      placeholder={shop?.name || 'Store Name'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {schema.hero.subtitleLabel || 'Hero Subtitle / Catchphrase'}
                    </label>
                    <input
                      type="text"
                      name="hero_subtitle"
                      value={form.hero_subtitle}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                      placeholder="e.g. Discover our amazing collection crafted with passion!"
                    />
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className={`grid grid-cols-1 ${schema.hero.hasCtaSecondary ? 'sm:grid-cols-2' : ''} gap-3 sm:gap-4`}>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {schema.hero.ctaPrimaryLabel || 'Primary Button Text (CTA 1)'}
                    </label>
                    <input
                      type="text"
                      name="hero_cta_primary"
                      value={form.hero_cta_primary}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-bold"
                      placeholder={schema.hero.ctaPrimaryDefault || 'Order Now'}
                    />
                  </div>
                  {schema.hero.hasCtaSecondary && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {schema.hero.ctaSecondaryLabel || 'Secondary Button Text (CTA 2)'}
                      </label>
                      <input
                        type="text"
                        name="hero_cta_secondary"
                        value={form.hero_cta_secondary}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-bold"
                        placeholder={schema.hero.ctaSecondaryDefault || 'View Menu / Catalog'}
                      />
                    </div>
                  )}
                </div>

                {/* Hero Showcase Images - Render EXACTLY the number of slots for this template */}
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                    🖼️ Hero Showcase Image{schema.hero.imageSlots?.length > 1 ? `s (${schema.hero.imageSlots.length} Cards)` : ''}
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Upload custom image or paste direct URL for this template's hero section.
                  </p>

                  <div className="space-y-3">
                    {(schema.hero.imageSlots || []).map(({ key, label, desc }) => (
                      <div key={key} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-900">{label}</label>
                          {desc && <p className="text-[11px] text-gray-500">{desc}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            name={key}
                            value={form[key] || ''}
                            onChange={handleChange}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-mono"
                          />
                          <label className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer text-center shrink-0">
                            Upload File
                            <input
                              type="file"
                              accept="image/*,.svg,.webp,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => handleImageFileChange(key, e.target.files[0])}
                            />
                          </label>
                        </div>
                        {form[key] && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 mt-1">
                            <img src={getImageUrl(form[key])} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. STORE SECTIONS & TITLES TAB */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                {schema.sections.hasFeaturedTitle && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      🍰 {schema.sections.featuredTitleLabel || 'Featured / Signature Collection Section'}
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Featured Section Title
                      </label>
                      <input
                        type="text"
                        name="featured_title"
                        value={form.featured_title}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-bold"
                        placeholder={schema.sections.featuredTitleDefault || 'Our Signature Treats'}
                      />
                    </div>

                    {schema.sections.hasFeaturedSubtitle && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          {schema.sections.featuredSubtitleLabel || 'Featured Section Subtitle'}
                        </label>
                        <input
                          type="text"
                          name="featured_subtitle"
                          value={form.featured_subtitle}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                          placeholder={schema.sections.featuredSubtitleDefault || 'Explore our most popular creations'}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    📂 {schema.sections.catalogTitleLabel || 'Catalog & Menu Page Headers'}
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {schema.sections.catalogTitleLabel || 'Catalog Heading'}
                    </label>
                    <input
                      type="text"
                      name="categories_title"
                      value={form.categories_title}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-bold"
                      placeholder={schema.sections.catalogTitleDefault || 'Explore Catalog'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Catalog Subtitle / Description</label>
                    <input
                      type="text"
                      name="categories_subtitle"
                      value={form.categories_subtitle}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                      placeholder={schema.sections.categoriesSubtitleDefault || schema.tagline || 'Catalog description'}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Testimonials / Reviews Title</label>
                  <input
                    type="text"
                    name="testimonials_title"
                    value={form.testimonials_title}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-bold"
                    placeholder={schema.sections.testimonialsTitleDefault || 'What Our Happy Customers Say'}
                  />
                </div>
              </div>
            )}

            {/* 3. FONTS & TYPOGRAPHY TAB */}
            {activeTab === 'fonts' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Select Google Font Family</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 border border-gray-200 rounded-2xl">
                    {FONT_OPTIONS.map(font => {
                      const isSelected = form.font_family === font.id || form.heading_font === font.id
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, font_family: font.id, heading_font: font.id }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-400/20'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: font.id }}>
                              {font.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{font.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate" style={{ fontFamily: font.id }}>
                            {font.preview}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Heading Font</label>
                    <input
                      type="text"
                      name="heading_font"
                      value={form.heading_font}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold"
                      placeholder="e.g. Poppins, Playfair Display"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Body Text Font</label>
                    <input
                      type="text"
                      name="body_font"
                      value={form.body_font}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium"
                      placeholder="e.g. Inter, Outfit"
                    />
                  </div>
                </div>

                {/* Live Font Sample Preview */}
                <div className="p-4 rounded-2xl bg-gray-900 text-white space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400">Live Typography Preview</span>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: form.heading_font }}>
                    {form.hero_welcome_prefix ? `${form.hero_welcome_prefix} ` : ''}{form.hero_headline || 'Honeyspicy Gourmet'}
                  </h3>
                  <p className="text-xs text-gray-300" style={{ fontFamily: form.body_font }}>
                    {form.featured_subtitle || 'Explore our most popular and delicious creations crafted fresh every day.'}
                  </p>
                </div>
              </div>
            )}

            {/* 4. 4-COLOR SCHEME TAB */}
            {activeTab === 'colors' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                      1-Click Palette Presets for {schema.name}
                    </label>
                    <span className="text-[10px] text-gray-500 font-medium">Curated for this style</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(schema.palettePresets || COLOR_PRESETS).map(preset => (
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
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">CTA buttons, badges, links</span>
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
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">Highlights strip background</span>
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
                        <span className="block text-xs font-bold text-gray-900">3. Page Canvas Background</span>
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
                        <span className="block text-[10px] sm:text-[11px] text-gray-500">Main titles & paragraph text</span>
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

            {/* 5. FEATURES BANNER TAB */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Customize the 4 highlight cards displayed on your storefront feature strip.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { num: 1, titleKey: 'feature1_title', descKey: 'feature1_desc', defaultT: 'Fresh Daily', defaultD: 'All of our treats are made fresh every day' },
                    { num: 2, titleKey: 'feature2_title', descKey: 'feature2_desc', defaultT: 'Quality Ingredients', defaultD: 'We use only the finest ingredients' },
                    { num: 3, titleKey: 'feature3_title', descKey: 'feature3_desc', defaultT: 'Fast Delivery', defaultD: 'Doorstep delivery within 30 minutes' },
                    { num: 4, titleKey: 'feature4_title', descKey: 'feature4_desc', defaultT: 'Secure Checkout', defaultD: '100% buyer protection via MultiShop Escrow' },
                  ].map(f => (
                    <div key={f.num} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <span className="text-xs font-bold text-gray-900">Feature Card {f.num}</span>
                      <input
                        type="text"
                        name={f.titleKey}
                        value={form[f.titleKey]}
                        onChange={handleChange}
                        placeholder={f.defaultT}
                        className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-bold"
                      />
                      <input
                        type="text"
                        name={f.descKey}
                        value={form[f.descKey]}
                        onChange={handleChange}
                        placeholder={f.defaultD}
                        className="w-full px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ABOUT & STORY TAB */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">About Page Headlines</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mission Highlight Quote</label>
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
                      placeholder="Write your full brand story, handcrafted bakes, or business journey..."
                    />
                  </div>
                </div>

                {/* 4 Core Values */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Core Values Cards</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { num: 1, emoji: '🎯', t: 'value1_title', d: 'value1_desc', defaultT: 'Quality First' },
                      { num: 2, emoji: '❤️', t: 'value2_title', d: 'value2_desc', defaultT: 'Customer Love' },
                      { num: 3, emoji: '🌱', t: 'value3_title', d: 'value3_desc', defaultT: 'Sustainability' },
                      { num: 4, emoji: '🤝', t: 'value4_title', d: 'value4_desc', defaultT: 'Community' },
                    ].map(val => (
                      <div key={val.num} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                        <span className="text-xs font-bold text-amber-900">Value {val.num} ({val.emoji})</span>
                        <input
                          type="text"
                          name={val.t}
                          value={form[val.t]}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-xs font-bold"
                          placeholder={`Title (e.g. ${val.defaultT})`}
                        />
                        <input
                          type="text"
                          name={val.d}
                          value={form[val.d]}
                          onChange={handleChange}
                          className="w-full px-2.5 py-1.5 bg-white text-gray-900 rounded-lg border border-gray-300 text-[11px]"
                          placeholder="Description"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. BRANDING & FOOTER TAB */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Shop Logo (Supports SVG, PNG, WebP, JPG)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      name="logo_url"
                      value={form.logo_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                    <label className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer shrink-0">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*,.svg,.webp,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => handleImageFileChange('logo_url', e.target.files[0])}
                      />
                    </label>
                  </div>
                  {form.logo_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 mt-2 bg-gray-50 flex items-center justify-center">
                      <img src={getImageUrl(form.logo_url)} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Logo Placement & Alignment */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-0.5">
                      Logo Placement & Alignment (Storefront Header)
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Choose where the logo sits relative to your store name in the navbar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'left', label: 'Beginning (Left)', desc: '[Logo] Store Name', icon: '⬅️' },
                      { id: 'middle', label: 'Middle (Between Words)', desc: 'Store [Logo] Name', icon: '↔️' },
                      { id: 'right', label: 'End (Right)', desc: 'Store Name [Logo]', icon: '➡️' },
                    ].map((pos) => {
                      const isSelected = (form.logo_position || 'left') === pos.id
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, logo_position: pos.id }))}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{pos.icon}</span>
                            {isSelected && <span className="text-[10px] bg-primary-600 text-white font-bold px-1.5 py-0.5 rounded">Active</span>}
                          </div>
                          <p className="text-xs font-bold">{pos.label}</p>
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{pos.desc}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Real-Time Live Header Logo Preview */}
                  <div className="pt-2 border-t border-gray-200/60 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Live Header Logo Preview</span>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs w-full flex items-center justify-center">
                      <BrandLogoRenderer
                        customLogo={form.logo_url}
                        customName={form.name || shop?.name || 'Honey Spicy'}
                        positionOverride={form.logo_position || 'left'}
                        accentColor={form.primary_color || '#E5A43B'}
                        textClassName="font-bold text-base text-gray-900"
                        logoClassName="w-8 h-8 rounded-lg"
                        textStyle={{ fontFamily: form.heading_font || form.font_family || 'Poppins' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Shop Banner Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      name="banner_url"
                      value={form.banner_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                    <label className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold cursor-pointer shrink-0">
                      Upload Banner
                      <input
                        type="file"
                        accept="image/*,.svg,.webp,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => handleImageFileChange('banner_url', e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Footer Tagline / Custom Note</label>
                  <input
                    type="text"
                    name="footer_note"
                    value={form.footer_note}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white text-gray-900 rounded-xl border border-gray-300 text-xs sm:text-sm"
                    placeholder="e.g. Handcrafted with love in Lagos, Nigeria."
                  />
                </div>
              </div>
            )}

            {/* Sticky Submit Footer */}
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
                className="flex-2 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50 text-center"
              >
                {saving ? 'Saving & Publishing...' : 'Save & Publish Customization'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

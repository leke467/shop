import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, productAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'
import LimitReachedModal, { extractLimitError } from '../components/subscription/LimitReachedModal'


function StatCard({ icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

const COLOR_PRESETS = [
  {
    name: 'Modern Blue',
    primary_color: '#2563EB',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    background_color: '#FFFFFF',
    surface_color: '#F9FAFB',
    text_color: '#111827',
    muted_text_color: '#6B7280',
  },
  {
    name: 'Sunset Rose',
    primary_color: '#E11D48',
    secondary_color: '#F59E0B',
    accent_color: '#8B5CF6',
    background_color: '#FFFBEB',
    surface_color: '#FEF3C7',
    text_color: '#1F2937',
    muted_text_color: '#4B5563',
  },
  {
    name: 'Forest Moss',
    primary_color: '#059669',
    secondary_color: '#D97706',
    accent_color: '#2563EB',
    background_color: '#F0FDF4',
    surface_color: '#DCFCE7',
    text_color: '#064E3B',
    muted_text_color: '#14532D',
  },
  {
    name: 'Dark Midnight',
    primary_color: '#6366F1',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    background_color: '#111827',
    surface_color: '#1F2937',
    text_color: '#F9FAFB',
    muted_text_color: '#9CA3AF',
  }
]

export default function ShopDashboard() {
  const { isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [productForm, setProductForm] = useState({ name: '', description: '', base_price: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [themeSaving, setThemeSaving] = useState(false)
  const [limitInfo, setLimitInfo] = useState(null)

  
  // Theme Builder State
  const [themeForm, setThemeForm] = useState({
    primary_color: '#2563EB',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    background_color: '#FFFFFF',
    surface_color: '#F9FAFB',
    text_color: '#111827',
    muted_text_color: '#6B7280',
    heading_font: 'Inter',
    body_font: 'Inter',
    border_radius: 8,
    button_style: 'solid',
    layout_style: 'modern',
    product_card_style: 'standard',
    dark_mode_enabled: false,
    custom_css: '',
  })

  const loadTheme = (slug) => {
    shopAPI.getTheme(slug)
      .then(t => {
        if (t) setThemeForm(t)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    setLoading(true)
    shopAPI.mine()
      .then(data => {
        const myShop = Array.isArray(data) ? data[0] : (data?.results ? data.results[0] : data)
        if (myShop) {
          setShop(myShop)
          if (myShop.slug) {
            loadTheme(myShop.slug)
            return productAPI.list({ shop: myShop.slug, page_size: 100 })
          }
        }
        return Promise.resolve([])
      })
      .then(data => setProducts(data?.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated, navigate])

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await productAPI.create({ ...productForm, shop: shop.slug })
      setProducts(prev => [created, ...prev])
      setProductForm({ name: '', description: '', base_price: '', status: 'active' })
      setTab('products')
    } catch (err) {
      const limit = extractLimitError(err)
      if (limit) {
        setLimitInfo(limit)
      } else {
        console.error('Create product failed', err)
      }
    } finally {
      setSaving(false)
    }
  }


  const handleSaveTheme = async (e) => {
    e.preventDefault()
    setThemeSaving(true)
    try {
      await shopAPI.updateTheme(shop.slug, themeForm)
      alert('Theme updated successfully!')
    } catch (err) {
      console.error('Failed to update theme', err)
      alert('Failed to save theme.')
    } finally {
      setThemeSaving(false)
    }
  }

  const handleResetTheme = async () => {
    if (!window.confirm('Are you sure you want to reset the theme to defaults?')) return
    setThemeSaving(true)
    try {
      await shopAPI.resetTheme(shop.slug)
      loadTheme(shop.slug)
      alert('Theme reset to defaults!')
    } catch (err) {
      console.error('Failed to reset theme', err)
    } finally {
      setThemeSaving(false)
    }
  }

  const applyPreset = (preset) => {
    setThemeForm(prev => ({
      ...prev,
      ...preset
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900">You don't have a shop yet</h2>
          <p className="text-gray-500 mt-2">Create one and start selling!</p>
          <Link to="/create-shop" className="mt-6 inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg">
            Create Shop
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { icon: '📦', label: 'Products', value: products.length, gradient: 'from-primary-500 to-secondary-500' },
    { icon: '⭐', label: 'Rating', value: Number(shop.rating_average || 0).toFixed(1), gradient: 'from-warning-400 to-warning-500' },
    { icon: '👥', label: 'Reviews', value: shop.rating_count || 0, gradient: 'from-accent-500 to-primary-500' },
    { icon: '📊', label: 'Status', value: shop.status, gradient: 'from-success-500 to-success-600' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'add-product', label: 'Add Product', icon: '➕' },
    { key: 'theme', label: 'Theme Builder', icon: '🎨' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow border border-gray-100 overflow-hidden flex items-center justify-center">
              {shop.logo ? (
                <img src={getImageUrl(shop.logo)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-600">{shop.name?.[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              <p className="text-sm text-gray-500">Dashboard</p>
            </div>
          </div>
          <Link to={`/shop/${shop.slug}`} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">
            View Storefront →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 mb-8 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <button onClick={() => setTab('add-product')} className="p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                    <span className="text-2xl">➕</span>
                    <h4 className="font-semibold text-gray-900 mt-2">Add Product</h4>
                    <p className="text-xs text-gray-500 mt-1">List a new item for sale</p>
                  </button>
                  <button onClick={() => setTab('products')} className="p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                    <span className="text-2xl">📋</span>
                    <h4 className="font-semibold text-gray-900 mt-2">Manage Products</h4>
                    <p className="text-xs text-gray-500 mt-1">Edit prices, stock, and details</p>
                  </button>
                  <button onClick={() => setTab('theme')} className="p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                    <span className="text-2xl">🎨</span>
                    <h4 className="font-semibold text-gray-900 mt-2">Theme Builder</h4>
                    <p className="text-xs text-gray-500 mt-1">Theme, branding, and info</p>
                  </button>
                </div>
              </div>
              {/* Recent products */}
              {products.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Products</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(0, 6).map(p => (
                      <div key={p.slug || p.public_id} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={getImageUrl(p.images[0].thumbnail || p.images[0].image)} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{p.name}</h4>
                          <p className="text-primary-600 font-bold text-sm mt-1">${Number(p.base_price || 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                            p.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {products.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 text-center">
                  <div className="text-5xl mb-3">📦</div>
                  <h3 className="text-xl font-bold text-gray-900">No products yet</h3>
                  <p className="text-gray-500 mt-2">Add your first product to start selling</p>
                  <button onClick={() => setTab('add-product')} className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold">Add Product</button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(p => (
                        <tr key={p.slug || p.public_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {p.images?.[0] ? <img src={getImageUrl(p.images[0].thumbnail || p.images[0].image)} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center w-full h-full text-sm">📦</span>}
                              </div>
                              <span className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">${Number(p.base_price || 0).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              p.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                            }`}>{p.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/product/${p.slug || p.public_id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'add-product' && (
            <motion.div key="add-product" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Product</h3>
                <form onSubmit={handleCreateProduct} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                    <input required value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="e.g. Premium Leather Bag" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea rows={4} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none" placeholder="Describe your product…" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                      <input type="number" step="0.01" min="0" required value={productForm.base_price} onChange={e => setProductForm(f => ({ ...f, base_price: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="29.99" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select value={productForm.status} onChange={e => setProductForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all">
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                  <motion.button type="submit" disabled={saving}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 disabled:opacity-60 transition-all"
                    whileHover={{ scale: saving ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}>
                    {saving ? 'Creating…' : 'Create Product'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {tab === 'theme' && (
            <motion.div key="theme" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Customizer form */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Theme Builder</h3>
                    <p className="text-sm text-gray-500">Design your shop's premium look and feel</p>
                  </div>

                  {/* Presets */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="px-3 py-2 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-2 transition-all"
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: preset.primary_color }} />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSaveTheme} className="space-y-4">
                    {/* Brand Colors */}
                    <div className="border-t border-gray-100 pt-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Color Palette</label>
                      <div className="grid grid-cols-2 gap-3.5">
                        {[
                          { key: 'primary_color', label: 'Primary' },
                          { key: 'secondary_color', label: 'Secondary' },
                          { key: 'accent_color', label: 'Accent' },
                          { key: 'background_color', label: 'Background' },
                          { key: 'surface_color', label: 'Surface' },
                          { key: 'text_color', label: 'Text' },
                        ].map((c) => (
                          <div key={c.key} className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-gray-600">{c.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={themeForm[c.key]}
                                onChange={e => setThemeForm(prev => ({ ...prev, [c.key]: e.target.value }))}
                                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 overflow-hidden"
                              />
                              <input
                                type="text"
                                maxLength={7}
                                value={themeForm[c.key]}
                                onChange={e => setThemeForm(prev => ({ ...prev, [c.key]: e.target.value }))}
                                className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg uppercase"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Layouts & Density */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Layout & Style</label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Layout Option</label>
                          <select
                            value={themeForm.layout_style}
                            onChange={e => setThemeForm(prev => ({ ...prev, layout_style: e.target.value }))}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="modern">Modern</option>
                            <option value="classic">Classic</option>
                            <option value="minimal">Minimal</option>
                            <option value="bold">Bold</option>
                            <option value="magazine">Magazine</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Card Style</label>
                          <select
                            value={themeForm.product_card_style}
                            onChange={e => setThemeForm(prev => ({ ...prev, product_card_style: e.target.value }))}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="standard">Standard</option>
                            <option value="compact">Compact</option>
                            <option value="overlay">Overlay</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Border Radius (px)</label>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={themeForm.border_radius}
                            onChange={e => setThemeForm(prev => ({ ...prev, border_radius: Number(e.target.value) }))}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Button Style</label>
                          <select
                            value={themeForm.button_style}
                            onChange={e => setThemeForm(prev => ({ ...prev, button_style: e.target.value }))}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="solid">Solid</option>
                            <option value="outline">Outline</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Font & Custom CSS */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heading Font</label>
                        <input
                          type="text"
                          value={themeForm.heading_font}
                          onChange={e => setThemeForm(prev => ({ ...prev, heading_font: e.target.value }))}
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Inter, Montserrat, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Custom CSS</label>
                        <textarea
                          rows={3}
                          value={themeForm.custom_css}
                          onChange={e => setThemeForm(prev => ({ ...prev, custom_css: e.target.value }))}
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-mono"
                          placeholder="/* Custom CSS */"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-4">
                      <motion.button
                        type="submit"
                        disabled={themeSaving}
                        className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-all"
                        whileTap={{ scale: 0.98 }}
                      >
                        {themeSaving ? 'Saving…' : 'Save Theme'}
                      </motion.button>
                      <button
                        type="button"
                        onClick={handleResetTheme}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {/* Theme Live Preview */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="sticky top-24">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Live Storefront Preview</label>
                    <div 
                      className="border border-gray-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300"
                      style={{ backgroundColor: themeForm.background_color }}
                    >
                      {/* Shop Banner preview */}
                      <div 
                        className="h-28 flex items-center justify-center relative transition-all"
                        style={{ background: `linear-gradient(135deg, ${themeForm.primary_color}, ${themeForm.secondary_color})` }}
                      >
                        <span className="text-white text-lg font-bold tracking-wide drop-shadow-sm">{shop.name}</span>
                      </div>

                      {/* Header Navbar preview */}
                      <div 
                        className="px-4 py-3 flex items-center justify-between border-b border-gray-200/20"
                        style={{ backgroundColor: themeForm.surface_color }}
                      >
                        <span className="text-xs font-bold" style={{ color: themeForm.text_color }}>🏪 Store</span>
                        <div className="flex gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeForm.primary_color }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeForm.accent_color }} />
                        </div>
                      </div>

                      {/* Store Mock Content */}
                      <div className="p-5 space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold" style={{ color: themeForm.text_color, fontFamily: themeForm.heading_font }}>
                            Welcome to our premium storefront
                          </h4>
                          <p className="text-xs leading-relaxed" style={{ color: themeForm.muted_text_color, fontFamily: themeForm.body_font }}>
                            This preview instantly renders according to the chosen style tokens. Edit choices on the left to see modifications.
                          </p>
                        </div>

                        {/* Product Card Mock Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {[
                            { name: 'Classic Leather Watch', price: '$120.00' },
                            { name: 'Minimalist Sunglasses', price: '$45.00' }
                          ].map((item, index) => (
                            <div 
                              key={index}
                              className="border border-gray-200/50 shadow-sm overflow-hidden"
                              style={{ 
                                borderRadius: `${themeForm.border_radius}px`,
                                backgroundColor: themeForm.surface_color 
                              }}
                            >
                              <div className="h-20 bg-gray-200/50 flex items-center justify-center text-xs text-gray-400">
                                📷 Product Image
                              </div>
                              <div className="p-3 space-y-2">
                                <h5 className="text-[11px] font-bold truncate" style={{ color: themeForm.text_color }}>{item.name}</h5>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold" style={{ color: themeForm.primary_color }}>{item.price}</span>
                                  {themeForm.button_style === 'solid' ? (
                                    <button 
                                      type="button"
                                      className="text-[9px] px-2 py-1 text-white font-semibold shadow-sm"
                                      style={{ 
                                        borderRadius: `${themeForm.border_radius}px`,
                                        backgroundColor: themeForm.primary_color 
                                      }}
                                    >
                                      Buy
                                    </button>
                                  ) : (
                                    <button 
                                      type="button"
                                      className="text-[9px] px-2 py-1 font-semibold border"
                                      style={{ 
                                        borderRadius: `${themeForm.border_radius}px`,
                                        borderColor: themeForm.primary_color,
                                        color: themeForm.primary_color
                                      }}
                                    >
                                      Buy
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shop Settings</h3>
                <p className="text-gray-500 text-sm mb-6">Manage your shop details and branding</p>
                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer" onClick={() => setTab('theme')}>
                    <h4 className="font-semibold text-gray-900">🎨 Theme & Branding</h4>
                    <p className="text-sm text-gray-500 mt-1">Customize colors, logo, and banner</p>
                  </div>
                  <div className="p-5 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">📋 Shop Info</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{shop.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Slug</span><span className="font-medium text-gray-400">{shop.slug}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${shop.status === 'active' ? 'text-success-600' : 'text-gray-500'}`}>{shop.status}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Currency</span><span className="font-medium">{shop.currency || 'USD'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {limitInfo && (
        <LimitReachedModal info={limitInfo} onClose={() => setLimitInfo(null)} />
      )}
    </div>
  )
}


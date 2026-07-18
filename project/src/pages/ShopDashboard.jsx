import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI, productAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'
import LimitReachedModal, { extractLimitError } from '../components/subscription/LimitReachedModal'
import CustomDomainManager from '../components/shop/CustomDomainManager'
import DeliveryZoneManager from '../components/shop/DeliveryZoneManager'
import { useNotification } from '../context/NotificationContext'

// Persist the last-selected shop so switching shops survives reloads.
const SELECTED_SHOP_KEY = 'dashboard.selectedShopSlug'



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
  },
  {
    name: 'Cyberpunk Neon',
    primary_color: '#D946EF',
    secondary_color: '#06B6D4',
    accent_color: '#F43F5E',
    background_color: '#09090B',
    surface_color: '#18181B',
    text_color: '#FAFAFA',
    muted_text_color: '#A1A1AA',
  },
  {
    name: 'Earthy Terracotta',
    primary_color: '#9A3412',
    secondary_color: '#B45309',
    accent_color: '#047857',
    background_color: '#FAF6F1',
    surface_color: '#F5EBE1',
    text_color: '#431407',
    muted_text_color: '#78350F',
  },
  {
    name: 'Ocean Breeze',
    primary_color: '#0284C7',
    secondary_color: '#0D9488',
    accent_color: '#3B82F6',
    background_color: '#F0F9FF',
    surface_color: '#E0F2FE',
    text_color: '#0C4A6E',
    muted_text_color: '#0369A1',
  },
  {
    name: 'Minimalist Mono',
    primary_color: '#171717',
    secondary_color: '#525252',
    accent_color: '#404040',
    background_color: '#FFFFFF',
    surface_color: '#F5F5F5',
    text_color: '#000000',
    muted_text_color: '#737373',
  }
]

export default function ShopDashboard() {
  const { isAuthenticated, loading: userLoading } = useUser()
  const navigate = useNavigate()
  const [shops, setShops] = useState([])          // all shops the user owns
  const [shop, setShop] = useState(null)          // the currently-selected shop
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [tab, setTab] = useState('overview')
  const [productForm, setProductForm] = useState({ name: '', description: '', base_price: '', status: 'active' })
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [themeSaving, setThemeSaving] = useState(false)
  const [limitInfo, setLimitInfo] = useState(null)
  const { toast, confirm } = useNotification()

  // Escrow, Orders, Wallet States
  const [shopOrders, setShopOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [deliveryCodeForm, setDeliveryCodeForm] = useState({}) // { groupId: '' }
  const [codeConfirming, setCodeConfirming] = useState({}) // { groupId: false }

  // KYC States
  const [kycStatus, setKycStatus] = useState('unverified')
  const [kycForm, setKycForm] = useState({ legal_name: '', document: null })
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycLoading, setKycLoading] = useState(false)



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
      .catch(() => { })
  }

  // Load the products for a given shop into state.
  const loadProducts = (slug) =>
    productAPI.list({ shop: slug, page_size: 100 })
      .then(data => setProducts(data?.results || data || []))
      .catch(() => setProducts([]))

  const loadOrders = (slug) => {
    setOrdersLoading(true)
    orderAPI.shopOrders(slug)
      .then(data => setShopOrders(data || []))
      .catch(() => setShopOrders([]))
      .finally(() => setOrdersLoading(false))
  }

  const loadWallet = (slug) => {
    setWalletLoading(true)
    orderAPI.wallet(slug)
      .then(data => setWallet(data))
      .catch(() => setWallet(null))
      .finally(() => setWalletLoading(false))
  }

  const loadKYC = (slug) => {
    setKycLoading(true)
    shopAPI.getVerification(slug)
      .then(data => {
        setKycStatus(data.verification_status || 'unverified')
        setKycForm(f => ({ ...f, legal_name: data.verification_legal_name || '' }))
      })
      .catch(() => setKycStatus('unverified'))
      .finally(() => setKycLoading(false))
  }

  // Switch the dashboard to a different shop the user owns.
  const selectShop = (target) => {
    if (!target || target.slug === shop?.slug) return
    setSwitching(true)
    setShop(target)
    setTab('overview')
    try { localStorage.setItem(SELECTED_SHOP_KEY, target.slug) } catch { /* ignore */ }
    loadTheme(target.slug)
    loadOrders(target.slug)
    loadWallet(target.slug)
    loadKYC(target.slug)
    Promise.resolve(loadProducts(target.slug)).finally(() => setSwitching(false))
  }

  useEffect(() => {
    if (userLoading) return
    if (!isAuthenticated) { navigate('/login'); return }
    setLoading(true)
    shopAPI.mine()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || (data ? [data] : []))
        setShops(list)

        // Restore the previously-selected shop, else default to the first.
        let selected = list[0]
        try {
          const savedSlug = localStorage.getItem(SELECTED_SHOP_KEY)
          if (savedSlug) {
            const match = list.find(s => s.slug === savedSlug)
            if (match) selected = match
          }
        } catch { /* ignore */ }

        if (selected) {
          setShop(selected)
          if (selected.slug) {
            loadTheme(selected.slug)
            loadOrders(selected.slug)
            loadWallet(selected.slug)
            loadKYC(selected.slug)
            return loadProducts(selected.slug)
          }
        }
        return Promise.resolve()
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [isAuthenticated, userLoading, navigate])


  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let savedProduct;
      const { imageFiles, ...payload } = productForm;

      if (editingProduct) {
        savedProduct = await productAPI.update(editingProduct.slug || editingProduct.public_id, payload)
        setProducts(prev => prev.map(p => (p.slug || p.public_id) === (savedProduct.slug || savedProduct.public_id) ? savedProduct : p))
      } else {
        savedProduct = await productAPI.create(shop.slug, payload)
        setProducts(prev => [savedProduct, ...prev])
      }

      if (productForm.imageFiles && productForm.imageFiles.length > 0) {
        toast(`Uploading ${productForm.imageFiles.length} image(s)...`)
        const uploadedImages = []
        for (const file of productForm.imageFiles) {
          const identifier = savedProduct.public_id || savedProduct.slug;
          const uploadedImg = await productAPI.uploadImage(identifier, file)
          uploadedImages.push(uploadedImg)
        }

        // Update local product state with the new images
        setProducts(prev => prev.map(p => {
          if ((p.slug || p.public_id) === (savedProduct.slug || savedProduct.public_id)) {
            return { ...p, images: [...uploadedImages, ...(p.images || [])] }
          }
          return p
        }))
      }

      toast(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
      setProductForm({ name: '', description: '', base_price: '', status: 'active', imageFiles: [] })
      setEditingProduct(null)
      setTab('products')
    } catch (err) {
      const limit = extractLimitError(err)
      if (limit) {
        setLimitInfo(limit)
      } else {
        console.error('Failed to save product', err)
        toast('Failed to save product.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      status: product.status
    })
    setTab('add-product')
  }

  const handleDeleteProduct = async (product) => {
    if (!(await confirm('Are you sure you want to delete this product?'))) return
    try {
      await productAPI.delete(product.slug || product.public_id)
      setProducts(prev => prev.filter(p => (p.slug || p.public_id) !== (product.slug || product.public_id)))
      toast('Product deleted successfully')
    } catch (err) {
      console.error('Failed to delete product', err)
      toast('Failed to delete product.', 'error')
    }
  }


  const handleSaveTheme = async (e) => {
    e.preventDefault()
    setThemeSaving(true)
    try {
      await shopAPI.updateTheme(shop.slug, themeForm)
      toast('Theme updated successfully!')
    } catch (err) {
      console.error('Failed to update theme', err)
      toast('Failed to save theme.', 'error')
    } finally {
      setThemeSaving(false)
    }
  }

  const handleResetTheme = async () => {
    if (!(await confirm('Are you sure you want to reset the theme to defaults?'))) return
    setThemeSaving(true)
    try {
      await shopAPI.resetTheme(shop.slug)
      loadTheme(shop.slug)
      toast('Theme reset to defaults!')
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

  const handleShopStatusChange = async (newStatus) => {
    try {
      const updated = await shopAPI.update(shop.slug, { status: newStatus })
      setShop(updated)
      // Also update it in the `shops` array so the sidebar reflects the change
      setShops(prev => prev.map(s => s.slug === shop.slug ? updated : s))
      toast(`Shop status updated to ${newStatus}`)
    } catch (err) {
      console.error('Failed to update shop status', err)
      toast('Failed to update shop status.', 'error')
    }
  }

  const handleDeleteShop = async () => {
    if (!(await confirm(`Are you sure you want to completely delete "${shop.name}"? This action cannot be undone and will delete all associated products.`))) return
    try {
      await shopAPI.delete(shop.slug)
      const remainingShops = shops.filter(s => s.slug !== shop.slug)
      setShops(remainingShops)
      if (remainingShops.length > 0) {
        selectShop(remainingShops[0])
      } else {
        try { localStorage.removeItem(SELECTED_SHOP_KEY) } catch { /* ignore */ }
        navigate('/create-shop')
      }
      toast('Shop deleted successfully.')
    } catch (err) {
      console.error('Failed to delete shop', err)
      toast('Failed to delete shop.', 'error')
    }
  }

  const handleConfirmDeliveryCode = async (e, groupId) => {
    e.preventDefault()
    const code = deliveryCodeForm[groupId] || ''
    if (!code) return
    
    setDeliveryCodeForm(prev => ({ ...prev, [groupId]: '' }))
    setCodeConfirming(prev => ({ ...prev, [groupId]: true }))

    try {
      const res = await orderAPI.confirmDelivery(groupId, code)
      toast(res.detail || 'Delivery confirmed! Escrow released.')
      loadOrders(shop.slug)
      loadWallet(shop.slug)
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to confirm delivery code. Please verify the code and try again.', 'error')
    } finally {
      setCodeConfirming(prev => ({ ...prev, [groupId]: false }))
    }
  }

  const handleKYCSubmit = async (e) => {
    e.preventDefault()
    if (!kycForm.legal_name || !kycForm.document) {
      toast('Legal name and document are required', 'error')
      return
    }

    setKycSubmitting(true)
    const formData = new FormData()
    formData.append('legal_name', kycForm.legal_name)
    formData.append('document', kycForm.document)

    try {
      const res = await shopAPI.submitVerification(shop.slug, formData)
      toast(res.detail || 'Verification request submitted!')
      setKycStatus(res.verification_status || 'pending')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to submit verification request.', 'error')
    } finally {
      setKycSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
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
    { key: 'orders', label: 'Orders', icon: '📥' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'add-product', label: 'Add Product', icon: '➕' },
    { key: 'theme', label: 'Theme Builder', icon: '🎨' },
    { key: 'wallet', label: 'Wallet', icon: '💳' },
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

          <div className="flex items-center gap-3">
            {/* Multi-shop switcher: only shown when the user owns more than one. */}
            {shops.length > 1 && (
              <div className="relative">
                <label htmlFor="shop-switcher" className="sr-only">Select shop</label>
                <select
                  id="shop-switcher"
                  value={shop.slug}
                  onChange={e => {
                    const target = shops.find(s => s.slug === e.target.value)
                    selectShop(target)
                  }}
                  disabled={switching}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-60"
                >
                  {shops.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
              </div>
            )}

            <Link to="/create-shop" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all">
              + New Shop
            </Link>
            <Link to={`/shop/${shop.slug}`} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">
              View Storefront →
            </Link>
          </div>
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
              onClick={() => {
                setTab(t.key)
                if (t.key === 'add-product') {
                  setEditingProduct(null)
                  setProductForm({ name: '', description: '', base_price: '', status: 'active' })
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                          <p className="text-primary-600 font-bold text-sm mt-1">₦{Number(p.base_price || 0).toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${p.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                            }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {ordersLoading ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 text-center text-gray-500 animate-pulse">
                  Loading orders...
                </div>
              ) : shopOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 text-center">
                  <div className="text-5xl mb-3">📥</div>
                  <h3 className="text-xl font-bold text-gray-900">No orders yet</h3>
                  <p className="text-gray-500 mt-2">Any orders from your buyers will show up here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {shopOrders.map(order => (
                    <div key={order.group_id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <span className="text-xs text-gray-400 font-semibold uppercase">Order ID</span>
                          <h4 className="font-bold text-gray-900 text-sm">#{order.order_id}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Placed on {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                            order.status === 'delivered' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                          }`}>
                            Fulfillment: {order.status}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                            order.escrow_status === 'released' ? 'bg-success-100 text-success-700' :
                            order.escrow_status === 'disputed' ? 'bg-error-100 text-error-700 font-bold animate-pulse' :
                            'bg-warning-100 text-warning-700'
                          }`}>
                            Escrow: {order.escrow_status}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h5>
                          <p className="text-sm font-semibold text-gray-800">{order.buyer_name}</p>
                          <p className="text-xs text-gray-500">{order.buyer_email}</p>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items Purchased</h5>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-gray-600">{item.quantity}x {item.product_name} {item.variant_name && `(${item.variant_name})`}</span>
                                <span className="font-bold text-gray-800">₦{Number(item.line_total).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-xs font-bold">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-800">₦{Number(order.shipping_total).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm font-extrabold mt-1">
                            <span className="text-gray-900">Total Revenue</span>
                            <span className="text-primary-600">₦{(Number(order.subtotal) + Number(order.shipping_total)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {order.escrow_status === 'held' && (
                        <form onSubmit={(e) => handleConfirmDeliveryCode(e, order.group_id)} className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-end gap-3 max-w-md">
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Enter Delivery Confirmation Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 482917"
                              required
                              value={deliveryCodeForm[order.group_id] || ''}
                              onChange={e => setDeliveryCodeForm(prev => ({ ...prev, [order.group_id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={codeConfirming[order.group_id]}
                            className="px-5 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-semibold transition-all shadow-md shadow-success-500/10 whitespace-nowrap disabled:opacity-50"
                          >
                            {codeConfirming[order.group_id] ? 'Confirming…' : 'Release Escrow'}
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'wallet' && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {walletLoading ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 text-center text-gray-500 animate-pulse">
                  Loading wallet...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Balance cards */}
                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-lg">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-75">Available Balance</p>
                      <h4 className="text-3xl font-black mt-2">₦{Number(wallet?.balance || 0).toLocaleString()}</h4>
                      <p className="text-[10px] opacity-75 mt-3">Released escrow funds ready for payout</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned (Lifetime)</p>
                      <h4 className="text-3xl font-black text-gray-800 mt-2">₦{Number(wallet?.total_earned || 0).toLocaleString()}</h4>
                      <p className="text-[10px] text-gray-400 mt-3">Cumulative earnings including payouts</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Withdrawn</p>
                      <h4 className="text-3xl font-black text-gray-800 mt-2">₦{Number(wallet?.total_withdrawn || 0).toLocaleString()}</h4>
                      <p className="text-[10px] text-gray-400 mt-3">Funds successfully wired to your account</p>
                    </div>
                  </div>

                  {/* Manual payout instructions */}
                  <div className="bg-warning-50 border border-warning-200 rounded-2xl p-5 flex gap-4">
                    <div className="text-2xl">💡</div>
                    <div>
                      <h5 className="font-semibold text-warning-850 text-sm">Need a payout transfer?</h5>
                      <p className="text-xs text-warning-700 mt-1 leading-relaxed">
                        Payout processing is currently managed by platform administrators. To request a manual withdrawal of your available balance directly to your bank account, please contact payout support with your shop slug (<strong>{shop.slug}</strong>).
                      </p>
                    </div>
                  </div>

                  {/* Ledger entries */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                      <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Transaction Ledger</h4>
                    </div>
                    {wallet?.transactions?.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-400">No transactions recorded yet</div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <tr>
                            <th className="text-left px-6 py-3">Date</th>
                            <th className="text-left px-6 py-3">Description</th>
                            <th className="text-left px-6 py-3">Reference</th>
                            <th className="text-right px-6 py-3">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {wallet?.transactions?.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-gray-900">{tx.kind_display}</span>
                                {tx.notes && <p className="text-[10px] text-gray-400 mt-0.5">{tx.notes}</p>}
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500 font-mono">{tx.reference || '-'}</td>
                              <td className={`px-6 py-4 text-right font-bold ${
                                tx.kind === 'escrow_release' || tx.kind === 'adjustment' ? 'text-success-600' : 'text-error-600'
                              }`}>
                                {tx.kind === 'escrow_release' || tx.kind === 'adjustment' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
                  <button onClick={() => { setTab('add-product'); setEditingProduct(null); setProductForm({ name: '', description: '', base_price: '', status: 'active' }); }} className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold">Add Product</button>
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
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">₦{Number(p.base_price || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                              }`}>{p.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-4">
                            <Link to={`/product/${p.slug || p.public_id}`} target="_blank" className="text-sm text-gray-500 hover:text-gray-700 font-medium">View</Link>
                            <button onClick={() => handleEditProduct(p)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                            <button onClick={() => handleDeleteProduct(p)} className="text-sm text-red-600 hover:text-red-700 font-medium">Delete</button>
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
                <h3 className="text-xl font-bold text-gray-900 mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <form onSubmit={handleCreateProduct} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                    <input required value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="e.g. Premium Leather Bag" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea rows={4} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none" placeholder="Describe your product…" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                      <input type="number" step="0.01" min="0" required value={productForm.base_price} onChange={e => setProductForm(f => ({ ...f, base_price: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" placeholder="29.99" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select value={productForm.status} onChange={e => setProductForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all">
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images (Optional, up to 4)</label>
                    <input type="file" accept="image/*" multiple onChange={e => {
                      const files = Array.from(e.target.files).slice(0, 4);
                      setProductForm(f => ({ ...f, imageFiles: files }));
                    }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                    {productForm.imageFiles?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{productForm.imageFiles.length} file(s) selected.</p>
                    )}
                  </div>
                  <motion.button type="submit" disabled={saving}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 disabled:opacity-60 transition-all"
                    whileHover={{ scale: saving ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}>
                    {saving ? 'Saving…' : (editingProduct ? 'Save Changes' : 'Create Product')}
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
                                className="w-20 px-2 py-1 text-xs border border-gray-200 bg-white text-gray-900 rounded-lg uppercase"
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
                            className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                            className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                            className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Button Style</label>
                          <select
                            value={themeForm.button_style}
                            onChange={e => setThemeForm(prev => ({ ...prev, button_style: e.target.value }))}
                            className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                          className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Inter, Montserrat, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Custom CSS</label>
                        <textarea
                          rows={3}
                          value={themeForm.custom_css}
                          onChange={e => setThemeForm(prev => ({ ...prev, custom_css: e.target.value }))}
                          className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-mono"
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
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status</span>
                        <select
                          className="input py-1 px-2 text-sm w-32"
                          value={shop.status}
                          onChange={(e) => handleShopStatusChange(e.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Manual Delivery Toggle */}
                      <div className="flex justify-between items-center py-2 border-t border-gray-100 mt-2">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">Manual Delivery</span>
                          <span className="text-xs text-gray-500">Allow buyers to arrange delivery directly with you</span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const updated = await shopAPI.update(shop.slug, { allow_manual_delivery: !shop.allow_manual_delivery })
                              setShop(updated)
                              setShops(prev => prev.map(s => s.slug === shop.slug ? updated : s))
                              toast(`Manual delivery ${updated.allow_manual_delivery ? 'enabled' : 'disabled'}`)
                            } catch (err) {
                              toast('Failed to update manual delivery setting', 'error')
                            }
                          }}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${shop.allow_manual_delivery ? 'bg-primary-500' : 'bg-gray-200'
                            }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-transform ${shop.allow_manual_delivery ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>

                      <div className="flex justify-between border-t border-gray-100 pt-3 mt-3">
                        <span className="text-gray-500">Currency</span>
                        <span className="font-medium">{shop.currency || 'USD'}</span>
                      </div>
                    </div>
                  </div>



                  {/* Delivery Zones */}
                  {!shop.allow_manual_delivery && (
                    <DeliveryZoneManager slug={shop.slug} onToast={(msg) => toast(msg)} />
                  )}

                  {/* Custom domain — feature-gated; opens the upgrade modal on 403 */}
                  <CustomDomainManager slug={shop.slug} onLimit={setLimitInfo} />

                  {/* KYC Verification */}
                  <div className="p-5 rounded-xl border border-gray-200 bg-white">
                    <h4 className="font-semibold text-gray-900 mb-2">🛡️ Identity Verification (KYC)</h4>
                    <p className="text-xs text-gray-500 mb-4">Required to secure your shop against scam tags and lift payout limits.</p>

                    {kycLoading ? (
                      <div className="text-xs text-gray-400 animate-pulse">Checking verification status...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Status:</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            kycStatus === 'verified' ? 'bg-success-100 text-success-700' :
                            kycStatus === 'pending' ? 'bg-warning-100 text-warning-700' :
                            kycStatus === 'rejected' ? 'bg-error-100 text-error-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {kycStatus === 'unverified' ? 'Not Verified' : kycStatus}
                          </span>
                        </div>

                        {kycStatus === 'unverified' && (
                          <form onSubmit={handleKYCSubmit} className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Legal / Registered Name</label>
                              <input
                                type="text"
                                required
                                placeholder="Legal name matching document"
                                value={kycForm.legal_name}
                                onChange={e => setKycForm(prev => ({ ...prev, legal_name: e.target.value }))}
                                className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Upload ID Document (NIN / BVN verification letter / CAC)</label>
                              <input
                                type="file"
                                required
                                onChange={e => setKycForm(prev => ({ ...prev, document: e.target.files[0] }))}
                                className="w-full text-xs px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100 file:text-xs file:font-semibold hover:file:bg-gray-250"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={kycSubmitting}
                              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-all disabled:opacity-50"
                            >
                              {kycSubmitting ? 'Submitting…' : 'Submit Verification Docs'}
                            </button>
                          </form>
                        )}

                        {kycStatus === 'pending' && (
                          <div className="p-3 rounded-lg bg-warning-50 border border-warning-100 text-xs text-warning-700 leading-relaxed">
                            ⏱️ Your verification documents are currently under review. Payout capabilities and the verified seller badge will unlock as soon as identity checks pass.
                          </div>
                        )}

                        {kycStatus === 'verified' && (
                          <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-xs text-success-700 flex items-center gap-1.5 font-medium">
                            ✅ Your identity has been verified successfully. Your storefront now proudly features the verified badge!
                          </div>
                        )}

                        {kycStatus === 'rejected' && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-error-50 border border-error-100 text-xs text-error-700 leading-relaxed">
                              ❌ Your verification was rejected. Please review your details and re-submit matching documentation.
                            </div>
                            <button
                              onClick={() => setKycStatus('unverified')}
                              className="w-full py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-all"
                            >
                              Re-submit documents
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-12 pt-6 border-t border-error-100">
                    <h4 className="font-bold text-error-600 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Permanently delete this shop and all of its products. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteShop}
                      className="px-4 py-2 bg-error-50 text-error-600 font-semibold rounded-lg hover:bg-error-100 transition-colors border border-error-200"
                    >
                      Delete Shop
                    </button>
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


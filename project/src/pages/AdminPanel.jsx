import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { adminDashboardAPI, subscriptionAPI, paymentSettingsAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import { useNotification } from '../context/NotificationContext'
import SEOHead from '../components/SEOHead'
import Logo from '../components/Logo'
import SubscriptionCouponCardModal from '../components/admin/SubscriptionCouponCardModal'

export default function AdminPanel() {
  const { user, isAdmin, isStaff, isAuthenticated, loading: userLoading } = useUser()
  const { toast } = useNotification()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data states
  const [overview, setOverview] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [usersList, setUsersList] = useState([])
  const [payments, setPayments] = useState(null)
  const [disputes, setDisputes] = useState([])
  const [referrals, setReferrals] = useState(null)
  const [couponsList, setCouponsList] = useState([])
  const [availablePlans, setAvailablePlans] = useState([])
  const [redemptionsList, setRedemptionsList] = useState([])
  const [activeCouponModal, setActiveCouponModal] = useState(null)
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false)
  const [couponForm, setCouponForm] = useState({
    code: '',
    target_plan_code: '',
    discount_type: 'percentage',
    discount_value: '100',
    duration_months: 1,
    max_uses: '',
    expires_at: '',
  })

  // Filters & Search
  const [orderFilter, setOrderFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Action modals
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Payment Gateway Settings
  const [gatewaySettings, setGatewaySettings] = useState({
    paystack_enabled: true,
    monnify_enabled: true,
    default_provider: 'monnify',
  })
  const [gatewayLoading, setGatewayLoading] = useState(false)

  useEffect(() => {
    if (userLoading) return
    if (!isAuthenticated || (!isAdmin && !isStaff)) {
      navigate('/')
      return
    }
    fetchTabData(activeTab)
  }, [activeTab, isAuthenticated, isAdmin, isStaff, userLoading, navigate])

  const fetchTabData = async (tab) => {
    try {
      setLoading(true)
      if (tab === 'overview') {
        const data = await adminDashboardAPI.overview()
        setOverview(data)
      } else if (tab === 'orders') {
        const data = await adminDashboardAPI.orders({ status: orderFilter, search: searchQuery })
        setOrders(data.orders || [])
      } else if (tab === 'products') {
        const data = await adminDashboardAPI.products({ search: searchQuery })
        setProducts(data.products || [])
      } else if (tab === 'users') {
        const data = await adminDashboardAPI.users({ role: userRoleFilter, search: searchQuery })
        setUsersList(data.users || [])
      } else if (tab === 'payments') {
        const [pData, sData] = await Promise.all([
          adminDashboardAPI.payments().catch(() => null),
          paymentSettingsAPI.admin.getSettings().catch(() => null),
        ])
        setPayments(pData)
        if (sData) setGatewaySettings(sData)
      } else if (tab === 'disputes') {
        const data = await adminDashboardAPI.disputes()
        setDisputes(data.disputes || [])
      } else if (tab === 'referrals') {
        const data = await adminDashboardAPI.referrals()
        setReferrals(data)
      } else if (tab === 'coupons') {
        const [coups, plansData, redemps] = await Promise.all([
          subscriptionAPI.admin.listCoupons().catch(() => []),
          subscriptionAPI.plans().catch(() => []),
          subscriptionAPI.admin.listRedemptions().catch(() => []),
        ])
        setCouponsList(Array.isArray(coups) ? coups : (coups?.results || []))
        setAvailablePlans(Array.isArray(plansData) ? plansData : (plansData?.results || []))
        setRedemptionsList(Array.isArray(redemps) ? redemps : (redemps?.results || []))
      }
    } catch (err) {
      console.error(`Failed to load ${tab} data:`, err)
      toast(`Failed to load ${tab} data.`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- Actions ---
  const handleProductApprovalToggle = async (productId, currentApproved) => {
    try {
      await adminDashboardAPI.updateProduct(productId, { is_approved: !currentApproved })
      toast(`Product ${!currentApproved ? 'approved' : 'unapproved'} successfully!`, 'success')
      fetchTabData('products')
    } catch (err) {
      toast('Failed to update product approval.', 'error')
    }
  }

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await adminDashboardAPI.updateUser(userId, { role: newRole })
      toast(`User role updated to ${newRole}!`, 'success')
      fetchTabData('users')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update user role.'
      toast(msg, 'error')
    }
  }

  const handleUserActiveToggle = async (userId, currentActive) => {
    try {
      await adminDashboardAPI.updateUser(userId, { is_active: !currentActive })
      toast(`User ${!currentActive ? 'activated' : 'deactivated'}!`, 'success')
      fetchTabData('users')
    } catch (err) {
      toast('Failed to update user status.', 'error')
    }
  }

  const handleResolveDispute = async (disputeId, action) => {
    try {
      setActionLoading(true)
      await adminDashboardAPI.resolveDispute(disputeId, { action, admin_notes: adminNotes })
      toast(`Dispute ${action === 'release_seller' ? 'released to seller' : 'refunded to buyer'}!`, 'success')
      setSelectedDispute(null)
      setAdminNotes('')
      fetchTabData('disputes')
    } catch (err) {
      toast('Failed to resolve dispute.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // --- Payment Gateway Controls ---
  const handleToggleGateway = async (gatewayKey, currentValue) => {
    try {
      setGatewayLoading(true)
      const res = await paymentSettingsAPI.admin.updateSettings({
        [gatewayKey]: !currentValue,
      })
      setGatewaySettings(res)
      toast(`Payment Gateway ${gatewayKey.includes('paystack') ? 'Paystack' : 'Monnify'} ${!currentValue ? 'activated' : 'deactivated'}!`, 'success')
    } catch (err) {
      toast('Failed to update payment gateway setting.', 'error')
    } finally {
      setGatewayLoading(false)
    }
  }

  // --- Subscription Coupon Actions ---
  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let rand = ''
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const tierPrefix = couponForm.target_plan_code ? couponForm.target_plan_code.toUpperCase().slice(0, 3) : 'VIP'
    setCouponForm(prev => ({ ...prev, code: `${tierPrefix}-${rand}` }))
  }

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault()
    if (!couponForm.code.trim()) {
      toast('Please enter or generate a coupon code.', 'error')
      return
    }
    try {
      setIsCreatingCoupon(true)
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        target_plan_code: couponForm.target_plan_code || null,
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value) || 100,
        duration_months: parseInt(couponForm.duration_months, 10) || 1,
        max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses, 10) : null,
        expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
      }
      const newCoupon = await subscriptionAPI.admin.createCoupon(payload)
      toast(`Registration Coupon '${newCoupon.code}' created successfully!`, 'success')
      setCouponForm({
        code: '',
        target_plan_code: '',
        discount_type: 'percentage',
        discount_value: '100',
        duration_months: 1,
        max_uses: '',
        expires_at: '',
      })
      fetchTabData('coupons')
      setActiveCouponModal(newCoupon)
    } catch (err) {
      const msg = err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to create coupon.'
      toast(msg, 'error')
    } finally {
      setIsCreatingCoupon(false)
    }
  }

  const handleToggleCouponActive = async (coupon) => {
    try {
      await subscriptionAPI.admin.updateCoupon(coupon.id, { is_active: !coupon.is_active })
      toast(`Coupon ${coupon.code} ${!coupon.is_active ? 'activated' : 'deactivated'}!`, 'success')
      fetchTabData('coupons')
    } catch (err) {
      toast('Failed to update coupon status.', 'error')
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) return
    try {
      await subscriptionAPI.admin.deleteCoupon(coupon.id)
      toast(`Coupon ${coupon.code} deleted.`, 'success')
      fetchTabData('coupons')
    } catch (err) {
      toast('Failed to delete coupon.', 'error')
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'orders', label: 'Order Management', icon: '📦' },
    { key: 'products', label: 'Product Management', icon: '🛍️' },
    { key: 'users', label: 'User Management', icon: '👥' },
    { key: 'payments', label: 'Payments & Revenue', icon: '💳' },
    { key: 'disputes', label: 'Disputes & Returns', icon: '⚖️' },
    { key: 'referrals', label: 'Referral Program', icon: '🎁' },
    { key: 'coupons', label: 'Subscription Coupons', icon: '🎟️' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row pt-16">
      <SEOHead title="Superadmin Control Center | MultiShopNG" />

      {/* Dark Sidebar */}
      <aside className="w-full md:w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Logo size="md" isDarkBg={true} />
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">
              Superadmin
            </span>
          </div>

          <nav className="space-y-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.key
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-850'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
          <span>Logged in as:</span>
          <span className="font-medium text-gray-300 truncate max-w-[100px]">{user?.email}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && overview && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <h2 className="text-2xl font-extrabold text-white">Platform Performance</h2>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80">Total Revenue</p>
                    <p className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">
                      ₦{Number(overview.total_revenue).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80">Total Orders</p>
                    <p className="text-2xl sm:text-3xl font-extrabold mt-2">
                      {overview.total_orders}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white shadow-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80">Active Users</p>
                    <p className="text-2xl sm:text-3xl font-extrabold mt-2">
                      {overview.total_users}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80">Active Shops</p>
                    <p className="text-2xl sm:text-3xl font-extrabold mt-2">
                      {overview.total_shops}
                    </p>
                  </div>
                </div>

                {/* 30-Day Revenue Chart */}
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-6">30-Day Daily Revenue Trend</h3>
                  <div className="flex items-end gap-2 h-44 pt-6 overflow-x-auto">
                    {overview.daily_revenue?.map((item, idx) => (
                      <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center group relative">
                        <div
                          className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all"
                          style={{
                            height: `${Math.max(10, Math.min(100, (item.revenue / (Math.max(...overview.daily_revenue.map(d => d.revenue)) || 1)) * 100))}%`
                          }}
                        />
                        <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">{item.date}</span>
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-950 text-white text-xs px-2 py-1 rounded shadow pointer-events-none transition-opacity font-mono">
                          ₦{item.revenue.toLocaleString()} ({item.orders_count} orders)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-4">Top-Selling Products</h3>
                  <div className="divide-y divide-gray-700">
                    {overview.top_products?.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.shop_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-emerald-400 font-bold">₦{Number(p.price).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{p.sales_count} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ORDER MANAGEMENT TAB */}
            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-extrabold text-white">Order Management</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={orderFilter}
                      onChange={(e) => { setOrderFilter(e.target.value); fetchTabData('orders') }}
                      className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Buyer</th>
                          <th className="px-6 py-4">Shop</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Fulfilment</th>
                          <th className="px-6 py-4">Escrow</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-750">
                            <td className="px-6 py-4 font-mono font-bold text-white">#{o.public_id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-gray-300">{o.buyer_email}</td>
                            <td className="px-6 py-4 text-gray-300">{o.shop_name}</td>
                            <td className="px-6 py-4 font-mono text-emerald-400 font-bold">₦{Number(o.total_price).toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-200">
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                o.escrow_status === 'released' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'
                              }`}>
                                {o.escrow_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRODUCT MANAGEMENT TAB */}
            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-extrabold text-white">Product Moderation & Inventory</h2>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Product Name</th>
                          <th className="px-6 py-4">Shop</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Approved</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-750">
                            <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                            <td className="px-6 py-4 text-gray-300">{p.shop_name}</td>
                            <td className="px-6 py-4 font-mono text-emerald-400 font-bold">₦{Number(p.base_price).toLocaleString()}</td>
                            <td className="px-6 py-4 text-gray-300">{p.stock}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.is_approved ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'}`}>
                                {p.is_approved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleProductApprovalToggle(p.id, p.is_approved)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  p.is_approved
                                    ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {p.is_approved ? 'Unapprove' : 'Approve'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* USER MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-extrabold text-white">User Directory & Roles</h2>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); fetchTabData('users') }}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">User Email</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-750">
                            <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                            <td className="px-6 py-4 text-gray-300">{u.name}</td>
                            <td className="px-6 py-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                                className="bg-gray-900 border border-gray-700 text-xs text-white rounded px-2 py-1 focus:outline-none"
                              >
                                <option value="buyer">Buyer</option>
                                <option value="seller">Seller</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.is_active ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'}`}>
                                {u.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleUserActiveToggle(u.id, u.is_active)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-all"
                              >
                                {u.is_active ? 'Disable' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">Payments & Gateway Controls</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage live payment processors, audit checkout logs, and process disbursements.</p>
                  </div>
                </div>

                {/* Gateway Switch Controls Card */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span>⚙️</span> Payment Gateway Status & Availability
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Activate or deactivate payment providers platform-wide. When deactivated, customers and vendors will only see active gateways during checkout and subscription upgrades.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Paystack Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${gatewaySettings.paystack_enabled ? 'bg-gray-900/90 border-emerald-500/40' : 'bg-gray-900/40 border-rose-500/30 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">P</span>
                          <div>
                            <h4 className="font-bold text-white text-sm">Paystack Gateway</h4>
                            <p className="text-xs text-gray-400">Cards, Bank Transfer, USSD</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gatewaySettings.paystack_enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                          {gatewaySettings.paystack_enabled ? '● Active' : '○ Deactivated'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={gatewayLoading}
                        onClick={() => handleToggleGateway('paystack_enabled', gatewaySettings.paystack_enabled)}
                        className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow ${gatewaySettings.paystack_enabled ? 'bg-rose-600/90 hover:bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {gatewaySettings.paystack_enabled ? 'Deactivate Paystack' : 'Activate Paystack'}
                      </button>
                    </div>

                    {/* Monnify Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${gatewaySettings.monnify_enabled ? 'bg-gray-900/90 border-emerald-500/40' : 'bg-gray-900/40 border-rose-500/30 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm">M</span>
                          <div>
                            <h4 className="font-bold text-white text-sm">Monnify (Moniepoint)</h4>
                            <p className="text-xs text-gray-400">Direct Bank Transfer, Cards</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gatewaySettings.monnify_enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                          {gatewaySettings.monnify_enabled ? '● Active' : '○ Deactivated'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={gatewayLoading}
                        onClick={() => handleToggleGateway('monnify_enabled', gatewaySettings.monnify_enabled)}
                        className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all shadow ${gatewaySettings.monnify_enabled ? 'bg-rose-600/90 hover:bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {gatewaySettings.monnify_enabled ? 'Deactivate Monnify' : 'Activate Monnify'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Monnify Payments Log */}
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-md">
                    <h3 className="font-bold text-white mb-4">Customer Payments Log</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {payments.payments?.map((p) => (
                        <div key={p.id} className="p-3 bg-gray-900 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white uppercase">{p.provider}</p>
                            <p className="text-gray-400 font-mono">{p.provider_payment_id || 'Ref'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-emerald-400 font-bold">₦{Number(p.amount).toLocaleString()}</p>
                            <span className="text-gray-400 capitalize">{p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monnify Payout Requests */}
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-md">
                    <h3 className="font-bold text-white mb-4">Vendor & Referral Payouts</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {payments.payouts?.map((po) => (
                        <div key={po.id} className="p-3 bg-gray-900 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{po.shop_name}</p>
                            <p className="text-gray-400">{po.bank_name} - {po.account_number}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-emerald-400 font-bold">₦{Number(po.amount).toLocaleString()}</p>
                            <span className={`px-2 py-0.5 rounded font-bold ${po.status === 'completed' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'}`}>
                              {po.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DISPUTES TAB */}
            {activeTab === 'disputes' && (
              <motion.div key="disputes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-extrabold text-white">Dispute Resolution</h2>

                {disputes.length === 0 ? (
                  <div className="bg-gray-800 p-12 text-center rounded-2xl border border-gray-700 text-gray-400">
                    No active escrow disputes open!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((d) => (
                      <div key={d.id} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-700 pb-3">
                          <div>
                            <h4 className="font-bold text-white">Order #{d.public_id.slice(0, 8)}</h4>
                            <p className="text-xs text-gray-400">Shop: {d.shop_name} | Buyer: {d.buyer_email}</p>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold text-lg">₦{Number(d.total_price).toLocaleString()}</span>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-xl text-xs text-gray-300">
                          <p className="font-bold text-amber-400 mb-1">Dispute Reason:</p>
                          <p>{d.dispute_reason || 'No specific reason provided.'}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="text"
                            placeholder="Admin resolution notes..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-none"
                          />
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleResolveDispute(d.id, 'release_seller')}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                            >
                              Release to Seller
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, 'refund_buyer')}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                            >
                              Refund Buyer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* REFERRALS TAB */}
            {activeTab === 'referrals' && referrals && (
              <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-extrabold text-white">Referral & Affiliate Oversight</h2>

                {/* Reward Config Display */}
                <div className="grid grid-cols-2 gap-4 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                  <div>
                    <p className="text-xs uppercase text-gray-400">Subscription Referral Bonus</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                      ₦{Number(referrals.settings?.subscription_referral_bonus || 500).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Sales Commission Share %</p>
                    <p className="text-xl font-bold text-indigo-400 mt-1 font-mono">
                      {referrals.settings?.commission_referral_share || 20}%
                    </p>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-md">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="font-bold text-white text-sm">Top Referrers Leaderboard</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-3">Code</th>
                          <th className="px-6 py-3">Referrer</th>
                          <th className="px-6 py-3">Shops Referred</th>
                          <th className="px-6 py-3">Buyers Referred</th>
                          <th className="px-6 py-3">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {referrals.leaderboard?.map((l) => (
                          <tr key={l.code} className="hover:bg-gray-750">
                            <td className="px-6 py-3 font-mono font-bold text-white">{l.code}</td>
                            <td className="px-6 py-3 text-gray-300">{l.referrer_email}</td>
                            <td className="px-6 py-3 text-gray-300">{l.total_referred_sellers}</td>
                            <td className="px-6 py-3 text-gray-300">{l.total_referred_buyers}</td>
                            <td className="px-6 py-3 font-mono text-emerald-400 font-bold">₦{Number(l.total_earnings).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUBSCRIPTION COUPONS TAB */}
            {activeTab === 'coupons' && (
              <motion.div key="coupons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Subscription Promo & Registration Coupons</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Create discount vouchers and 100% free trial codes for vendor subscription tiers with shareable graphics.
                  </p>
                </div>

                {/* Create Coupon Card */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-lg font-bold text-white">Create New Subscription Coupon</h3>
                      <p className="text-xs text-gray-400">Generate a voucher code for a specific plan or all tiers.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                      🎟️ Promo Pass
                    </span>
                  </div>

                  <form onSubmit={handleCreateCouponSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Code Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-300">Coupon Code *</label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomCode}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
                        >
                          ⚡ Auto-Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. GROWTH-FREE100"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Target Subscription Tier */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Target Subscription Tier</label>
                      <select
                        value={couponForm.target_plan_code}
                        onChange={(e) => setCouponForm({ ...couponForm, target_plan_code: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">🌐 All Subscription Tiers (Universal)</option>
                        {availablePlans.map((p) => (
                          <option key={p.code} value={p.code}>
                            👑 {p.name} (₦{Number(p.monthly_price).toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discount Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Discount Type</label>
                      <select
                        value={couponForm.discount_type}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="percentage">Percentage (%) - e.g. 100% Free</option>
                        <option value="fixed">Fixed Amount (₦) Off</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">
                        {couponForm.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₦)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={couponForm.discount_type === 'percentage' ? '100' : '1000000'}
                        value={couponForm.discount_value}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Free Duration */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Access Duration (Months)</label>
                      <select
                        value={couponForm.duration_months}
                        onChange={(e) => setCouponForm({ ...couponForm, duration_months: parseInt(e.target.value, 10) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="1">1 Month Access</option>
                        <option value="3">3 Months Access</option>
                        <option value="6">6 Months Access</option>
                        <option value="12">12 Months (1 Year) Access</option>
                        <option value="0">Lifetime / Open-Ended Access</option>
                      </select>
                    </div>

                    {/* Max Uses & Expiry */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300">Max Uses</label>
                        <input
                          type="number"
                          placeholder="∞ Unlimited"
                          min="1"
                          value={couponForm.max_uses}
                          onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-300">Expiration</label>
                        <input
                          type="date"
                          value={couponForm.expires_at}
                          onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isCreatingCoupon}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isCreatingCoupon ? 'Creating Voucher...' : '✨ Create Subscription Coupon'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Coupons List Table */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Active Promotional Coupons</h3>
                      <p className="text-xs text-gray-400">Total coupons: {couponsList.length}</p>
                    </div>
                  </div>

                  {couponsList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">🎟️</p>
                      <p className="font-semibold text-sm">No subscription coupons created yet.</p>
                      <p className="text-xs text-gray-500 mt-1">Use the form above to generate your first promo code.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                          <tr>
                            <th className="px-6 py-4">Code & Tier</th>
                            <th className="px-6 py-4">Discount</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4">Usage / Cap</th>
                            <th className="px-6 py-4">Expiration</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {couponsList.map((c) => {
                            const is100 = c.discount_type === 'percentage' && Number(c.discount_value) >= 100
                            return (
                              <tr key={c.id} className="hover:bg-gray-750 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-mono font-black text-white text-base tracking-wider">{c.code}</p>
                                  <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded bg-gray-900 text-cyan-300 font-semibold border border-gray-700">
                                    {c.plan_name ? `👑 ${c.plan_name}` : '🌐 All Tiers'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    is100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                  }`}>
                                    {is100 ? '100% FREE' : c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₦${Number(c.discount_value).toLocaleString()} OFF`}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                  {c.duration_months === 0 ? 'Lifetime' : `${c.duration_months} mo`}
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-300">
                                  <span className="font-bold text-white">{c.times_used}</span> / {c.max_uses ?? '∞'}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400">
                                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No Expiry'}
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleToggleCouponActive(c)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                      c.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    }`}
                                  >
                                    {c.is_active ? '● Active' : '○ Inactive'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <button
                                    onClick={() => setActiveCouponModal(c)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-bold text-xs rounded-lg shadow transition-all active:scale-95"
                                  >
                                    🎨 Share Card
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(c)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                                    title="Delete Coupon"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Redemptions Audit Log */}
                {redemptionsList.length > 0 && (
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-gray-700">
                      <h3 className="text-lg font-bold text-white">Recent Vendor Redemptions Log</h3>
                      <p className="text-xs text-gray-400">Total redemptions recorded: {redemptionsList.length}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Coupon Code</th>
                            <th className="px-6 py-3">Activated Plan</th>
                            <th className="px-6 py-3">Discount Applied</th>
                            <th className="px-6 py-3">Duration</th>
                            <th className="px-6 py-3">Redeemed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {redemptionsList.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-750">
                              <td className="px-6 py-3 text-white font-medium">{r.user_email}</td>
                              <td className="px-6 py-3 font-mono font-bold text-cyan-400">{r.coupon_code}</td>
                              <td className="px-6 py-3 text-gray-300">{r.plan_name}</td>
                              <td className="px-6 py-3 font-mono text-emerald-400">₦{Number(r.discount_applied).toLocaleString()}</td>
                              <td className="px-6 py-3 text-gray-300">{r.duration_months_granted} mo</td>
                              <td className="px-6 py-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Shareable Coupon Card Modal */}
      {activeCouponModal && (
        <SubscriptionCouponCardModal
          coupon={activeCouponModal}
          onClose={() => setActiveCouponModal(null)}
        />
      )}
    </div>
  )
}
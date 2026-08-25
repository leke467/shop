import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { orderAPI } from '../../services/api'
import { useUser } from '../../context/UserContext'

export default function TemplateOrdersView({ shop, shopSlug, theme = 'default' }) {
  const { user, isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [deliveryCodes, setDeliveryCodes] = useState({})
  const [loadingCodes, setLoadingCodes] = useState({})

  const baseSlug = shopSlug || shop?.slug || ''
  const shopHomeUrl = baseSlug ? /shop/ : '/'

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      orderAPI.list({ shop: baseSlug })
        .then(res => {
          const allOrders = res.results || res || []
          // Filter to only orders containing items for this shop
          const shopOrders = allOrders.filter(order => {
            if (!order.groups || order.groups.length === 0) return true
            return order.groups.some(g => (g.shop_slug || '').toLowerCase() === baseSlug.toLowerCase())
          })
          setOrders(shopOrders)
        })
        .catch(err => {
          console.error('Failed to load store orders', err)
          setOrders([])
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [baseSlug, isAuthenticated])

  const fetchDeliveryCodes = async (orderId) => {
    if (loadingCodes[orderId]) return
    setLoadingCodes(prev => ({ ...prev, [orderId]: true }))
    try {
      const data = await orderAPI.deliveryCodes(orderId)
      const codeMap = {}
      const list = data?.codes || (Array.isArray(data) ? data : [])
      list.forEach(item => {
        if (item.delivery_code) {
          if (item.group_id) {
            codeMap[item.group_id] = item.delivery_code
            codeMap[String(item.group_id)] = item.delivery_code
          }
          if (item.shop_slug) {
            codeMap[item.shop_slug] = item.delivery_code
          }
          codeMap.latest = item.delivery_code
        }
      })
      setDeliveryCodes(prev => ({ ...prev, [orderId]: codeMap }))
    } catch (err) {
      console.error('Failed to load delivery codes', err)
    } finally {
      setLoadingCodes(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const isDark = ['obsidian', 'cyberpunk', 'industrial', 'zenith', 'futura'].includes(theme)
  const bgClass = isDark ? 'bg-[#0B0F19] text-white min-h-screen pt-28 pb-20' : 'bg-gray-50 text-gray-900 min-h-screen pt-28 pb-20'
  const cardClass = isDark ? 'bg-[#121826] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'

  return (
    <div className={bgClass}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
              <Link to={shopHomeUrl} className="hover:underline">← Back to {shop?.name || 'Store'}</Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">My Orders from {shop?.name || 'This Store'}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your deliveries and retrieve verification codes for this shop.</p>
          </div>
          <Link
            to={shopHomeUrl}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all"
          >
            Browse Products
          </Link>
        </div>

        {!isAuthenticated ? (
          <div className={`p-8 sm:p-12 rounded-3xl ${cardClass} text-center space-y-4`}>
            <span className="text-5xl block">🔒</span>
            <h2 className="text-xl sm:text-2xl font-bold">Please log in to view your order history</h2>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">Log in with the account you used during purchase to track your packages and view delivery confirmation codes.</p>
            <Link to="/login" className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all">
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className={`p-6 rounded-3xl ${cardClass} animate-pulse space-y-3`}>
                <div className="h-4 bg-gray-200/50 rounded w-1/3" />
                <div className="h-6 bg-gray-200/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className={`p-8 sm:p-12 rounded-3xl ${cardClass} text-center space-y-4`}>
            <span className="text-5xl block">📦</span>
            <h2 className="text-xl sm:text-2xl font-bold">No orders found for this shop yet</h2>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">When you order products from {shop?.name || 'this shop'}, your tracking status, receipt, and delivery confirmation codes will appear here.</p>
            <Link to={shopHomeUrl} className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const shopGroups = (order.groups || []).filter(g => (g.shop_slug || '').toLowerCase() === baseSlug.toLowerCase())
              const displayGroups = shopGroups.length > 0 ? shopGroups : (order.groups || [])

              return (
                <div key={order.id || order.public_id} className={`p-6 rounded-3xl ${cardClass} space-y-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/10 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Order ID</span>
                      <p className="font-mono font-bold text-sm">{order.public_id}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Date</span>
                      <p className="text-xs font-semibold">{new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Payment</span>
                      <p className="text-xs font-bold capitalize text-emerald-500">{order.payment_status || 'Paid'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Total</span>
                      <p className="text-base font-extrabold text-amber-500">₦{Number(order.grand_total || order.total || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Groups & Items */}
                  <div className="space-y-4">
                    {displayGroups.map(group => {
                      const code = group.delivery_code 
                        || deliveryCodes[order.public_id]?.[group.id] 
                        || deliveryCodes[order.public_id]?.[String(group.id)] 
                        || deliveryCodes[order.public_id]?.[group.shop_slug]
                        || deliveryCodes[order.public_id]?.latest

                      return (
                        <div key={group.id} className="p-4 rounded-2xl bg-gray-500/5 border border-gray-500/10 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs sm:text-sm">Status: <span className="text-amber-500 capitalize">{group.status || 'Processing'}</span></span>
                            
                            {/* Delivery Code Button */}
                            {group.status !== 'delivered' && group.status !== 'cancelled' && (
                              <button
                                onClick={() => {
                                  if (!code) {
                                    fetchDeliveryCodes(order.public_id)
                                  } else {
                                    navigator?.clipboard?.writeText(code)
                                    alert(`Copied code ${code} to clipboard!`)
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  code 
                                    ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30' 
                                    : 'bg-amber-500 text-black hover:bg-amber-400 font-extrabold'
                                }`}
                              >
                                {loadingCodes[order.public_id] ? 'Fetching...' : (code ? `🔑 Code: ${code} (Copy)` : '🔑 Show Delivery Code')}
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {(group.items || []).map((item, idx) => (
                              <div key={item.id || idx} className="flex justify-between items-center text-xs sm:text-sm">
                                <div>
                                  <span className="font-bold">{item.product_name}</span>
                                  <span className="text-gray-400 ml-2">x{item.quantity}</span>
                                </div>
                                <span className="font-bold">₦{Number(item.line_total || (item.unit_price * item.quantity)).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

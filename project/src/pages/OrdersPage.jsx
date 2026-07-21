import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { orderAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import SEOHead from '../components/SEOHead'

export default function OrdersPage() {
  const { user } = useUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeGroup, setDisputeGroup] = useState(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputing, setDisputing] = useState(false)

  // Delivery codes state: { orderId: { groupId: "code" } }
  const [deliveryCodes, setDeliveryCodes] = useState({})
  const [loadingCodes, setLoadingCodes] = useState({})

  useEffect(() => {
    setLoading(true)
    orderAPI.list()
      .then(data => {
        setOrders(data.results || data)
      })
      .catch(err => console.error('Failed to load orders', err))
      .finally(() => setLoading(false))
  }, [])

  const fetchDeliveryCodes = async (orderId) => {
    if (deliveryCodes[orderId] || loadingCodes[orderId]) return
    setLoadingCodes(prev => ({ ...prev, [orderId]: true }))
    try {
      const data = await orderAPI.deliveryCodes(orderId)
      // data is { order_id: "...", codes: [ { group_id, delivery_code, ... } ] }
      const codeMap = {}
      const list = data?.codes || (Array.isArray(data) ? data : [])
      list.forEach(item => {
        if (item.group_id && item.delivery_code) {
          codeMap[item.group_id] = item.delivery_code
        }
      })
      setDeliveryCodes(prev => ({ ...prev, [orderId]: codeMap }))
    } catch (err) {
      console.error('Failed to load delivery codes', err)
    } finally {
      setLoadingCodes(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleDispute = async (e) => {
    e.preventDefault()
    if (!disputeGroup) return
    setDisputing(true)
    try {
      const res = await orderAPI.disputeOrder(disputeGroup.id, disputeReason)
      setShowDisputeModal(false)
      setDisputeReason('')
      // Refresh orders by re-fetching
      const data = await orderAPI.list()
      setOrders(data.results || data)
      alert(res.detail || 'Dispute opened successfully.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to open dispute.')
    } finally {
      setDisputing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-12 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-12 overflow-x-hidden">
      <SEOHead title="My Orders" />
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">Looks like you haven't made any purchases.</p>
            <Link to="/explore/products" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm sm:text-base hover:bg-primary-700 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.public_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm min-w-0">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base break-all">Order #{order.public_id.split('-')[0].toUpperCase()}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${order.status === 'delivered' ? 'bg-success-100 text-success-700' :
                          order.status === 'cancelled' ? 'bg-error-100 text-error-700' :
                          'bg-primary-100 text-primary-700'}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.groups?.length || 0} Shop(s)</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">Total Amount</p>
                    <p className="font-bold text-gray-900 text-base sm:text-lg">₦{Number(order.grand_total).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    {order.groups?.map(group => (
                      <div key={group.id} className="border border-gray-100 rounded-xl p-3.5 sm:p-4 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 sm:pb-4 border-b border-gray-50 min-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                              {group.shop_name?.[0] || 'S'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link to={`/shop/${group.shop}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-sm sm:text-base truncate block">
                                {group.shop_name}
                              </Link>
                              <div className="text-xs sm:text-sm text-gray-500">Status: <span className="font-medium text-gray-700">{group.status}</span></div>
                            </div>
                          </div>
                          
                          {/* Actions for this group */}
                          <div className="flex flex-wrap items-center gap-2">
                            {(group.escrow_status === 'held' || group.escrow_status === 'disputed') && (
                              <button 
                                onClick={() => {
                                  if (!deliveryCodes[order.public_id]) {
                                    fetchDeliveryCodes(order.public_id)
                                  }
                                }}
                                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              >
                                {loadingCodes[order.public_id] ? 'Loading...' : 'Show Delivery Code'}
                              </button>
                            )}
                            
                            {group.escrow_status === 'held' && (
                              <button 
                                onClick={() => {
                                  setDisputeGroup(group)
                                  setShowDisputeModal(true)
                                }}
                                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 transition-colors"
                              >
                                Raise Dispute
                              </button>
                            )}
                            {group.escrow_status === 'disputed' && (
                              <span className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-error-100 text-error-700">
                                Disputed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3 min-w-0">
                          {group.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-start gap-2 min-w-0 text-xs sm:text-sm">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                                {item.variant_name && <p className="text-gray-500 truncate">{item.variant_name}</p>}
                                <p className="text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium text-gray-900 flex-shrink-0">₦{Number(item.line_total).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Code Display */}
                        {deliveryCodes[order.public_id]?.[group.id] && (
                          <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-primary-50 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-primary-900 mb-1">Delivery Confirmation Code</p>
                              <p className="text-xs text-primary-700 max-w-sm leading-relaxed">
                                Give this code to the seller ONLY after you have received and inspected your items.
                              </p>
                            </div>
                            <div className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-primary-700 bg-white px-4 py-2 rounded-lg shadow-sm text-center flex-shrink-0">
                              {deliveryCodes[order.public_id][group.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && disputeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDisputeModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden min-w-0">
              <div className="p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Raise Dispute</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  Are you having issues with your order from <strong>{disputeGroup.shop_name}</strong>? Let us know and we'll hold the funds until it's resolved.
                </p>
                
                <form onSubmit={handleDispute}>
                  <div className="mb-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reason for Dispute</label>
                    <textarea 
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      required
                      rows="4"
                      placeholder="E.g., The item is damaged, not as described, or I never received it..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none box-border"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setShowDisputeModal(false)} className="px-4 py-2 text-xs sm:text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={disputing || !disputeReason.trim()} className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50">
                      {disputing ? 'Submitting...' : 'Open Dispute'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

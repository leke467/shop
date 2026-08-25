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

  // Refund request modal state
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundGroup, setRefundGroup] = useState(null)
  const [refundReason, setRefundReason] = useState('not_received')
  const [refundDescription, setRefundDescription] = useState('')
  const [requestingRefund, setRequestingRefund] = useState(false)
  const [refundRequests, setRefundRequests] = useState([])

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeGroup, setDisputeGroup] = useState(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputing, setDisputing] = useState(false)

  // Delivery codes state: { orderId: { groupId: "code" } }
  const [deliveryCodes, setDeliveryCodes] = useState({})
  const [loadingCodes, setLoadingCodes] = useState({})

  const loadData = () => {
    setLoading(true)
    Promise.all([
      orderAPI.list(),
      orderAPI.refundRequests().catch(() => []),
    ])
      .then(([ordersData, refundData]) => {
        setOrders(ordersData.results || ordersData)
        setRefundRequests(Array.isArray(refundData) ? refundData : (refundData?.results || []))
      })
      .catch(err => console.error('Failed to load orders/refunds', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const fetchDeliveryCodes = async (orderId) => {
    if (deliveryCodes[orderId] || loadingCodes[orderId]) return
    setLoadingCodes(prev => ({ ...prev, [orderId]: true }))
    try {
      const data = await orderAPI.deliveryCodes(orderId)
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

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return

    const itemsHtml = (order.groups || []).flatMap(g => (g.items || []).map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.product_name}</strong><br/>
          <small style="color: #666;">Store: ${g.shop_name} ${item.variant_name ? '| ' + item.variant_name : ''}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${Number(item.unit_price || (item.line_total / item.quantity)).toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₦${Number(item.line_total).toLocaleString()}</td>
      </tr>
    `)).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MultiShopNG Receipt #${order.public_id.split('-')[0].toUpperCase()}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; background: #fff; }
            .receipt-box { max-width: 680px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6236ff; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 26px; font-weight: 800; color: #6236ff; letter-spacing: -0.5px; }
            .status-badge { background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 14px; background: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #f3f4f6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #4b5563; }
            .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
            .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 16px; }
            .btn-print { background: #6236ff; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
            @media print { .btn-print { display: none; } body { padding: 0; } .receipt-box { border: none; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div style="text-align: right;"><button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button></div>
          <div class="receipt-box">
            <div class="header">
              <div>
                <div class="logo">MultiShopNG</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Official Payment & Escrow Receipt</div>
              </div>
              <div class="status-badge">✓ PAYMENT VERIFIED</div>
            </div>

            <div class="info-grid">
              <div>
                <strong>Order Ref:</strong> #${order.public_id.split('-')[0].toUpperCase()}<br/>
                <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br/>
                <strong>Escrow Status:</strong> Secured
              </div>
              <div style="text-align: right;">
                <strong>Buyer:</strong> ${user?.email || 'Registered Customer'}<br/>
                <strong>Stores Count:</strong> ${order.groups?.length || 1}<br/>
                <strong>Status:</strong> ${order.status.toUpperCase()}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item & Store</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-row">
              <span>Grand Total Paid:</span>
              <span style="color: #6236ff;">₦${Number(order.grand_total).toLocaleString()}</span>
            </div>

            <div class="footer">
              MultiShopNG — Official Payment Receipt. Funds are securely escrowed until buyer delivery confirmation.
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDispute = async (e) => {
    e.preventDefault()
    if (!disputeGroup) return
    setDisputing(true)
    try {
      const res = await orderAPI.disputeOrder(disputeGroup.id, disputeReason)
      setShowDisputeModal(false)
      setDisputeReason('')
      loadData()
      toast(res.detail || 'Dispute opened successfully.', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to open dispute.', 'error')
    } finally {
      setDisputing(false)
    }
  }

  const handleRequestRefund = async (e) => {
    e.preventDefault()
    if (!refundGroup) return
    setRequestingRefund(true)
    try {
      await orderAPI.requestRefund({
        order_group: refundGroup.id,
        reason: refundReason,
        description: refundDescription,
      })
      setShowRefundModal(false)
      setRefundDescription('')
      loadData()
      toast('Refund request submitted successfully! Our team will review it.', 'success')
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to submit refund request.', 'error')
    } finally {
      setRequestingRefund(false)
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
                          order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-primary-100 text-primary-700'}`}
                      >
                        {order.status === 'pending' ? 'UNPAID (PENDING PAYMENT)' : order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.groups?.length || 0} Shop(s)</p>
                  </div>
                  <div className="sm:text-right flex flex-col sm:items-end gap-1">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">Total Amount</p>
                    <p className="font-bold text-gray-900 text-base sm:text-lg">₦{Number(order.grand_total).toLocaleString()}</p>
                    <button
                      onClick={() => handlePrintReceipt(order)}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-xs font-semibold text-gray-700 transition-colors"
                    >
                      🧾 Print Receipt
                    </button>
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
                              <Link to={`/shop/${group.shop_slug || group.shop}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors text-sm sm:text-base truncate block">
                                {group.shop_name}
                              </Link>
                              <div className="text-xs sm:text-sm text-gray-500">Status: <span className="font-medium text-gray-700">{group.status}</span></div>
                            </div>
                          </div>
                          
                          {/* Actions for this group */}
                          <div className="flex flex-wrap items-center gap-2">
                            {order.status === 'pending' && (
                              <Link
                                to="/cart"
                                className="px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-sm hover:opacity-95 transition-all"
                              >
                                💳 Complete Payment
                              </Link>
                            )}

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

                            {/* Refund Request button / status badge */}
                            {group.escrow_status !== 'pending' && (() => {
                              const existingRR = refundRequests.find(rr => rr.order_group === group.id)
                              if (existingRR) {
                                return (
                                  <span className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg ${
                                    existingRR.status === 'approved' ? 'bg-success-100 text-success-700' :
                                    existingRR.status === 'rejected' ? 'bg-gray-100 text-gray-600' :
                                    'bg-warning-100 text-warning-800'
                                  }`}>
                                    Refund {existingRR.status_display || existingRR.status}
                                  </span>
                                )
                              }
                              if (group.escrow_status !== 'refunded') {
                                return (
                                  <button
                                    onClick={() => {
                                      setRefundGroup(group)
                                      setShowRefundModal(true)
                                    }}
                                    className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                                  >
                                    Request Refund
                                  </button>
                                )
                              }
                              return null
                            })()}
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
      {/* Refund Request Modal */}
      <AnimatePresence>
        {showRefundModal && refundGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRefundModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden min-w-0">
              <div className="p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Request Refund</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  Submit a refund request for your order from <strong>{refundGroup.shop_name}</strong>. Our support team will review your request.
                </p>
                
                <form onSubmit={handleRequestRefund}>
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reason for Refund</label>
                    <select
                      value={refundReason}
                      onChange={e => setRefundReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none box-border"
                    >
                      <option value="not_received">Item not received</option>
                      <option value="wrong_item">Wrong item received</option>
                      <option value="damaged">Item arrived damaged</option>
                      <option value="not_as_described">Item not as described</option>
                      <option value="changed_mind">Changed my mind</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={refundDescription}
                      onChange={e => setRefundDescription(e.target.value)}
                      required
                      rows="4"
                      placeholder="Explain why you are requesting a refund..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none box-border"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setShowRefundModal(false)} className="px-4 py-2 text-xs sm:text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={requestingRefund || !refundDescription.trim()} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors disabled:opacity-50">
                      {requestingRefund ? 'Submitting...' : 'Submit Refund Request'}
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

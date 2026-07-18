import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { orderAPI, shopAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'

const NIGERIAN_STATES = [
  { value: 'abia', label: 'Abia' },
  { value: 'adamawa', label: 'Adamawa' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'fct', label: 'FCT (Abuja)' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' },
]

function generateIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export default function CartPage() {
  const { isAuthenticated } = useUser()
  const { items, updateQty, removeItem, total, loading } = useCart()
  const navigate = useNavigate()
  const [updating, setUpdating] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutForm, setCheckoutForm] = useState({
    provider: 'paystack',
    full_name: '', phone: '', email: '',
    line1: '', line2: '', city: '', state: '', postal_code: '', country: 'NG',
  })

  // Delivery fee state
  const [selectedState, setSelectedState] = useState('')
  const [deliveryFees, setDeliveryFees] = useState({}) // { shopSlug: { fee, available } }
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [unavailableShops, setUnavailableShops] = useState([]) // shops that don't deliver to selected state
  const [manualDeliverySelected, setManualDeliverySelected] = useState({}) // { shopSlug: true }

  // Note form state (for contacting shop owner)
  const [showNoteForm, setShowNoteForm] = useState(null) // shopSlug or null
  const [noteForm, setNoteForm] = useState({ sender_name: '', sender_email: '', message: '' })
  const [noteSending, setNoteSending] = useState(false)
  const [noteSent, setNoteSent] = useState({}) // { shopSlug: true }

  const subtotal = total || 0

  // Get unique shop slugs and settings from cart items
  const { shopSlugs, shopSettings } = useMemo(() => {
    const slugs = new Set()
    const settings = {}
    items.forEach(item => {
      const slug = item.variant?.product?.shop_slug || item.shop_slug || item.shopSlug
      if (slug) {
        slugs.add(slug)
        settings[slug] = {
          allow_manual_delivery: item.allow_manual_delivery || false
        }
      }
    })
    return { shopSlugs: [...slugs], shopSettings: settings }
  }, [items])

  // Fetch delivery fees when state changes
  useEffect(() => {
    if (!selectedState || shopSlugs.length === 0) {
      setDeliveryFees({})
      setUnavailableShops([])
      return
    }

    setDeliveryLoading(true)
    const promises = shopSlugs.map(slug =>
      shopAPI.deliveryZoneForState(slug, selectedState)
        .then(data => {
          const zones = Array.isArray(data) ? data : (data?.results || [])
          const activeZone = zones.find(z => z.is_active)
          return { slug, fee: activeZone ? parseFloat(activeZone.fee) : null, available: !!activeZone }
        })
        .catch(() => ({ slug, fee: null, available: false }))
    )

    Promise.all(promises).then(results => {
      const fees = {}
      const unavailable = []
      results.forEach(r => {
        fees[r.slug] = { fee: r.fee, available: r.available }
        if (!r.available) unavailable.push(r.slug)
      })
      setDeliveryFees(fees)
      setUnavailableShops(unavailable)
      setDeliveryLoading(false)
    })
  }, [selectedState, shopSlugs.join(',')])

  // Calculate total delivery fee
  const totalDeliveryFee = useMemo(() => {
    return Object.keys(deliveryFees).reduce((sum, slug) => {
      if (manualDeliverySelected[slug]) return sum
      return sum + (deliveryFees[slug].fee || 0)
    }, 0)
  }, [deliveryFees, manualDeliverySelected])

  const grandTotal = subtotal + (selectedState ? totalDeliveryFee : 0)
  
  const unresolvedShops = unavailableShops.filter(slug => !manualDeliverySelected[slug])
  const canCheckout = selectedState && unresolvedShops.length === 0 && !deliveryLoading

  const handleUpdateQty = async (itemId, qty) => {
    setUpdating(itemId)
    await updateQty(itemId, qty)
    setUpdating(null)
  }

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId)
    await removeItem(itemId)
    setUpdating(null)
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!canCheckout) return
    setCheckoutError('')
    setCheckoutLoading(true)
    try {
      const result = await orderAPI.checkout({
        ...checkoutForm,
        state: selectedState,
        delivery_state: selectedState,
        manual_delivery_shops: Object.keys(manualDeliverySelected).filter(s => manualDeliverySelected[s]),
        idempotency_key: generateIdempotencyKey(),
      })
      navigate('/', { state: { orderSuccess: true, orderId: result.order?.public_id } })
    } catch (err) {
      setCheckoutError(err.response?.data?.detail || 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const onProceedToCheckout = () => {
    if (isAuthenticated) {
      setShowCheckout(true)
    } else {
      navigate('/login')
    }
  }

  const handleSendNote = async (shopSlug) => {
    if (!noteForm.sender_name || !noteForm.sender_email) return
    setNoteSending(true)
    try {
      await shopAPI.sendDeliveryNote(shopSlug, {
        sender_name: noteForm.sender_name,
        sender_email: noteForm.sender_email,
        state_requested: selectedState,
        message: noteForm.message,
      })
      setNoteSent(prev => ({ ...prev, [shopSlug]: true }))
      setShowNoteForm(null)
      setNoteForm({ sender_name: '', sender_email: '', message: '' })
    } catch {}
    setNoteSending(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse flex gap-5">
                <div className="w-24 h-24 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-3"><div className="h-5 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-24" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="text-gray-500 mt-2">Start browsing and add some amazing products!</p>
            <Link to="/explore/products" className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.id || item.public_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-5"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img
                        src={getImageUrl(item.image || item.variant?.image)}
                        alt={item.product_name || item.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><rect width="24" height="24" fill="%23f3f4f6"/><text x="6" y="16" font-size="12">📦</text></svg>' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.product_name || item.name}</h3>
                      {item.variant_name && <p className="text-sm text-gray-400">{item.variant_name}</p>}
                      <p className="text-primary-600 font-bold mt-1">₦{Number(item.unit_price).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => handleRemoveItem(item.id || item.public_id)} className="text-gray-400 hover:text-error-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div className={`flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden ${updating === (item.id || item.public_id) ? 'opacity-50' : ''}`}>
                        <button onClick={() => handleUpdateQty(item.id || item.public_id, Math.max(1, item.quantity - 1))} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold">-</button>
                        <span className="px-3 py-1.5 text-sm font-semibold bg-gray-50 min-w-[40px] text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id || item.public_id, item.quantity + 1)} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold">+</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal ({items.length} items)</span><span className="font-semibold">₦{subtotal.toLocaleString()}</span></div>

                  {/* Delivery state selector */}
                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery State</label>
                    <select
                      value={selectedState}
                      onChange={e => setSelectedState(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                    >
                      <option value="">Select your state…</option>
                      {NIGERIAN_STATES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery fee breakdown */}
                  {selectedState && !deliveryLoading && (
                    <div className="space-y-4">
                      {shopSlugs.map(slug => {
                        const d = deliveryFees[slug]
                        const isManualAllowed = shopSettings[slug]?.allow_manual_delivery
                        const isManualSelected = manualDeliverySelected[slug]

                        return (
                          <div key={slug} className="flex flex-col space-y-2 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 font-medium truncate mr-2">Delivery ({slug})</span>
                              {isManualSelected ? (
                                <span className="font-semibold text-gray-700">₦0</span>
                              ) : d?.available ? (
                                <span className="font-semibold text-gray-700">₦{d.fee.toLocaleString()}</span>
                              ) : (
                                <span className="text-error-600 text-xs font-medium">Unavailable</span>
                              )}
                            </div>
                            
                            {isManualAllowed && (
                              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded-lg">
                                <input 
                                  type="checkbox" 
                                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                                  checked={!!isManualSelected}
                                  onChange={(e) => setManualDeliverySelected(prev => ({ ...prev, [slug]: e.target.checked }))}
                                />
                                <span className="text-xs text-gray-700">Arrange delivery manually with seller</span>
                              </label>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {deliveryLoading && selectedState && (
                    <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-gray-400 animate-pulse">Calculating…</span></div>
                  )}

                  {!selectedState && (
                    <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-gray-400">Select state</span></div>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex justify-between text-base">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Unavailable warning */}
                <AnimatePresence>
                  {unresolvedShops.length > 0 && selectedState && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3 rounded-xl bg-error-50 border border-error-200"
                    >
                      <p className="text-sm text-error-700 font-medium mb-2">
                        ⚠️ Delivery to {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} isn't available for:
                      </p>
                      {unresolvedShops.map(slug => (
                        <div key={slug} className="mt-2">
                          <p className="text-sm text-error-600 font-semibold">{slug}</p>
                          {noteSent[slug] ? (
                            <p className="text-xs text-success-600 mt-1">✅ Note sent! The shop owner will see your request.</p>
                          ) : (
                            <button
                              onClick={() => setShowNoteForm(showNoteForm === slug ? null : slug)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1 underline"
                            >
                              📩 Contact shop owner about delivery
                            </button>
                          )}

                          {/* Note form */}
                          <AnimatePresence>
                            {showNoteForm === slug && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 space-y-2"
                              >
                                <input
                                  placeholder="Your name"
                                  value={noteForm.sender_name}
                                  onChange={e => setNoteForm(p => ({ ...p, sender_name: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                />
                                <input
                                  placeholder="Your email"
                                  type="email"
                                  value={noteForm.sender_email}
                                  onChange={e => setNoteForm(p => ({ ...p, sender_email: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                />
                                <textarea
                                  placeholder="Leave a note for the shop owner (optional)"
                                  rows={2}
                                  value={noteForm.message}
                                  onChange={e => setNoteForm(p => ({ ...p, message: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                                />
                                <motion.button
                                  onClick={() => handleSendNote(slug)}
                                  disabled={noteSending || !noteForm.sender_name || !noteForm.sender_email}
                                  className="w-full py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                                  whileTap={{ scale: 0.97 }}
                                >
                                  {noteSending ? 'Sending…' : 'Send Note'}
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showCheckout ? (
                  <motion.button
                    onClick={onProceedToCheckout}
                    disabled={!canCheckout}
                    className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={canCheckout ? { scale: 1.01 } : {}}
                    whileTap={canCheckout ? { scale: 0.98 } : {}}
                  >
                    {!selectedState ? 'Select delivery state to continue' : 'Proceed to Checkout'}
                  </motion.button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleCheckout}
                    className="mt-6 space-y-4"
                  >
                    <h4 className="font-semibold text-gray-900">Shipping Details</h4>
                    
                    {/* Safety Banner */}
                    <div className="p-3.5 rounded-xl bg-warning-50 border border-warning-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-warning-850 uppercase tracking-wider">
                        🛡️ Escrow Protected Purchase
                      </div>
                      <p className="text-xs text-warning-700 leading-relaxed">
                        Your payment is held securely in escrow. Do not share your delivery code with the seller until you have received and inspected the products.
                      </p>
                    </div>

                    {checkoutError && (
                      <div className="p-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm">{checkoutError}</div>
                    )}
                    {[
                      { name: 'full_name', label: 'Full Name', required: true },
                      { name: 'email', label: 'Email', type: 'email', required: true },
                      { name: 'phone', label: 'Phone' },
                      { name: 'line1', label: 'Address Line 1', required: true },
                      { name: 'line2', label: 'Address Line 2' },
                      { name: 'city', label: 'City', required: true },
                      { name: 'postal_code', label: 'Postal Code' },
                    ].map(f => (
                      <input
                        key={f.name}
                        placeholder={f.label}
                        type={f.type || 'text'}
                        required={f.required}
                        maxLength={f.maxLength}
                        value={checkoutForm[f.name]}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                      />
                    ))}

                    {/* State (read-only — already selected above) */}
                    <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">
                      📍 Delivering to: <strong>{NIGERIAN_STATES.find(s => s.value === selectedState)?.label}</strong>
                    </div>

                    {/* Payment provider */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment</label>
                      <div className="flex gap-2">
                        {['stripe', 'paystack'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCheckoutForm(prev => ({ ...prev, provider: p }))}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                              checkoutForm.provider === p
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {p === 'stripe' ? '💳 Stripe' : '🏦 Paystack'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-success-600 to-success-500 text-white font-semibold shadow-lg shadow-success-500/25 disabled:opacity-60 transition-all"
                      whileTap={{ scale: 0.98 }}
                    >
                      {checkoutLoading ? 'Processing…' : `Pay ₦${grandTotal.toLocaleString()}`}
                    </motion.button>
                  </motion.form>
                )}

                <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Secured with 256-bit encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
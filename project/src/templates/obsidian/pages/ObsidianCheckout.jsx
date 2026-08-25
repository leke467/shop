import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import { useUser } from '../../../context/UserContext'
import { orderAPI, payoutAPI, shopAPI, couponAPI, paymentSettingsAPI } from '../../../services/api'

const NIGERIAN_STATES = [
  { value: 'lagos', label: 'Lagos' },
  { value: 'fct', label: 'Abuja (FCT)' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'delta', label: 'Delta' },
  { value: 'edo', label: 'Edo' },
  { value: 'kano', label: 'Kano' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'abia', label: 'Abia' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'osun', label: 'Osun' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' }
]

export default function ObsidianCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useUser()

  const cartList = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || [])
  const subtotal = cartList.reduce((sum, item) => sum + Number(item.unit_price || item.price || item.base_price || 0) * (item.quantity || 1), 0)

  const [selectedState, setSelectedState] = useState('lagos')
  const [deliveryZones, setDeliveryZones] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])

  // Gateway settings
  const [gatewaySettings, setGatewaySettings] = useState({ paystack_enabled: true, monnify_enabled: true, default_provider: 'monnify' })

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [form, setForm] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
    notes: '',
    provider: 'monnify',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderComplete, setOrderComplete] = useState(null)

  // Load gateway settings
  useEffect(() => {
    paymentSettingsAPI.getSettings()
      .then(res => {
        setGatewaySettings(res)
        const def = res.default_provider || (res.monnify_enabled ? 'monnify' : (res.paystack_enabled ? 'paystack' : 'bank_transfer'))
        setForm(prev => ({
          ...prev,
          provider: (!res.paystack_enabled && prev.provider === 'paystack') ? def : (prev.provider || def)
        }))
      })
      .catch(() => {})
  }, [])

  // Load delivery zones & bank accounts
  useEffect(() => {
    const slug = shop?.slug || shopSlug
    if (slug) {
      if (typeof shopAPI?.deliveryZones === 'function') {
        shopAPI.deliveryZones(slug)
          .then(res => setDeliveryZones(Array.isArray(res) ? res : (res?.results || [])))
          .catch(() => setDeliveryZones([]))
      }
      const getBanks = payoutAPI.listBanks || payoutAPI.bankAccounts
      if (typeof getBanks === 'function') {
        getBanks(slug)
          .then(res => setBankAccounts(res || []))
          .catch(() => setBankAccounts([]))
      }
    }
  }, [shop, shopSlug])

  const [deliveryFee, setDeliveryFee] = useState(0)

  useEffect(() => {
    const slug = shop?.slug || shopSlug
    if (!slug || !selectedState) return

    shopAPI.deliveryZoneForState(slug, selectedState)
      .then(data => {
        const zones = Array.isArray(data) ? data : (data?.results || [])
        const activeZone = zones.find(z => z.is_active !== false)
        if (activeZone && activeZone.fee !== null && activeZone.fee !== undefined) {
          setDeliveryFee(parseFloat(activeZone.fee))
        } else {
          setDeliveryFee(0)
        }
      })
      .catch(() => setDeliveryFee(0))
  }, [shop, shopSlug, selectedState])

  // Calculate financial totals
  const discount = Number(couponDiscount || 0)
  const netSubtotal = Math.max(0, subtotal - discount)
  const vat = Math.round(netSubtotal * 0.075)
  const grandTotal = netSubtotal + Number(deliveryFee || 0) + vat

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleApplyCoupon = async (e) => {
    e?.preventDefault()
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await couponAPI.apply({
        code: couponCode.trim(),
        shop_slug: shop?.slug || shopSlug,
        subtotal: subtotal,
      })
      const disc = Number(res.discount_amount || 0)
      setCouponDiscount(disc)
      setCouponApplied(res.code || couponCode.trim())
    } catch (err) {
      const data = err?.response?.data
      const errorMsg = typeof data === 'string'
        ? data
        : typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.detail?.detail === 'string'
        ? data.detail.detail
        : typeof data?.error === 'string'
        ? data.error
        : typeof data?.message === 'string'
        ? data.message
        : 'Invalid or expired coupon.'
      setCouponError(errorMsg)
      setCouponDiscount(0)
      setCouponApplied(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.shipping_address || !form.phone_number) {
      setError('Please complete your name, phone number, and delivery address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const idempotencyKey = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : '123e4567-e89b-12d3-a456-426614174000'

      const result = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: selectedState,
        state: selectedState,
        country: 'NG',
        delivery_state: selectedState,
        coupon_code: couponApplied || undefined,
        idempotency_key: idempotencyKey,
        shop_slug: shop?.slug || shopSlug,
      })

      const amountToPay = Number(result.payment?.amount || result.order?.grand_total || grandTotal)

      // Handle Moniepoint (Monnify) inline popup flow
      if (result.payment && (result.payment.provider === 'monnify' || form.provider === 'monnify')) {
        const monnifyData = result.payment || {}
        const reference = monnifyData.payment_reference || monnifyData.reference

        if (window.MonnifySDK) {
          window.MonnifySDK.initialize({
            amount: amountToPay,
            currency: 'NGN',
            customerName: form.full_name || user?.email || 'Customer',
            customerEmail: form.email || user?.email,
            paymentReference: reference,
            paymentDescription: `Order ${result.order?.public_id || ''}`,
            contractCode: monnifyData.contractCode || '286935449446',
            apiKey: monnifyData.apiKey || import.meta.env.VITE_MONNIFY_API_KEY || '',
            onComplete: function() {
              setLoading(true)
              orderAPI.verifyMonnify(reference)
                .then(() => {
                  clearCart && clearCart()
                  const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
                  const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
                  setOrderComplete({ ...orderData, reference, delivery_code: deliveryCode })
                })
                .catch(() => {
                  const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
                  const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
                  setOrderComplete({ ...orderData, delivery_code: deliveryCode })
                })
                .finally(() => setLoading(false))
            },
            onClose: function() {
              setError('Moniepoint payment popup closed. Order created — you can complete payment anytime.')
              setLoading(false)
            }
          })
          return
        } else if (monnifyData.checkout_url) {
          window.location.href = monnifyData.checkout_url
          return
        }
      }

      // Handle Paystack inline popup
      if (result.payment && result.payment.provider === 'paystack') {
        const paystackData = result.payment
        const accessCode = paystackData.access_code
        const reference = paystackData.reference

        if (window.PaystackPop && (accessCode || reference)) {
          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
            email: form.email || user?.email,
            amount: Math.round(amountToPay * 100),
            ref: reference,
            access_code: accessCode,
            onSuccess: async (transaction) => {
              try {
                await orderAPI.verifyPaystack(reference || transaction.reference)
                clearCart && clearCart()
                const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
                const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
                setOrderComplete({ ...orderData, reference: reference || transaction.reference, delivery_code: deliveryCode })
              } catch (err) {
                const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
                const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
                setOrderComplete({ ...orderData, delivery_code: deliveryCode })
              } finally {
                setLoading(false)
              }
            },
            onClose: () => {
              setError('Payment window closed. Order created — you can complete payment anytime.')
              setLoading(false)
            }
          })
          handler.openIframe()
          return
        }
      }

      // Direct Order Complete
      clearCart && clearCart()
      const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
      const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setOrderComplete({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      console.error('Checkout failed:', err)
      const data = err?.response?.data
      const errorMsg = typeof data === 'string'
        ? data
        : typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.detail?.detail === 'string'
        ? data.detail.detail
        : typeof data?.error === 'string'
        ? data.error
        : typeof data?.message === 'string'
        ? data.message
        : (err?.message || 'Failed to place order. Please try again.')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const baseSlug = shopSlug || shop?.slug || ''
  const shopHomeUrl = baseSlug ? `/shop/${baseSlug}` : '/'

  if (orderComplete) {
    return (
      <main className="py-24 max-w-2xl mx-auto px-4 text-center text-white">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 sm:p-12 rounded-3xl bg-[#0F1420] border border-white/10 space-y-6">
          <span className="text-5xl block">🎉</span>
          <h2 className="text-3xl font-extrabold">Order Placed Successfully!</h2>
          <p className="text-slate-400 text-sm">Thank you for shopping with <strong>{shop?.name || 'us'}</strong>!</p>

          {orderComplete.delivery_code && (
            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Delivery Confirmation Code</span>
              <div className="text-4xl font-black tracking-widest text-white">{orderComplete.delivery_code}</div>
              <p className="text-xs text-slate-400">Share this 6-digit code with the dispatch courier upon delivery to verify receipt.</p>
            </div>
          )}

          <button onClick={() => navigate(shopHomeUrl)} className="px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xl transition-all">
            Back to Storefront
          </button>
        </motion.div>
      </main>
    )
  }

  if (cartList.length === 0) {
    return (
      <main className="py-24 max-w-xl mx-auto px-4 text-center text-white">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4">
          <span className="text-5xl block">🛒</span>
          <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
          <p className="text-slate-400 text-sm">Add some products before proceeding to checkout.</p>
          <button onClick={() => navigate(baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog')} className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xl transition-all">
            Browse Catalog
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 text-white">
      <h1 className="text-3xl sm:text-4xl font-black mb-2">Checkout</h1>
      <p className="text-slate-400 text-sm mb-8">Complete your details to place your order directly with {shop?.name || 'us'}.</p>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>📍</span> Delivery Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Chukwuma Adebayo"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    required
                    placeholder="08012345678"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">State *</label>
                  <select
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#121826] border border-white/10 text-white outline-none focus:border-purple-500 text-sm"
                  >
                    {NIGERIAN_STATES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Delivery Address *</label>
                <textarea
                  name="shipping_address"
                  value={form.shipping_address}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="House/office street address"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm resize-y"
                />
              </div>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🎟️</span> Have a Coupon / Promo Code?
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. SAVE10)"
                disabled={Boolean(couponApplied)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm font-bold uppercase"
              />
              {couponApplied ? (
                <button
                  type="button"
                  onClick={() => { setCouponApplied(null); setCouponDiscount(0); setCouponCode(''); }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/30 transition-all"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              )}
            </div>
            {couponError && <p className="text-xs text-rose-400 font-medium">{couponError}</p>}
            {couponApplied && <p className="text-xs text-emerald-400 font-bold">✓ Coupon {couponApplied} applied (-₦{couponDiscount.toLocaleString()})</p>}
          </div>

          {/* Payment Provider Selection */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>💳</span> Payment Method
            </h3>

            <div className="space-y-3">
              {gatewaySettings.monnify_enabled !== false && (
                <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${form.provider === 'monnify' ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-white/10'}`}>
                  <input
                    type="radio"
                    name="provider"
                    value="monnify"
                    checked={form.provider === 'monnify'}
                    onChange={handleChange}
                    className="text-purple-500"
                  />
                  <div>
                    <span className="font-bold block text-sm">⚡ Moniepoint / Monnify</span>
                    <span className="text-xs text-slate-400">Instant Bank Transfer, Dynamic Accounts & Cards</span>
                  </div>
                </label>
              )}

              {gatewaySettings.paystack_enabled && (
                <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${form.provider === 'paystack' ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-white/10'}`}>
                  <input
                    type="radio"
                    name="provider"
                    value="paystack"
                    checked={form.provider === 'paystack'}
                    onChange={handleChange}
                    className="text-purple-500"
                  />
                  <div>
                    <span className="font-bold block text-sm">💳 Paystack</span>
                    <span className="text-xs text-slate-400">Cards, USSD & Bank Transfer</span>
                  </div>
                </label>
              )}

              {bankAccounts.length > 0 && (
                <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${form.provider === 'bank_transfer' ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-white/10'}`}>
                  <input
                    type="radio"
                    name="provider"
                    value="bank_transfer"
                    checked={form.provider === 'bank_transfer'}
                    onChange={handleChange}
                    className="text-purple-500"
                  />
                  <div>
                    <span className="font-bold block text-sm">🏦 Direct Bank Transfer</span>
                    <span className="text-xs text-slate-400">Transfer directly to vendor account</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base shadow-xl transition-all"
          >
            {loading ? 'Processing Order...' : `Place Order (₦${grandTotal.toLocaleString()})`}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4 sticky top-28">
          <h3 className="text-lg font-bold border-b border-white/10 pb-3">Order Summary ({cartList.length} items)</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cartList.map((item, idx) => (
              <div key={item.id || idx} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-white line-clamp-1">{item.name || item.product_name}</p>
                  <p className="text-xs text-slate-400">Qty: {item.quantity || 1}</p>
                </div>
                <span className="font-extrabold text-purple-400">₦{(Number(item.unit_price || item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-medium">₦{subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Coupon Discount</span>
                <span>-₦{discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Delivery ({selectedState})</span>
              <span className="text-white font-medium">₦{deliveryFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>VAT (7.5%)</span>
              <span className="text-white font-medium">₦{vat.toLocaleString()}</span>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-lg">
              <span className="font-bold text-slate-200">Total Amount</span>
              <span className="font-black text-2xl text-purple-400">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

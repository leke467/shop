import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { orderAPI, shopAPI, couponAPI, paymentSettingsAPI } from '../../services/api'

export const NIGERIAN_STATES = [
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

export default function TemplateCheckoutView({ shop, shopSlug, theme = 'default' }) {
  const navigate = useNavigate()
  const { cart = [], items = [], total: ctxTotal = 0, clearCart } = useCart() || {}
  const { user } = useUser() || {}

  const cartList = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(items) ? items : []))
  const subtotal = ctxTotal || cartList.reduce((sum, item) => sum + Number(item.unit_price || item.base_price || item.price || 0) * (item.quantity || 1), 0)

  const activeSlug = shop?.slug || shopSlug || ''
  const baseSlug = shop?.slug || shopSlug || ''

  // Delivery state
  const [selectedState, setSelectedState] = useState('lagos')
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(null)
  const [deliveryAvailable, setDeliveryAvailable] = useState(true)
  const [manualDeliverySelected, setManualDeliverySelected] = useState(false)

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBankIndex, setSelectedBankIndex] = useState(0)

  // Gateway settings
  const [gatewaySettings, setGatewaySettings] = useState({ paystack_enabled: true, monnify_enabled: true, default_provider: 'monnify' })

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  // Form details
  const [form, setForm] = useState({
    full_name: user?.name || user?.first_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : '',
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

  // Fetch delivery zone for the selected state dynamically (identical to CartPage)
  useEffect(() => {
    if (!activeSlug || !selectedState) return

    setDeliveryLoading(true)
    shopAPI.deliveryZoneForState(activeSlug, selectedState)
      .then(data => {
        const zones = Array.isArray(data) ? data : (data?.results || [])
        const activeZone = zones.find(z => z.is_active !== false)
        if (activeZone && activeZone.fee !== null && activeZone.fee !== undefined) {
          const rawFee = parseFloat(activeZone.fee)
          // 15% logistics markup matching backend shops.logistics
          const markup = Math.round(rawFee * 0.15)
          setDeliveryFee(rawFee + markup)
          setDeliveryAvailable(true)
        } else {
          // If no zones configured in database at all, free delivery (0)
          if (zones.length === 0 && !data?.count) {
            setDeliveryFee(0)
            setDeliveryAvailable(true)
          } else {
            setDeliveryFee(null)
            setDeliveryAvailable(false)
          }
        }
      })
      .catch(() => {
        setDeliveryFee(null)
        setDeliveryAvailable(false)
      })
      .finally(() => setDeliveryLoading(false))
  }, [activeSlug, selectedState])

  // Load bank accounts if bank transfer is selected
  useEffect(() => {
    if (form.provider === 'bank_transfer' && bankAccounts.length === 0) {
      orderAPI.bankTransferAccounts()
        .then(d => setBankAccounts(d.accounts || []))
        .catch(() => {})
    }
  }, [form.provider])

  // Financial calculations
  const effectiveDeliveryFee = manualDeliverySelected ? 0 : (deliveryFee || 0)
  const discount = Number(couponDiscount || 0)
  const netSubtotal = Math.max(0, subtotal - discount)
  const vat = Math.round(netSubtotal * 0.075)
  const grandTotal = netSubtotal + effectiveDeliveryFee + vat

  const canSubmit = deliveryAvailable || manualDeliverySelected || shop?.allow_manual_delivery

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleApplyCoupon = async (e) => {
    e?.preventDefault()
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await couponAPI.apply({
        code: couponCode.trim(),
        shop_slug: activeSlug,
        subtotal: subtotal,
      })
      const disc = Number(res.discount_amount || 0)
      setCouponDiscount(disc)
      setCouponApplied(res.code || couponCode.trim())
    } catch (err) {
      const errorMsg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : typeof err.response?.data?.error?.detail === 'string'
        ? err.response.data.error.detail
        : typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : typeof err.response?.data?.message === 'string'
        ? err.response.data.message
        : 'Invalid or expired coupon code.'
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
      setError('Please provide your full name, phone number, and delivery address.')
      return
    }

    if (!deliveryAvailable && !manualDeliverySelected) {
      setError(`Delivery to ${NIGERIAN_STATES.find(s => s.value === selectedState)?.label || selectedState} is currently not available for this shop. Please choose another state or select manual delivery.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const idempotencyKey = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : '123e4567-e89b-12d3-a456-' + Date.now()

      const stateLabel = NIGERIAN_STATES.find(s => s.value === selectedState)?.label || selectedState

      const result = await orderAPI.checkout({
        ...form,
        phone: form.phone_number,
        line1: form.shipping_address,
        city: stateLabel,
        state: selectedState,
        country: 'NG',
        delivery_state: selectedState,
        manual_delivery_shops: manualDeliverySelected ? [activeSlug] : [],
        bank_index: selectedBankIndex,
        coupon_code: couponApplied || undefined,
        idempotency_key: idempotencyKey,
        shop_slug: activeSlug,
      })

      const amountToPay = Number(result.payment?.amount || result.order?.grand_total || grandTotal)

      // Handle Moniepoint (Monnify) popup
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
            isTestMode: (monnifyData.apiKey || import.meta.env.VITE_MONNIFY_API_KEY || '').startsWith('MK_TEST'),
            onComplete: function(response) {
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

      // Handle Paystack popup
      if (result.payment && (result.payment.provider === 'paystack' || form.provider === 'paystack')) {
        const paystackData = result.payment || {}
        const reference = paystackData.payment_reference || paystackData.reference

        if (window.PaystackPop) {
          const handler = window.PaystackPop.setup({
            key: paystackData.public_key || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
            email: form.email || user?.email,
            amount: Math.round(amountToPay * 100),
            currency: 'NGN',
            ref: reference,
            callback: function(response) {
              setLoading(true)
              orderAPI.verifyPaystack(response.reference)
                .then(() => {
                  clearCart && clearCart()
                  const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
                  const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
                  setOrderComplete({ ...orderData, reference: response.reference, delivery_code: deliveryCode })
                })
                .finally(() => setLoading(false))
            },
            onClose: function() {
              setError('Paystack payment cancelled.')
              setLoading(false)
            }
          })
          handler.openIframe()
          return
        }
      }

      // Bank transfer or fallback
      clearCart && clearCart()
      const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
      const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setOrderComplete({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      console.error('Checkout failed:', err)
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Completed order view
  if (orderComplete) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
          <span className="text-6xl block">🎉</span>
          <h2 className="text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h2>
          <p className="text-gray-600">Thank you for ordering directly from <strong>{shop?.name || 'our shop'}</strong>.</p>

          {orderComplete.delivery_code && (
            <div className="p-6 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1">Delivery Confirmation Code</span>
              <div className="text-4xl font-black text-gray-900 font-mono tracking-widest">{orderComplete.delivery_code}</div>
              <p className="text-xs text-amber-700 mt-2">Give this 6-digit code to the delivery rider once your package arrives safely.</p>
            </div>
          )}

          <button onClick={() => navigate(baseSlug ? `/shop/${baseSlug}` : '/')} className="w-full py-3.5 px-6 rounded-xl bg-gray-900 text-white font-bold text-base hover:bg-black transition-all">
            Back to Storefront
          </button>
        </motion.div>
      </div>
    )
  }

  // Empty cart view
  if (cartList.length === 0) {
    return (
      <div className="py-24 px-4 max-w-md mx-auto text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">Add items from the store before checking out.</p>
        <button onClick={() => navigate(baseSlug ? `/shop/${baseSlug}` : '/')} className="px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all">
          Browse Store
        </button>
      </div>
    )
  }

  return (
    <div className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout</h1>
      <p className="text-gray-600 mb-8">Complete your shipping & payment details below to place your order with {shop?.name || 'us'}.</p>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Details */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          {/* 1. Contact & Shipping */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📍</span> 1. Delivery & Contact Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
              <input required type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Chukwuma Adebayo" className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number *</label>
                <input required type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="08012345678" className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delivery State *</label>
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-semibold focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
                  {NIGERIAN_STATES.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delivery Street Address *</label>
              <textarea required rows={2} name="shipping_address" value={form.shipping_address} onChange={handleChange} placeholder="House/Flat number, Street name, Landmark, City" className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
            </div>

            {/* Delivery availability indicator */}
            <div className="pt-2">
              {deliveryLoading ? (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  Checking delivery fee for {NIGERIAN_STATES.find(s => s.value === selectedState)?.label}...
                </div>
              ) : !deliveryAvailable ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                  <p className="font-semibold">⚠️ Delivery to {NIGERIAN_STATES.find(s => s.value === selectedState)?.label} is not configured by this shop.</p>
                  {shop?.allow_manual_delivery ? (
                    <label className="flex items-center gap-2 cursor-pointer pt-1 font-bold text-gray-900">
                      <input type="checkbox" checked={manualDeliverySelected} onChange={e => setManualDeliverySelected(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                      Arrange direct delivery with seller (Manual delivery)
                    </label>
                  ) : (
                    <p className="text-gray-600">Please select another delivery state that the vendor ships to.</p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span>✓</span> Direct delivery available to {NIGERIAN_STATES.find(s => s.value === selectedState)?.label}
                </div>
              )}
            </div>
          </div>

          {/* 2. Coupon & Promo Code */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span>🎟️</span> Have a Coupon / Promo Code?
            </h3>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER COUPON CODE" className="flex-1 p-3 rounded-xl border border-gray-300 text-gray-900 font-bold uppercase focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-5 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm disabled:opacity-50 hover:bg-black transition-all">
                {couponLoading ? 'Applying…' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-600 font-medium">{couponError}</p>}
            {couponApplied && <p className="text-xs text-emerald-700 font-bold">✓ Coupon "{couponApplied}" applied! Saved ₦{discount.toLocaleString()}</p>}
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>💳</span> 3. Payment Method
            </h3>

            <div className="space-y-3">
              {gatewaySettings.monnify_enabled !== false && (
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.provider === 'monnify' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="provider" value="monnify" checked={form.provider === 'monnify'} onChange={handleChange} className="text-primary-600 focus:ring-primary-500" />
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">Moniepoint (Monnify)</span>
                      <span className="text-xs text-gray-500">Pay via Bank Transfer, USSD, or Card</span>
                    </div>
                  </div>
                  <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Instant</span>
                </label>
              )}

              {gatewaySettings.paystack_enabled !== false && (
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.provider === 'paystack' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="provider" value="paystack" checked={form.provider === 'paystack'} onChange={handleChange} className="text-primary-600 focus:ring-primary-500" />
                    <div>
                      <span className="font-bold text-gray-900 block text-sm">Paystack</span>
                      <span className="text-xs text-gray-500">Debit Card, Apple Pay, Bank</span>
                    </div>
                  </div>
                  <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Cards / Transfer</span>
                </label>
              )}

              <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.provider === 'bank_transfer' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="provider" value="bank_transfer" checked={form.provider === 'bank_transfer'} onChange={handleChange} className="text-primary-600 focus:ring-primary-500" />
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">Direct Bank Transfer</span>
                    <span className="text-xs text-gray-500">Manual transfer to marketplace settlement account</span>
                  </div>
                </div>
                <span className="text-xs font-black uppercase text-gray-600 bg-gray-100 px-2 py-1 rounded-md">Manual</span>
              </label>
            </div>

            {/* Bank account selection if direct bank transfer is picked */}
            {form.provider === 'bank_transfer' && bankAccounts.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase">Select Destination Bank Account:</span>
                <div className="space-y-2">
                  {bankAccounts.map((acc, idx) => (
                    <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${selectedBankIndex === idx ? 'border-primary-600 bg-white shadow-sm' : 'border-gray-200 bg-white/70'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="bank_account" checked={selectedBankIndex === idx} onChange={() => setSelectedBankIndex(idx)} />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{acc.bank_name}</p>
                          <p className="text-xs text-gray-600 font-mono">{acc.account_number} • {acc.account_name}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || !canSubmit} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-extrabold text-base shadow-xl shadow-primary-500/25 disabled:opacity-50 hover:opacity-95 transition-all">
            {loading ? 'Processing Order…' : `Pay ₦${grandTotal.toLocaleString()} & Complete Order`}
          </button>
        </form>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-sm space-y-6 sticky top-28">
          <h3 className="text-lg font-bold text-gray-900 flex items-center justify-between border-b border-gray-100 pb-4">
            <span>Order Summary</span>
            <span className="text-xs font-semibold text-gray-500">{cartList.length} item(s)</span>
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cartList.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-gray-900">{item.name || item.product?.name || 'Product'}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ₦{(Number(item.unit_price || item.base_price || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({couponApplied})</span>
                <span>-₦{discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Delivery ({NIGERIAN_STATES.find(s => s.value === selectedState)?.label || selectedState})</span>
              <span className="font-medium">
                {deliveryLoading ? 'Calculating…' : (manualDeliverySelected ? 'Manual (Arrange with seller)' : (effectiveDeliveryFee > 0 ? `₦${effectiveDeliveryFee.toLocaleString()}` : (deliveryAvailable ? 'Free' : 'Unavailable')))}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>VAT (7.5%)</span>
              <span className="font-medium">₦{vat.toLocaleString()}</span>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-black text-gray-900">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

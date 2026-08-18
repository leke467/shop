import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { useUser } from '../../../context/UserContext'
import { orderAPI, payoutAPI } from '../../../services/api'
import HSPageTransition from '../components/HSPageTransition'

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Rivers', 'Ogun', 'Oyo', 'Anambra', 'Enugu', 'Delta',
  'Edo', 'Kano', 'Kaduna', 'Abia', 'Akwa Ibom', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Ebonyi', 'Ekiti', 'Gombe', 'Imo', 'Jigawa', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Osun', 'Plateau', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
]

export default function HSCheckout({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart = [], items = [], total: ctxTotal = 0, refreshCart, clearCart } = useCart() || {}
  const { user } = useUser() || {}

  const cartList = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(items) ? items : []))
  const total = ctxTotal || cartList.reduce((sum, item) => sum + Number(item.unit_price || item.base_price || item.price || 0) * (item.quantity || 1), 0)
  const [selectedState, setSelectedState] = useState('Lagos')
  const [bankAccounts, setBankAccounts] = useState([])
  const [selectedBankIndex, setSelectedBankIndex] = useState(0)

  const [form, setForm] = useState({
    full_name: user?.name || user?.first_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    shipping_address: '',
    notes: '',
    provider: 'paystack', // 'paystack' or 'bank_transfer'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderComplete, setOrderComplete] = useState(null)

  useEffect(() => {
    if (shop?.slug) {
      const getBanks = payoutAPI.listBanks || payoutAPI.bankAccounts
      if (typeof getBanks === 'function') {
        getBanks(shop.slug)
          .then(res => setBankAccounts(res || []))
          .catch(() => setBankAccounts([]))
      }
    }
  }, [shop])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
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
        bank_index: selectedBankIndex,
        idempotency_key: idempotencyKey,
        shop_slug: shop?.slug || shopSlug,
      })

      // Handle Moniepoint (Monnify) inline popup flow
      if (result.payment && (result.payment.provider === 'monnify' || form.provider === 'monnify')) {
        const monnifyData = result.payment || {}
        const reference = monnifyData.payment_reference || monnifyData.reference

        if (window.MonnifySDK) {
          window.MonnifySDK.initialize({
            amount: total,
            currency: 'NGN',
            customerName: form.full_name || user?.email || 'Customer',
            customerEmail: form.email || user?.email,
            paymentReference: reference,
            paymentDescription: `Order ${result.order?.public_id || ''}`,
            contractCode: monnifyData.contractCode || '286935449446',
            apiKey: monnifyData.apiKey || import.meta.env.VITE_MONNIFY_API_KEY || '',
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

      // Handle Paystack inline popup
      if (result.payment && result.payment.provider === 'paystack') {
        const paystackData = result.payment
        const accessCode = paystackData.access_code
        const reference = paystackData.reference

        if (window.PaystackPop && (accessCode || reference)) {
          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
            email: form.email || user?.email,
            amount: Math.round(total * 100),
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
                setError('Payment placed. Verifying with bank...')
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

      // Handle PayPal or external checkout URL
      if (form.provider === 'paypal' && (result.payment?.checkout_url || result.checkout_url)) {
        window.location.href = result.payment?.checkout_url || result.checkout_url
        return
      }

      // Bank Transfer / Direct Order Complete
      clearCart && clearCart()
      const orderData = result.order || { public_id: result.order_id || 'SUCCESS' }
      const deliveryCode = result.delivery_code || result.order?.delivery_code || result.order_codes?.[0]?.delivery_code || orderData.delivery_code
      setOrderComplete({ ...orderData, delivery_code: deliveryCode })
    } catch (err) {
      console.error('Checkout failed:', err)
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const baseSlug = shopSlug || shop?.slug || ''
  const shopHomeUrl = baseSlug ? `/shop/${baseSlug}` : '/'

  if (orderComplete) {
    return (
      <HSPageTransition>
        <main className="hs-menu-page" style={{ padding: '6rem 1rem' }}>
          <div className="hs-container" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="hs-menu-item" style={{ padding: '3rem 2rem' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--hs-color-text, #2B1F0C)', marginBottom: '0.5rem' }}>Order Placed Successfully!</h2>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>Thank you for ordering from <strong>{shop?.name || 'our shop'}</strong>!</p>

              {orderComplete.delivery_code && (
                <div style={{ background: '#FFF8E7', border: '2px dashed #E5A43B', borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B47B1C', textTransform: 'uppercase', letterSpacing: 1 }}>Delivery Confirmation Code</span>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2B1F0C', letterSpacing: 4, marginTop: '0.25rem' }}>
                    {orderComplete.delivery_code}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#8A5D11', marginTop: '0.5rem' }}>Give this 6-digit code to the dispatch rider upon delivery to confirm release.</p>
                </div>
              )}

              <button className="hs-btn hs-btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }} onClick={() => navigate(shopHomeUrl)}>
                Back to Storefront
              </button>
            </motion.div>
          </div>
        </main>
      </HSPageTransition>
    )
  }

  if (cartList.length === 0) {
    return (
      <HSPageTransition>
        <main className="hs-menu-page" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <div className="hs-container" style={{ maxWidth: 500, margin: '0 auto' }}>
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Your Cart is Empty</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Add some items to your order before checking out.</p>
            <button className="hs-btn hs-btn-primary" onClick={() => navigate(baseSlug ? `/shop/${baseSlug}/menu` : '/menu')}>
              Browse Menu
            </button>
          </div>
        </main>
      </HSPageTransition>
    )
  }

  return (
    <HSPageTransition>
      <main className="hs-menu-page" style={{ paddingTop: '7.5rem', paddingBottom: '5rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
        <div className="hs-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--hs-color-text, #2B1F0C)' }}>Checkout</h1>
          <p style={{ color: '#666', marginBottom: '2.5rem' }}>Complete your details below to place your order directly with {shop?.name || 'us'}.</p>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem 1.25rem', borderRadius: 16, marginBottom: '2rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            {/* Form Column */}
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="hs-menu-item" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📍</span> Delivery Details
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151', marginBottom: '0.35rem' }}>Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Chukwuma Adebayo"
                      style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#111827', outline: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151', marginBottom: '0.35rem' }}>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={form.phone_number}
                        onChange={handleChange}
                        required
                        placeholder="08012345678"
                        style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#111827', outline: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151', marginBottom: '0.35rem' }}>State *</label>
                      <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#111827', outline: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {NIGERIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#374151', marginBottom: '0.35rem' }}>Delivery Address *</label>
                    <textarea
                      name="shipping_address"
                      value={form.shipping_address}
                      onChange={handleChange}
                      required
                      rows={2}
                      placeholder="Enter house/office street address"
                      style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#111827', outline: 'none', fontSize: '0.95rem', fontWeight: 600, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="hs-menu-item" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💳</span> Payment Method
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 12, border: form.provider === 'monnify' ? '2px solid var(--hs-color-honey, #E5A43B)' : '1px solid #E2E8F0', cursor: 'pointer', background: form.provider === 'monnify' ? '#FFFDF9' : '#fff' }}>
                    <input
                      type="radio"
                      name="provider"
                      value="monnify"
                      checked={form.provider === 'monnify'}
                      onChange={handleChange}
                    />
                    <div>
                      <span style={{ fontWeight: 700, display: 'block', fontSize: '0.95rem' }}>⚡ Moniepoint / Monnify</span>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>Instant Bank Transfer, Account Numbers & Cards</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: 12, border: form.provider === 'paystack' ? '2px solid var(--hs-color-honey, #E5A43B)' : '1px solid #E2E8F0', cursor: 'pointer', background: form.provider === 'paystack' ? '#FFFDF9' : '#fff' }}>
                    <input
                      type="radio"
                      name="provider"
                      value="paystack"
                      checked={form.provider === 'paystack'}
                      onChange={handleChange}
                    />
                    <div>
                      <span style={{ fontWeight: 700, display: 'block', fontSize: '0.95rem' }}>💳 Paystack (Cards / USSD / Transfer)</span>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>Instant & secure Paystack checkout</span>
                    </div>
                  </label>
                </div>

                {form.provider === 'bank_transfer' && bankAccounts.length > 0 && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Seller Bank Account:</span>
                    <div style={{ marginTop: '0.5rem', fontWeight: 700, color: '#0F172A' }}>
                      {bankAccounts[0].bank_name} — {bankAccounts[0].account_number}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Account Name: {bankAccounts[0].account_name}</div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hs-btn hs-btn-primary"
                style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Processing Order...' : `Place Order (₦${Number(total).toLocaleString()})`}
              </button>
            </form>

            {/* Order Summary Column */}
            <div className="hs-menu-item" style={{ padding: '1.75rem', position: 'sticky', top: 100 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid #EEE', paddingBottom: '0.75rem' }}>
                Order Summary ({cartList.length} items)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                {cartList.map(item => (
                  <div key={item.id || item.public_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2B1F0C' }}>{item.product_name || item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {item.quantity || 1}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2B1F0C' }}>
                      ₦{Number((item.unit_price || item.base_price || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #EEE', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                  <span>Subtotal</span>
                  <span>₦{Number(total).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                  <span>Delivery Fee</span>
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>Calculated by Seller</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#2B1F0C', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px dashed #E2E8F0' }}>
                  <span>Total</span>
                  <span>₦{Number(total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </HSPageTransition>
  )
}

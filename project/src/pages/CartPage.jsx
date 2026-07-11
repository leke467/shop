import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { orderAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'

function generateIdempotencyKey() {
  // Simple UUID-like key
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export default function CartPage() {
  const { isAuthenticated } = useUser()
  const { refreshCart } = useCart()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutForm, setCheckoutForm] = useState({
    provider: 'stripe',
    full_name: '', phone: '', email: '',
    line1: '', line2: '', city: '', state: '', postal_code: '', country: '',
  })

  const loadCart = () => {
    setLoading(true)
    orderAPI.cart()
      .then(data => setItems(data?.items || data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAuthenticated) loadCart()
    else setLoading(false)
  }, [isAuthenticated])

  const updateQty = async (itemId, qty) => {
    if (qty < 1) return removeItem(itemId)
    setUpdating(itemId)
    try {
      await orderAPI.updateCartItem(itemId, { quantity: qty })
      setItems(prev => prev.map(i => (i.id === itemId || i.public_id === itemId) ? { ...i, quantity: qty } : i))
      if (refreshCart) refreshCart()
    } catch { } finally { setUpdating(null) }
  }

  const removeItem = async (itemId) => {
    setUpdating(itemId)
    try {
      await orderAPI.removeCartItem(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId && i.public_id !== itemId))
      if (refreshCart) refreshCart()
    } catch { } finally { setUpdating(null) }
  }

  const subtotal = items.reduce((sum, i) => sum + (Number(i.unit_price || 0) * i.quantity), 0)

  const handleCheckout = async (e) => {
    e.preventDefault()
    setCheckoutError('')
    setCheckoutLoading(true)
    try {
      const result = await orderAPI.checkout({
        ...checkoutForm,
        idempotency_key: generateIdempotencyKey(),
      })
      if (refreshCart) refreshCart()
      navigate('/', { state: { orderSuccess: true, orderId: result.order?.public_id } })
    } catch (err) {
      setCheckoutError(err.response?.data?.detail || 'Checkout failed. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900">Sign in to view your cart</h2>
          <Link to="/login" className="mt-6 inline-block px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold">Sign in</Link>
        </div>
      </div>
    )
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
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-white rounded-2xl p-5 border border-gray-100 flex gap-5 transition-opacity ${updating === (item.id || item.public_id) ? 'opacity-60' : ''}`}
                  >
                    {/* Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.variant?.product?.images?.[0] ? (
                        <img src={getImageUrl(item.variant.product.images[0].thumbnail || item.variant.product.images[0].image)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.variant?.product?.name || item.product_name || 'Product'}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{item.variant?.name || ''}</p>
                      <p className="font-bold text-gray-900 mt-2">${Number(item.unit_price || 0).toFixed(2)}</p>
                    </div>

                    {/* Quantity + remove */}
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(item.id || item.public_id)} className="text-gray-400 hover:text-error-500 transition-colors p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQty(item.id || item.public_id, item.quantity - 1)} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold">−</button>
                        <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id || item.public_id, item.quantity + 1)} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold">+</button>
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
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal ({items.length} items)</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-success-600 font-medium">Free</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-base"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span></div>
                </div>

                {!showCheckout ? (
                  <motion.button
                    onClick={() => setShowCheckout(true)}
                    className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed to Checkout
                  </motion.button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleCheckout}
                    className="mt-6 space-y-4"
                  >
                    <h4 className="font-semibold text-gray-900">Shipping Details</h4>
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
                      { name: 'state', label: 'State' },
                      { name: 'postal_code', label: 'Postal Code', required: true },
                      { name: 'country', label: 'Country (2-letter)', required: true, maxLength: 2 },
                    ].map(f => (
                      <input
                        key={f.name}
                        placeholder={f.label}
                        type={f.type || 'text'}
                        required={f.required}
                        maxLength={f.maxLength}
                        value={checkoutForm[f.name]}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                      />
                    ))}

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
                      {checkoutLoading ? 'Processing…' : `Pay $${subtotal.toFixed(2)}`}
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
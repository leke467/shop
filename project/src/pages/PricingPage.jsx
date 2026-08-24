import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { subscriptionAPI, paymentSettingsAPI } from '../services/api'
import { useUser } from '../context/UserContext'

const FEATURE_ROWS = [
  { key: 'custom_shop_template_enabled', label: 'Custom Shop Templates (20+ Themes)' },
  { key: 'custom_shop_theme_enabled', label: 'Custom Shop Theme & Colors' },
  { key: 'custom_domain_enabled', label: 'Custom Shop Domain' },
  { key: 'analytics_enabled', label: 'Analytics' },
  { key: 'priority_support_enabled', label: 'Priority Support' },
]

const fmtLimit = (v, noun) => (v == null ? `Unlimited ${noun}` : `${v} ${noun}`)

const fmtPrice = (plan) => {
  if (plan.is_enterprise) return 'Custom'
  const n = Number(plan.monthly_price || 0)
  return n === 0 ? 'Free' : `₦${n.toLocaleString()}`
}

export default function PricingPage() {
  const { isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightCode = searchParams.get('plan')
  const initialCoupon = searchParams.get('coupon') || ''

  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null) // plan code being processed
  const [error, setError] = useState('')
  const [downgradeBlockers, setDowngradeBlockers] = useState(null)
  const [gatewaySettings, setGatewaySettings] = useState({ paystack_enabled: true, monnify_enabled: true })

  // Coupon state
  const [couponInput, setCouponInput] = useState(initialCoupon)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    const calls = [
      subscriptionAPI.plans(),
      paymentSettingsAPI.getSettings().catch(() => ({ paystack_enabled: true, monnify_enabled: true })),
    ]
    if (isAuthenticated) calls.push(subscriptionAPI.current().catch(() => null))
    Promise.all(calls)
      .then(([plansData, gateData, currentData]) => {
        const loadedPlans = Array.isArray(plansData) ? plansData : (plansData?.results || [])
        setPlans(loadedPlans)
        if (gateData) setGatewaySettings(gateData)
        if (currentData) setCurrent(currentData)

        // Auto-validate initial coupon from URL query param
        if (initialCoupon && loadedPlans.length > 0) {
          handleValidateCoupon(initialCoupon, loadedPlans[1]?.code || loadedPlans[0]?.code)
        }
      })
      .catch(() => setError('Could not load plans. Please try again.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, initialCoupon])

  const handleValidateCoupon = async (codeToTest, targetPlanCode) => {
    const clean = (codeToTest || couponInput || '').trim().toUpperCase()
    if (!clean) return
    setCouponLoading(true)
    setCouponMessage('')
    setError('')
    try {
      const planCodeToUse = targetPlanCode || (plans.find(p => !p.is_free)?.code) || (plans[0]?.code) || 'growth'
      const res = await subscriptionAPI.validateCoupon({
        code: clean,
        coupon_code: clean,
        plan_code: planCodeToUse,
      })
      setAppliedCoupon(res)
      setCouponMessage(`🎉 Coupon '${res.code}' applied! ${res.is_100_percent_free ? '100% Free' : `₦${Number(res.discount_applied).toLocaleString()} Discount`} for ${res.duration_months} month(s).`)
    } catch (err) {
      setAppliedCoupon(null)
      const msg = err.response?.data?.detail || 'Invalid or expired coupon code.'
      setCouponMessage(`❌ ${msg}`)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponMessage('')
  }

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null)

  const handleUpgrade = async (plan, provider = '') => {
    setError('')
    if (!isAuthenticated) {
      navigate(`/login?redirect=/pricing${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ''}`)
      return
    }
    if (plan.is_enterprise) {
      window.location.href = 'mailto:sales@multishopng.com?subject=Enterprise%20Plan%20Enquiry'
      return
    }

    const isFreeWithCoupon = appliedCoupon && (appliedCoupon.is_100_percent_free || Number(appliedCoupon.final_price) <= 0)

    // If it's a paid plan and no provider is selected yet (and not 100% free with coupon), prompt for provider choice
    if (!plan.is_free && Number(plan.monthly_price) > 0 && !isFreeWithCoupon && !provider) {
      setSelectedPlanForPayment(plan)
      return
    }

    setSelectedPlanForPayment(null)
    setUpgrading(plan.code)
    try {
      const res = await subscriptionAPI.upgrade({
        plan_code: plan.code,
        callback_url: `${window.location.origin}/subscription`,
        provider: provider,
        coupon_code: appliedCoupon?.code || '',
      })
      if (res.free || res.coupon_applied) {
        navigate('/subscription')
      } else if (res.authorization_url || res.checkout_url) {
        window.location.href = res.authorization_url || res.checkout_url
      } else {
        navigate('/subscription')
      }
    } catch (err) {
      const errData = err?.response?.data?.error || err?.response?.data
      if (errData?.type === 'DowngradeBlocked') {
        setDowngradeBlockers(errData.blockers || [])
      } else {
        setError(errData?.detail || 'Could not start upgrade. Please try again.')
      }
    } finally {
      setUpgrading(null)
    }
  }

  const currentPlanCode = current?.plan?.code

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="text-gray-500 mt-3">
            Choose the plan that fits your business. Upgrade or downgrade anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 px-4 py-3 rounded-xl bg-error-50 border border-error-100 text-error-700 text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-96 bg-white rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map(plan => {
              const isCurrent = plan.code === currentPlanCode
              const isHighlighted = plan.code === highlightCode
              const planPriceNum = Number(plan.monthly_price || 0)
              const isCouponApplicable = appliedCoupon && (!appliedCoupon.plan_code || appliedCoupon.plan_code === plan.code)
              const isFreeWithCoupon = isCouponApplicable && (appliedCoupon.is_100_percent_free || Number(appliedCoupon.final_price) <= 0)
              const discountedPrice = isCouponApplicable
                ? isFreeWithCoupon
                  ? 0
                  : Math.max(0, planPriceNum - Number(appliedCoupon.discount_applied || 0))
                : planPriceNum

              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-white rounded-3xl border p-6 flex flex-col ${
                    isHighlighted || isCouponApplicable
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  {(isHighlighted || isCouponApplicable) && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow">
                      {isCouponApplicable ? `🎟️ ${appliedCoupon.code} Eligible` : 'Recommended'}
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>
                  )}

                  <div className="mt-4 mb-5">
                    {isCouponApplicable && planPriceNum > 0 ? (
                      <div>
                        <span className="text-gray-400 line-through text-lg mr-2">₦{planPriceNum.toLocaleString()}</span>
                        <span className="text-3xl font-extrabold text-emerald-600">
                          {discountedPrice === 0 ? 'Free' : `₦${discountedPrice.toLocaleString()}`}
                        </span>
                        <span className="block text-xs font-bold text-emerald-700 mt-0.5">
                          {appliedCoupon.is_100_percent_free ? `100% Free for ${appliedCoupon.duration_months} mo` : `Save ₦${Number(appliedCoupon.discount_applied).toLocaleString()}`}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-gray-900">{fmtPrice(plan)}</span>
                        {!plan.is_enterprise && Number(plan.monthly_price) > 0 && (
                          <span className="text-sm text-gray-400 font-medium">/month</span>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-sm text-gray-600 flex-1">
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">🏪</span>
                      {fmtLimit(plan.max_shops, 'shops')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">📦</span>
                      {fmtLimit(plan.max_products, 'products')}
                    </li>
                    {FEATURE_ROWS.map(f => (
                      <li
                        key={f.key}
                        className={`flex items-center gap-2 ${plan[f.key] ? '' : 'text-gray-300 line-through'}`}
                      >
                        <span>{plan[f.key] ? '✅' : '—'}</span>
                        {f.label}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || upgrading === plan.code}
                    className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : isFreeWithCoupon
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
                          : isHighlighted
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : upgrading === plan.code
                        ? 'Processing…'
                        : isFreeWithCoupon
                          ? `🎉 Activate Free ${plan.name}`
                          : plan.is_enterprise
                            ? 'Contact Sales'
                            : Number(plan.monthly_price) === 0
                              ? 'Switch to Free'
                              : isCouponApplicable
                                ? `Upgrade for ₦${discountedPrice.toLocaleString()}`
                                : `Upgrade to ${plan.name}`}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {downgradeBlockers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setDowngradeBlockers(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center text-2xl mb-5 mx-auto">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Downgrade Blocked</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                You need to clean up some resources before switching to this plan.
              </p>
              
              <div className="space-y-3 mb-8">
                {downgradeBlockers.map((b, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3 text-sm">
                    <span className="text-xl mt-0.5">{b.type === 'shops' ? '🏪' : '📦'}</span>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{b.type} Limit Exceeded</p>
                      <p className="text-gray-500 mt-0.5">
                        You have {b.used}, but this plan only allows {b.limit}. Please delete {b.excess} {b.type}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDowngradeBlockers(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20"
                >
                  Manage Resources
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Gateway Provider & Coupon Checkout Modal */}
      <AnimatePresence>
        {selectedPlanForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setSelectedPlanForPayment(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Subscribe to {selectedPlanForPayment.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Choose your payment method or apply a coupon code.</p>
                </div>
                <button
                  onClick={() => setSelectedPlanForPayment(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* In-Modal Promo / Coupon Input Section */}
              <div className="bg-emerald-50/50 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span>🎟️</span> Have a Coupon or Promo Code?
                  </span>
                  {appliedCoupon && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. VIP-GROWTH)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    disabled={Boolean(appliedCoupon)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100"
                  />
                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => handleValidateCoupon(couponInput, selectedPlanForPayment.code)}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow active:scale-95 disabled:opacity-50"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  ) : (
                    <span className="px-3 py-2 bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center">
                      ✓ Valid
                    </span>
                  )}
                </div>

                {couponMessage && (
                  <p className={`text-xs font-medium ${appliedCoupon ? 'text-emerald-700' : 'text-red-600'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Price Calculation Summary */}
              {(() => {
                const origPrice = Number(selectedPlanForPayment.monthly_price || 0)
                const isApplicable = appliedCoupon && (!appliedCoupon.plan_code || appliedCoupon.plan_code === selectedPlanForPayment.code)
                const is100Free = isApplicable && (appliedCoupon.is_100_percent_free || Number(appliedCoupon.final_price) <= 0)
                const finalDue = isApplicable
                  ? is100Free ? 0 : Math.max(0, origPrice - Number(appliedCoupon.discount_applied || 0))
                  : origPrice

                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>{selectedPlanForPayment.name} Monthly Plan</span>
                        <span>₦{origPrice.toLocaleString()}</span>
                      </div>
                      {isApplicable && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Coupon Discount ({appliedCoupon.code})</span>
                          <span>-₦{is100Free ? origPrice.toLocaleString() : Number(appliedCoupon.discount_applied).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                        <span>Total Due Now</span>
                        <span className={finalDue === 0 ? 'text-emerald-600 text-lg' : 'text-gray-900'}>
                          {finalDue === 0 ? '₦0.00 (Free Trial)' : `₦${finalDue.toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Action: Free Activation vs Gateway Selection */}
                    {finalDue === 0 ? (
                      <button
                        onClick={() => handleUpgrade(selectedPlanForPayment)}
                        disabled={upgrading === selectedPlanForPayment.code}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {upgrading === selectedPlanForPayment.code
                          ? 'Activating Free Plan…'
                          : `🎉 Activate ${selectedPlanForPayment.name} Free of Charge`}
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
                          Select Payment Provider
                        </p>
                        
                        {gatewaySettings.paystack_enabled !== false && (
                          <button
                            onClick={() => handleUpgrade(selectedPlanForPayment, 'paystack')}
                            disabled={upgrading === selectedPlanForPayment.code}
                            className="w-full p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
                                P
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 group-hover:text-emerald-600">Paystack</p>
                                <p className="text-xs text-gray-500">Debit Card, Bank Transfer, USSD</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">
                              Pay ₦{finalDue.toLocaleString()} →
                            </span>
                          </button>
                        )}

                        {gatewaySettings.monnify_enabled !== false && (
                          <button
                            onClick={() => handleUpgrade(selectedPlanForPayment, 'monnify')}
                            disabled={upgrading === selectedPlanForPayment.code}
                            className="w-full p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                M
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 group-hover:text-blue-600">Monnify (Moniepoint)</p>
                                <p className="text-xs text-gray-500">Instant Bank Transfer, Card, Account</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-blue-600">
                              Pay ₦{finalDue.toLocaleString()} →
                            </span>
                          </button>
                        )}

                        {gatewaySettings.paystack_enabled === false && gatewaySettings.monnify_enabled === false && (
                          <p className="text-xs text-center text-red-500 font-semibold py-2">
                            Online payment gateways are currently undergoing scheduled maintenance. Please check back shortly or contact support.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 text-xs transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

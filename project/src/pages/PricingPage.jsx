import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { subscriptionAPI } from '../services/api'
import { useUser } from '../context/UserContext'

const FEATURE_ROWS = [
  { key: 'custom_domain_enabled', label: 'Custom Domain' },
  { key: 'analytics_enabled', label: 'Analytics' },
  { key: 'staff_accounts_enabled', label: 'Staff Accounts' },
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

  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null) // plan code being processed
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const calls = [subscriptionAPI.plans()]
    if (isAuthenticated) calls.push(subscriptionAPI.current().catch(() => null))
    Promise.all(calls)
      .then(([plansData, currentData]) => {
        setPlans(Array.isArray(plansData) ? plansData : (plansData?.results || []))
        if (currentData) setCurrent(currentData)
      })
      .catch(() => setError('Could not load plans. Please try again.'))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleUpgrade = async (plan) => {
    setError('')
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (plan.is_enterprise) {
      window.location.href = 'mailto:sales@marketplace.example?subject=Enterprise%20Plan%20Enquiry'
      return
    }
    setUpgrading(plan.code)
    try {
      const res = await subscriptionAPI.upgrade({
        plan_code: plan.code,
        callback_url: `${window.location.origin}/subscription`,
      })
      if (res.free) {
        // Switched to free immediately
        navigate('/subscription')
      } else if (res.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = res.authorization_url
      } else {
        navigate('/subscription')
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not start upgrade. Please try again.')
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
              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-white rounded-3xl border p-6 flex flex-col ${
                    isHighlighted
                      ? 'border-primary-400 ring-2 ring-primary-400/40 shadow-xl'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-bold shadow">
                      Recommended
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p>
                  )}

                  <div className="mt-4 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900">{fmtPrice(plan)}</span>
                    {!plan.is_enterprise && Number(plan.monthly_price) > 0 && (
                      <span className="text-sm text-gray-400 font-medium">/month</span>
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
                        : isHighlighted
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : upgrading === plan.code
                        ? 'Processing…'
                        : plan.is_enterprise
                          ? 'Contact Sales'
                          : Number(plan.monthly_price) === 0
                            ? 'Switch to Free'
                            : `Upgrade to ${plan.name}`}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

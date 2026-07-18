import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { subscriptionAPI } from '../services/api'
import { useUser } from '../context/UserContext'

const FEATURE_LABELS = {
  custom_domain_enabled: 'Custom Domain',
  analytics_enabled: 'Analytics',
  staff_accounts_enabled: 'Staff Accounts',
  priority_support_enabled: 'Priority Support',
}

const STATUS_STYLES = {
  active: 'bg-success-100 text-success-700',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-error-100 text-error-700',
}

function UsageBar({ label, used, limit, remaining }) {
  const unlimited = limit == null
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  const atLimit = !unlimited && used >= limit
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {used} {unlimited ? '' : `/ ${limit}`}
          {unlimited && <span className="text-primary-600 font-medium">Unlimited</span>}
        </span>
      </div>
      {!unlimited && (
        <>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? 'bg-error-500' : 'bg-primary-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-xs mt-1.5 ${atLimit ? 'text-error-600 font-medium' : 'text-gray-400'}`}>
            {atLimit ? 'Limit reached' : `${remaining} remaining`}
          </p>
        </>
      )}
    </div>
  )
}

export default function SubscriptionDashboard() {
  const { isAuthenticated, loading: userLoading } = useUser()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!isAuthenticated) { navigate('/login'); return }
    setLoading(true)
    Promise.all([
      subscriptionAPI.current(),
      subscriptionAPI.mine().catch(() => []),
    ])
      .then(([current, mine]) => {
        setData(current)
        setHistory(Array.isArray(mine) ? mine : (mine?.results || []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated, userLoading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-8" />
          <div className="h-40 bg-white rounded-3xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 bg-white rounded-2xl animate-pulse" />
            <div className="h-28 bg-white rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-2xl font-bold text-gray-900">No subscription info</h2>
          <Link to="/pricing" className="mt-6 inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg">
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  const { plan } = data
  const renewal = data.next_renewal_date
    ? new Date(data.next_renewal_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
            <p className="text-sm text-gray-500">Manage your plan and billing</p>
          </div>
          <Link to="/pricing" className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all">
            Change Plan
          </Link>
        </div>

        {/* Current plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-8 text-white mb-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Current Plan</p>
              <h2 className="text-3xl font-bold mt-1">{plan.name}</h2>
              <p className="text-white/80 mt-1">
                {plan.is_enterprise
                  ? 'Custom pricing'
                  : Number(plan.monthly_price) === 0
                    ? 'Free forever'
                    : `₦${Number(plan.monthly_price).toLocaleString()}/month`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[data.status] || 'bg-white/20 text-white'}`}>
              {data.status}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {renewal && (
              <div>
                <span className="text-white/60">Next renewal</span>
                <p className="font-semibold">{renewal}</p>
              </div>
            )}
            <div>
              <span className="text-white/60">Auto-renew</span>
              <p className="font-semibold">{data.auto_renew ? 'On' : 'Off'}</p>
            </div>
          </div>
        </motion.div>

        {/* Usage */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <UsageBar label="Shops" used={data.shops_used} limit={data.shops_limit} remaining={data.shops_remaining} />
          <UsageBar label="Products" used={data.products_used} limit={data.products_limit} remaining={data.products_remaining} />
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Plan Features</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => {
              const on = data.features?.[key]
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className={on ? 'text-success-600' : 'text-gray-300'}>{on ? '✅' : '—'}</span>
                  <span className={on ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Billing history */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">Billing History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Plan</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Started</th>
                  <th className="text-left px-6 py-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h => (
                  <tr key={h.public_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{h.plan?.name}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[h.status] || 'bg-gray-100 text-gray-500'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {h.start_date ? new Date(h.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{h.payment_reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

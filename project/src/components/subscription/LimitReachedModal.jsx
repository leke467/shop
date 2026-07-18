import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Modal shown when a user hits a plan limit (402 PAYMENT_REQUIRED) or is
 * missing a feature (403 FORBIDDEN). It reads the structured error payload
 * produced by the backend's api_exception_handler:
 *
 *   {
 *     "error": {
 *       "type": "LimitReached" | "FeatureNotAvailable",
 *       "detail": "You have reached your Starter plan limit of 50 products...",
 *       "limit_type": "shops" | "products",
 *       "limit": 50,
 *       "current": 50,
 *       "recommended_plan": { "code": "growth", "name": "Growth", ... }
 *     }
 *   }
 *
 * Pass the parsed `error.response.data.error` object as the `info` prop.
 */
export default function LimitReachedModal({ info, onClose }) {
  const navigate = useNavigate()

  if (!info) return null

  const recommended = info.recommended_plan
  const detail = info.detail || 'You have reached a limit on your current plan.'

  const goToPricing = () => {
    onClose?.()
    navigate(recommended ? `/pricing?plan=${recommended.code}` : '/pricing')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-secondary-600 px-6 py-7 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-3">
              🚀
            </div>
            <h3 className="text-xl font-bold text-white">Time to upgrade</h3>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-gray-700 text-center leading-relaxed">{detail}</p>

            {recommended && (
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Recommended plan
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-gray-900">{recommended.name}</span>
                  <span className="text-primary-600 font-bold">
                    {recommended.is_enterprise
                      ? 'Custom'
                      : `₦${Number(recommended.monthly_price || 0).toLocaleString()}/mo`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>
                    🏪 {recommended.max_shops == null ? 'Unlimited' : recommended.max_shops} shops
                  </span>
                  <span>
                    📦 {recommended.max_products == null ? 'Unlimited' : recommended.max_products} products
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Not now
              </button>
              <button
                onClick={goToPricing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
              >
                {recommended ? `Upgrade to ${recommended.name}` : 'View Plans'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Helper: extract the structured limit/feature error from an axios error.
 * Returns the `error` payload object if this was a limit/feature block,
 * otherwise null (so callers can fall through to generic handling).
 */
export function extractLimitError(err) {
  const status = err?.response?.status
  const payload = err?.response?.data?.error
  if ((status === 402 || status === 403) && payload &&
      (payload.type === 'LimitReached' || payload.type === 'FeatureNotAvailable')) {
    return payload
  }
  return null
}

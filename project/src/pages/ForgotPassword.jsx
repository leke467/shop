import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authAPI } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-500/30">M</div>
          <h2 className="text-3xl font-bold text-gray-900">{sent ? 'Check your email' : 'Reset password'}</h2>
          <p className="mt-2 text-gray-500">{sent ? `We sent a reset link to ${email}` : "Enter your email and we'll send you a reset link"}</p>
        </div>

        {!sent ? (
          <>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm">{error}</motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all" placeholder="you@example.com" />
              </div>
              <motion.button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/30 disabled:opacity-60 transition-all"
                whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </motion.button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <button onClick={() => { setSent(false); setEmail('') }} className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">
              Try a different email
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext'

export default function SignUpPage() {
  const { register } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'buyer',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 10) {
      setError('Password must be at least 10 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || data?.email?.[0] || data?.password?.[0] || 'Registration failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    { value: 'buyer', label: 'Shopper', desc: 'Browse and buy from amazing shops', icon: '🛍️' },
    { value: 'seller', label: 'Shop Owner', desc: 'Create your own shop and sell products', icon: '🏪' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-500/30">
              M
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
            <p className="mt-2 text-gray-500">Join thousands of buyers and sellers</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8 px-4">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 rounded transition-all duration-500 ${step > 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Role selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">I want to…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update('role', r.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          form.role === r.value
                            ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <h4 className="font-semibold text-gray-900 mt-2">{r.label}</h4>
                        <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First name</label>
                    <input
                      id="signup-first-name"
                      required
                      value={form.first_name}
                      onChange={e => update('first_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last name</label>
                    <input
                      id="signup-last-name"
                      required
                      value={form.last_name}
                      onChange={e => update('last_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.first_name || !form.last_name) {
                      setError('Please fill in your name')
                      return
                    }
                    setError('')
                    setStep(2)
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all duration-300"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={10}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                    placeholder="Min 10 characters"
                  />
                  {/* Strength bar */}
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        form.password.length >= i * 3
                          ? i <= 2 ? 'bg-warning-400' : 'bg-success-500'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                  <input
                    id="signup-password2"
                    type="password"
                    required
                    value={form.password2}
                    onChange={e => update('password2', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
                      form.password2 && form.password !== form.password2
                        ? 'border-error-300 focus:ring-error-500/40'
                        : 'border-gray-200 focus:ring-primary-500/40 focus:border-primary-500'
                    }`}
                    placeholder="••••••••••"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <motion.button
                    id="signup-submit"
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Creating account…' : 'Create account'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-bl from-accent-600 via-primary-600 to-secondary-700">
        <div className="absolute inset-0 bg-black/10" />
        <motion.div
          className="absolute top-32 right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-24 left-16 w-64 h-64 rounded-full bg-accent-300/20 blur-3xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Start your<br />
              <span className="bg-gradient-to-r from-accent-200 to-white bg-clip-text text-transparent">
                journey today
              </span>
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Whether you're here to discover unique products or build your own online empire — we've got you covered.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-12 grid grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {[
              { num: '10K+', label: 'Active Buyers' },
              { num: '500+', label: 'Unique Shops' },
              { num: '50K+', label: 'Products' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold">{s.num}</div>
                <div className="text-sm text-white/70 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
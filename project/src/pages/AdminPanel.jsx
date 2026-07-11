import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api, { shopAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'

function StatCard({ icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { isAdmin, isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [shops, setShops] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { navigate('/'); return }
    setLoading(true)
    Promise.allSettled([
      shopAPI.list({ page_size: 100 }),
      api.get('/users/admin/users/').then(r => r.data),
    ]).then(([shopRes, userRes]) => {
      if (shopRes.status === 'fulfilled') setShops(shopRes.value?.results || shopRes.value || [])
      if (userRes.status === 'fulfilled') setUsers(userRes.value?.results || userRes.value || [])
    }).finally(() => setLoading(false))
  }, [isAuthenticated, isAdmin, navigate])

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'shops', label: 'Shops', icon: '🏪' },
    { key: 'users', label: 'Users', icon: '👥' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-8" />
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>
        </div>
      </div>
    )
  }

  const stats = [
    { icon: '🏪', label: 'Total Shops', value: shops.length, gradient: 'from-primary-500 to-secondary-500' },
    { icon: '👥', label: 'Total Users', value: users.length, gradient: 'from-accent-500 to-primary-500' },
    { icon: '✅', label: 'Active Shops', value: shops.filter(s => s.status === 'active').length, gradient: 'from-success-500 to-success-600' },
    { icon: '🛒', label: 'Sellers', value: users.filter(u => u.role === 'seller').length, gradient: 'from-warning-400 to-warning-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white text-lg">⚡</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Platform management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Shops</h3>
                  <div className="space-y-3">
                    {shops.slice(0, 5).map(s => (
                      <div key={s.slug || s.public_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/shop/${s.slug}`)}>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                          {s.logo ? <img src={getImageUrl(s.logo)} className="w-full h-full object-cover" /> : s.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.owner_email || ''}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                        }`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((u, i) => (
                      <div key={u.id || i} className="flex items-center gap-3 p-3 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm">
                          {u.first_name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.role === 'admin' ? 'bg-error-100 text-error-700' : u.role === 'seller' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                        }`}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'shops' && (
            <motion.div key="shops" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Shop</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shops.map(s => (
                      <tr key={s.slug || s.public_id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/shop/${s.slug}`)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                              {s.logo ? <img src={getImageUrl(s.logo)} className="w-full h-full object-cover" /> : s.name?.[0]}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{s.owner_email || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            s.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                          }`}>{s.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">⭐ {Number(s.rating_average || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-bold text-xs">
                              {u.first_name?.[0] || '?'}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{u.first_name} {u.last_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            u.role === 'admin' ? 'bg-error-100 text-error-700' : u.role === 'seller' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
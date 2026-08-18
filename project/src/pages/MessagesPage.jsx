import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { useUser } from '../context/UserContext'
import { shopAPI } from '../services/api'
import MessagesTab from '../components/dashboard/MessagesTab'

export default function MessagesPage() {
  const { user, isAuthenticated, loading: userLoading } = useUser()
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [loadingShops, setLoadingShops] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      shopAPI.mine()
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.results || [])
          setShops(list)
          if (list.length > 0) {
            setSelectedShop(list[0])
          }
        })
        .catch(() => setShops([]))
        .finally(() => setLoadingShops(false))
    } else {
      setLoadingShops(false)
    }
  }, [isAuthenticated])

  if (userLoading || loadingShops) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 pb-12 px-4">
        <SEOHead title="Messages | MultiShop" description="View and manage your storefront customer messages." />
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            💬
          </div>
          <h2 className="text-xl font-bold text-gray-900">Sign In to View Messages</h2>
          <p className="text-sm text-gray-500">
            Please log in to your account to read storefront inquiries, reply to customers, and track message history.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <SEOHead title="Messages & Customer Inquiries | MultiShop" description="View and respond to storefront messages." />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <span>💬</span> Messages & Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Read customer storefront messages and send direct replies.
            </p>
          </div>

          {shops.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Shop:</label>
              <select
                value={selectedShop?.slug || ''}
                onChange={e => setSelectedShop(shops.find(s => s.slug === e.target.value) || null)}
                className="px-3 py-1.5 bg-gray-50 text-gray-900 text-xs font-bold border border-gray-200 rounded-xl outline-none"
              >
                {shops.map(s => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <MessagesTab shop={selectedShop || (shops[0] || null)} />
        </motion.div>
      </div>
    </div>
  )
}

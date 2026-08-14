import React, { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { referralAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import { useNotification } from '../context/NotificationContext'
import SEOHead from '../components/SEOHead'

export default function ReferralDashboard() {
  const { user } = useUser()
  const { toast } = useNotification()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customCode, setCustomCode] = useState('')
  const [updatingCode, setUpdatingCode] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await referralAPI.myStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load referral stats:', err)
      toast('Failed to load referral stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getEffectiveReferralUrl = () => {
    if (!stats?.code) return stats?.referral_url || ''
    return `${window.location.origin}/signup?ref=${stats.code}`
  }

  const handleCopyLink = () => {
    const url = getEffectiveReferralUrl()
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Referral link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCustomCodeSubmit = async (e) => {
    e.preventDefault()
    if (!customCode.trim()) return
    try {
      setUpdatingCode(true)
      await referralAPI.setCustomCode(customCode.trim())
      toast('Custom referral code updated successfully!', 'success')
      setCustomCode('')
      loadStats()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update custom code'
      toast(msg, 'error')
    } finally {
      setUpdatingCode(false)
    }
  }

  const getWhatsAppShareUrl = () => {
    const url = getEffectiveReferralUrl()
    const text = encodeURIComponent(
      `Start your online store or shop on MultiShopNG! Use my link to register: ${url}`
    )
    return `https://api.whatsapp.com/send?text=${text}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <SEOHead title="Referral & Affiliate Partner Program | MultiShopNG" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Refer & Earn Program 🎁
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Invite store owners and buyers. Earn ₦500 for every vendor subscription + 20% share of sales commission!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-md transition-all flex items-center gap-2"
            >
              <span>📱</span> Share on WhatsApp
            </a>
          </div>
        </div>

        {/* Share Link Banner */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Unique Referral Link
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              readOnly
              value={getEffectiveReferralUrl()}
              className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-mono text-sm focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-sm"
            >
              {copied ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>

          {/* Custom Code Form */}
          <form onSubmit={handleCustomCodeSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Set Custom Handle (e.g. BIZOWNER)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-full sm:w-64 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={updatingCode || !customCode.trim()}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 text-white text-sm rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {updatingCode ? 'Updating...' : 'Set Custom Handle'}
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
          >
            <p className="text-xs uppercase tracking-wider opacity-80">Total Earnings</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2">
              ₦{Number(stats?.total_earnings || 0).toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg"
          >
            <p className="text-xs uppercase tracking-wider opacity-80">Available Wallet Balance</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2">
              ₦{Number(stats?.wallet_balance || 0).toLocaleString()}
            </p>
          </motion.div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Referred Shops</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {stats?.total_referred_sellers || 0}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Referred Buyers</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {stats?.total_referred_buyers || 0}
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
          <h3 className="font-bold text-emerald-900 dark:text-emerald-300">
            💡 How You Earn Money (100% Zero Cost):
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-800 dark:text-emerald-400">
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span><strong>₦500 per Subscription:</strong> Earn ₦500 each time a referred vendor subscribes or renews their monthly/yearly plan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span><strong>20% Sales Commission Share:</strong> Earn 20% of MultiShopNG's platform commission on every order your referred shop completes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span><strong>Direct Bank Payouts:</strong> Withdraw your earnings directly into any Nigerian bank account via Monnify.</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span><strong>Instant Tracking:</strong> Real-time transparent ledger recording every referral reward.</span>
            </li>
          </ul>
        </div>

        {/* Earnings History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Earnings History
            </h3>
          </div>

          {!stats?.earnings_history || stats.earnings_history.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No referral earnings recorded yet. Share your link to start earning!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Triggered By</th>
                    <th className="px-6 py-4">Gross Amount</th>
                    <th className="px-6 py-4">Your Reward</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.earnings_history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.earning_type === 'subscription'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          }`}
                        >
                          {item.earning_type === 'subscription' ? 'Subscription Bonus' : 'Commission Share'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {item.referred_user_email}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                        ₦{Number(item.gross_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        +₦{Number(item.reward_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

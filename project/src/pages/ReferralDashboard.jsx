import React, { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { referralAPI } from '../services/api'
import { useUser } from '../context/UserContext'
import { useNotification } from '../context/NotificationContext'
import SEOHead from '../components/SEOHead'

const DEFAULT_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Taj Bank', code: '302' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank (ALAT)', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

export default function ReferralDashboard() {
  const { user } = useUser()
  const { toast } = useNotification()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customCode, setCustomCode] = useState('')
  const [updatingCode, setUpdatingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [referralFilter, setReferralFilter] = useState('all') // 'all', 'paid', 'pending'
  const [searchTerm, setSearchTerm] = useState('')

  // Referral Wallet & Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [banksList, setBanksList] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(null)
  const [useNewBank, setUseNewBank] = useState(false)
  const [bankForm, setBankForm] = useState({
    bank_name: 'Access Bank',
    account_number: '',
    account_name: '',
    bank_code: '044',
  })
  const [saveAccount, setSaveAccount] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [ledgerTab, setLedgerTab] = useState('withdrawals') // 'withdrawals', 'earnings', 'transactions'

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

  const handleOpenWithdraw = async () => {
    setWithdrawError('')
    setWithdrawAmount('')
    if (stats?.bank_accounts && stats.bank_accounts.length > 0) {
      setSelectedBankAccountId(stats.bank_accounts[0].id)
      setUseNewBank(false)
    } else {
      setUseNewBank(true)
    }
    setShowWithdrawModal(true)
    if (banksList.length === 0) {
      try {
        const b = await referralAPI.getBanks()
        if (b?.banks) setBanksList(b.banks)
      } catch (e) {
        setBanksList(DEFAULT_BANKS)
      }
    }
  }

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault()
    setWithdrawError('')
    const num = Number(withdrawAmount)
    const available = Number(stats?.wallet_balance || 0)
    if (!num || isNaN(num) || num < 1000) {
      setWithdrawError('Minimum withdrawal amount is ₦1,000.00')
      return
    }
    if (num > available) {
      setWithdrawError(`Cannot withdraw more than your available balance (₦${available.toLocaleString()})`)
      return
    }

    if (useNewBank) {
      if (!bankForm.account_number || bankForm.account_number.length < 10) {
        setWithdrawError('Please enter a valid 10-digit Nigerian NUBAN account number.')
        return
      }
      if (!bankForm.account_name.trim()) {
        setWithdrawError('Please enter the recipient account name.')
        return
      }
    }

    try {
      setWithdrawing(true)
      const payload = {
        amount: num,
        save_account: saveAccount,
      }
      if (useNewBank) {
        payload.bank_name = bankForm.bank_name
        payload.account_number = bankForm.account_number
        payload.account_name = bankForm.account_name
        payload.bank_code = bankForm.bank_code
      } else {
        payload.bank_account_id = selectedBankAccountId
      }

      const res = await referralAPI.withdraw(payload)
      toast(res.detail || 'Withdrawal requested successfully!', 'success')
      setShowWithdrawModal(false)
      loadStats()
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit withdrawal request'
      setWithdrawError(msg)
    } finally {
      setWithdrawing(false)
    }
  }

  const referredUsers = stats?.referred_users || []
  const paidCount = stats?.total_paid_count ?? referredUsers.filter(u => u.has_paid).length
  const pendingCount = stats?.total_pending_count ?? referredUsers.filter(u => !u.has_paid).length

  const filteredReferredUsers = referredUsers.filter(item => {
    if (referralFilter === 'paid' && !item.has_paid) return false
    if (referralFilter === 'pending' && item.has_paid) return false

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchName = item.name?.toLowerCase().includes(q)
      const matchEmail = item.masked_email?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q)
      const matchShop = item.shop_name?.toLowerCase().includes(q)
      return matchName || matchEmail || matchShop
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-24 sm:pt-28 px-4 sm:px-8 pb-12">
      <SEOHead title="Referral & Affiliate Partner Program | MultiShopNG" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Refer & Earn Program 🎁
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Invite store owners and shoppers. Earn 20% cash (up to ₦500) per paid subscription + 20% share of sales commission!
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Unique Referral Link
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
              Code: {stats?.code}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              readOnly
              value={getEffectiveReferralUrl()}
              className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-mono text-sm focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>📋</span>
              <span>{copied ? 'Copied! ✓' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Custom Code Form */}
          <form onSubmit={handleCustomCodeSubmit} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Set Custom Handle (e.g. BIZOWNER)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-full sm:w-64 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm focus:outline-none uppercase font-mono"
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
            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Referral Wallet</p>
              <button
                onClick={handleOpenWithdraw}
                disabled={Number(stats?.wallet_balance || 0) < 1000}
                className="px-2.5 py-1 bg-white/20 hover:bg-white text-white hover:text-indigo-900 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
              >
                Withdraw ₦
              </button>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">
              ₦{Number(stats?.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-indigo-200 mt-1 flex items-center gap-1">
              <span>⚡</span> Available for direct payout
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
          >
            <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Total Earned</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2 font-mono">
              ₦{Number(stats?.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-white/80 mt-1">Lifetime rewards earned</p>
          </motion.div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Total Withdrawn</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 font-mono">
              ₦{Number(stats?.total_withdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid out to bank</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Total Referred</p>
              <span className="text-[11px] text-gray-400 font-mono">{stats?.total_clicks || 0} clicks</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {stats?.total_referred ?? ((stats?.total_referred_sellers || 0) + (stats?.total_referred_buyers || 0))}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{paidCount} Paid</span>
              <span className="text-gray-300">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{pendingCount} Pending</span>
            </div>
          </div>
        </div>

        {/* Important Rule Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm sm:text-base">
            <span>💡</span>
            <span>How Referral Payouts Work (Registration vs. Payment):</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
            When someone registers with your referral link, they appear in your <strong>People You Referred</strong> list below. You receive money once they make a transaction or subscription:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-800 dark:text-emerald-300 pt-1">
            <div className="flex items-start gap-2">
              <span>💳</span>
              <span><strong>Vendor Subscriptions:</strong> You earn <strong>20% cash (up to ₦500)</strong> immediately when a referred seller subscribes to a paid store plan.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🛍️</span>
              <span><strong>Shop Sales:</strong> You earn a <strong>20% share of MultiShop's platform commission</strong> on every order completed by shops you referred.</span>
            </div>
          </div>
        </div>

        {/* ── PEOPLE YOU REFERRED TABLE ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span> People You Referred ({referredUsers.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Track everyone who registered with your link and see who has paid or transacted.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setReferralFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  referralFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All ({referredUsers.length})
              </button>
              <button
                onClick={() => setReferralFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  referralFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span>✓ Paid & Active</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-700/30 text-[10px]">{paidCount}</span>
              </button>
              <button
                onClick={() => setReferralFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  referralFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <span>⏳ Pending Payment</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-700/30 text-[10px]">{pendingCount}</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {referredUsers.length > 0 && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Search referred users by name, email, or shop name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none"
              />
            </div>
          )}

          {/* Table */}
          {filteredReferredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
              <span className="text-4xl">🎁</span>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {referredUsers.length === 0
                  ? 'No one has registered with your link yet'
                  : 'No referred users match this filter'}
              </p>
              <p className="text-xs max-w-md mx-auto text-gray-500">
                Share your link with WhatsApp contacts, merchant friends, and social groups. When they register and start selling or shopping, your rewards appear here!
              </p>
              <button
                onClick={handleCopyLink}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all inline-block"
              >
                Copy & Share Your Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Referred User</th>
                    <th className="px-5 py-3.5">Account Role</th>
                    <th className="px-5 py-3.5">Date Joined</th>
                    <th className="px-5 py-3.5">Payment / Conversion</th>
                    <th className="px-5 py-3.5 text-right">Your Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReferredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      {/* User details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white leading-snug">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {item.masked_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Account Role */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.role === 'seller'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}>
                            <span>{item.role === 'seller' ? '🏪' : '🛍️'}</span>
                            <span>{item.role_display}</span>
                          </span>
                          {item.shop_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Shop: <span className="text-gray-700 dark:text-gray-300">{item.shop_name}</span>
                            </p>
                          )}
                          {item.active_plan && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Plan: {item.active_plan}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {item.registered_at ? new Date(item.registered_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Recent'}
                      </td>

                      {/* Payment / Conversion Status */}
                      <td className="px-5 py-4">
                        {item.has_paid ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                              <span>✓</span> Paid & Active
                            </span>
                            <p className="text-[11px] text-gray-500 leading-tight">
                              {item.status_detail}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                              <span>⏳</span> Pending Payment
                            </span>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                              No subscription or sale yet
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Reward amount */}
                      <td className="px-5 py-4 text-right">
                        {Number(item.total_earned) > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                              +₦{Number(item.total_earned).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                              {item.earnings_count} reward{item.earnings_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-mono">
                            ₦0.00
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── REFERRAL WALLET & PAYOUT LEDGER ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🏦</span> Referral Wallet & Payouts
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Track your requested bank withdrawals, earned referral bonuses, and wallet ledger.
              </p>
            </div>

            {/* Ledger Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl">
              <button
                onClick={() => setLedgerTab('withdrawals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'withdrawals'
                    ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Withdrawals ({stats?.payout_history?.length || 0})
              </button>
              <button
                onClick={() => setLedgerTab('earnings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'earnings'
                    ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Rewards Earned ({stats?.earnings_history?.length || 0})
              </button>
              <button
                onClick={() => setLedgerTab('transactions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'transactions'
                    ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Wallet Ledger ({stats?.transactions?.length || 0})
              </button>
            </div>
          </div>

          {/* TAB 1: Payout Withdrawals */}
          {ledgerTab === 'withdrawals' && (
            <div>
              {!stats?.payout_history || stats.payout_history.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
                  <span className="text-4xl">💳</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">No withdrawal requests yet</p>
                  <p className="text-xs max-w-sm mx-auto text-gray-500">
                    You have <strong>₦{Number(stats?.wallet_balance || 0).toLocaleString()}</strong> available in your referral wallet.
                  </p>
                  <button
                    onClick={handleOpenWithdraw}
                    disabled={Number(stats?.wallet_balance || 0) < 1000}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-40"
                  >
                    Withdraw to Bank Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[650px]">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Destination Bank</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.payout_history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 dark:text-white">{item.bank_name}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {item.account_name} • {item.account_number}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-white font-mono">
                            ₦{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                item.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : item.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                              }`}
                            >
                              {item.status}
                            </span>
                            {item.failure_reason && (
                              <p className="text-[10px] text-red-500 mt-1 max-w-xs truncate" title={item.failure_reason}>
                                {item.failure_reason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-gray-500">
                            {item.provider_reference || `REF-${item.id}`}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Earnings History */}
          {ledgerTab === 'earnings' && (
            <div>
              {!stats?.earnings_history || stats.earnings_history.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No referral bonuses recorded yet. Once your referred vendors subscribe or sell, rewards will be credited here!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Reward Type</th>
                        <th className="px-6 py-4">Triggered By</th>
                        <th className="px-6 py-4">Gross Amount</th>
                        <th className="px-6 py-4">Your Reward</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.earnings_history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                item.earning_type === 'subscription'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              }`}
                            >
                              {item.earning_type === 'subscription' ? 'Subscription Bonus (20%)' : 'Sales Commission Share (20%)'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                            {item.referred_user_email}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                            ₦{Number(item.gross_amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +₦{Number(item.reward_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Transactions Ledger */}
          {ledgerTab === 'transactions' && (
            <div>
              {!stats?.transactions || stats.transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No wallet transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Transaction Type</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Balance After</th>
                        <th className="px-6 py-4">Notes</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                tx.kind === 'earning'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                              }`}
                            >
                              {tx.kind_display || tx.kind}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-bold font-mono ${
                            tx.kind === 'earning' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {tx.kind === 'earning' ? '+' : '-'}₦{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                            ₦{Number(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={tx.notes}>
                            {tx.notes || tx.reference || '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(tx.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── WITHDRAWAL MODAL ── */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🏦</span> Withdraw Referral Earnings
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Direct payout to any Nigerian commercial or fintech bank account.
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Available Balance Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Available Referral Balance</p>
                  <p className="text-2xl font-black text-indigo-900 dark:text-white font-mono mt-0.5">
                    ₦{Number(stats?.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(stats?.wallet_balance || ''))}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                >
                  Withdraw All
                </button>
              </div>

              {withdrawError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
                  {withdrawError}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Amount input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Amount to Withdraw (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-mono">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="1000"
                      max={stats?.wallet_balance || 0}
                      step="0.01"
                      required
                      placeholder="e.g. 1,000.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-3 text-gray-900 dark:text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Minimum payout: ₦1,000.00 • Zero withdrawal fees</p>
                </div>

                {/* Bank Account Selection */}
                {stats?.bank_accounts && stats.bank_accounts.length > 0 && !useNewBank ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Destination Bank Account
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseNewBank(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        + Use Another Account
                      </button>
                    </div>

                    <div className="space-y-2">
                      {stats.bank_accounts.map((acc) => (
                        <div
                          key={acc.id}
                          onClick={() => setSelectedBankAccountId(acc.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedBankAccountId === acc.id
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{acc.account_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {acc.bank_name} • {acc.account_number}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedBankAccountId === acc.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                          }`}>
                            {selectedBankAccountId === acc.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Bank Account Details
                      </label>
                      {stats?.bank_accounts && stats.bank_accounts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUseNewBank(false)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          ← Select Saved Account
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Select Bank</label>
                      <select
                        value={bankForm.bank_name}
                        onChange={(e) => {
                          const bank = (banksList.length ? banksList : DEFAULT_BANKS).find(b => b.name === e.target.value)
                          setBankForm(prev => ({
                            ...prev,
                            bank_name: e.target.value,
                            bank_code: bank?.code || prev.bank_code,
                          }))
                        }}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                      >
                        {(banksList.length ? banksList : DEFAULT_BANKS).map((b) => (
                          <option key={b.code || b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Account Number (10 digits)</label>
                      <input
                        type="text"
                        maxLength="10"
                        placeholder="0123456789"
                        value={bankForm.account_number}
                        onChange={(e) => setBankForm(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Account Name</label>
                      <input
                        type="text"
                        placeholder="Full Name on Account"
                        value={bankForm.account_name}
                        onChange={(e) => setBankForm(prev => ({ ...prev, account_name: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="save_account"
                        checked={saveAccount}
                        onChange={(e) => setSaveAccount(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="save_account" className="text-xs text-gray-600 dark:text-gray-400">
                        Save this bank account for faster future payouts
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={withdrawing || Number(stats?.wallet_balance || 0) < 1000}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {withdrawing ? 'Processing Payout Request…' : `Confirm Withdrawal${withdrawAmount ? ` (₦${Number(withdrawAmount).toLocaleString()})` : ''}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import SEOHead from '../components/SEOHead'

export default function ReferralProgramPage() {
  const { isAuthenticated } = useUser()
  const [vendorCount, setVendorCount] = useState(10)
  const [avgOrderVol, setAvgOrderVol] = useState(100000)
  const [openFaq, setOpenFaq] = useState(null)

  // Calculations:
  // ₦500 per vendor subscription + (20% of 2.5% platform commission on ₦100,000 monthly sales per vendor)
  const subscriptionEarnings = vendorCount * 500
  const monthlyCommissionEarnings = Math.round(vendorCount * (avgOrderVol * 0.025 * 0.20))
  const totalMonthlyEarnings = subscriptionEarnings + monthlyCommissionEarnings

  const faqs = [
    {
      q: 'Is there any out-of-pocket cost to join the Referral Program?',
      a: 'Zero! The MultiShopNG Affiliate Program is 100% free with zero out-of-pocket costs or hidden fees forever.',
    },
    {
      q: 'How do I get my unique referral link?',
      a: 'Simply sign up or log into your MultiShopNG account, go to your Refer & Earn dashboard, and copy your auto-generated referral link or create a custom handle (e.g. ?ref=MYSTORE).',
    },
    {
      q: 'When do I get paid for vendor subscriptions?',
      a: 'Referral rewards are credited to your available wallet balance immediately after a referred vendor activates or renews any subscription plan. You receive 20% of the actual net amount paid (up to a maximum cap of ₦500 per subscription payment).',
    },
    {
      q: 'What happens if a referred vendor uses a discount coupon or free code?',
      a: 'Your referral bonus is calculated against the net cash actually paid after discounts. For instance, if a coupon reduces the subscription to ₦300, you receive 20% of ₦300 (₦60). Subscriptions activated under a 100% free promo coupon award ₦0.00.',
    },
    {
      q: 'How does the 20% sales commission share work?',
      a: 'MultiShopNG charges a standard platform commission on marketplace sales. When an order completes on a shop you referred, 20% of MultiShopNG’s platform commission is automatically credited to your wallet.',
    },
    {
      q: 'How do payouts work?',
      a: 'You can request instant withdrawals from your wallet balance directly into any verified Nigerian bank account via Monnify at any time.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <SEOHead title="Zero-Cost Referral & Affiliate Program | MultiShopNG" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 pb-20 bg-gradient-to-b from-emerald-900 via-emerald-950 to-gray-950 text-white px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold backdrop-blur-md"
          >
            <span>🎁 100% Zero-Cost Partner Program</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Earn Real Money by Sharing <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              MultiShopNG Marketplace
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-emerald-100/80 max-w-3xl mx-auto leading-relaxed"
          >
            Invite vendors, store owners, and shoppers. Earn <strong>20% cash (up to ₦500)</strong> for every subscription + <strong>20% share</strong> of platform sales commission forever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link
                to="/referrals"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-lg hover:scale-105"
              >
                Go to My Referral Dashboard 🚀
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all text-lg hover:scale-105"
                >
                  Join Partner Program Free 🚀
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md border border-white/20 transition-all text-lg"
                >
                  Sign In to Get Link
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Dual Reward Stream Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl">
              💵
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reward #1: 20% per Subscription (Up to ₦500)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              Every time a merchant signs up using your link and subscribes or renews a paid store tier, you receive <strong>20% of the net amount paid</strong> (capped at <strong>₦500</strong> per payment) directly in your wallet. If a coupon reduces the price (e.g. to ₦300), you receive 20% of ₦300 (₦60).
            </p>
            <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg">
              Instant Credit on Plan Activation
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-3xl">
              📈
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reward #2: 20% Sales Commission Share
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              Earn passive income on every product sold by your referred vendors. You receive <strong>20% of MultiShopNG’s platform commission</strong> on every fulfilled order.
            </p>
            <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-lg">
              Recurring Revenue Per Sale
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Earning Calculator */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-gradient-to-br from-gray-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-500/20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold">Interactive Earnings Calculator 🧮</h2>
            <p className="text-emerald-200/80">
              Estimate your monthly potential earnings based on your referral network size.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Referred Vendors Subscribed:</span>
                  <span className="text-emerald-400 font-bold">{vendorCount} Vendors</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={vendorCount}
                  onChange={(e) => setVendorCount(Number(e.target.value))}
                  className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Est. Monthly Sales Volume Per Shop:</span>
                  <span className="text-emerald-400 font-bold">₦{avgOrderVol.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="50000"
                  value={avgOrderVol}
                  onChange={(e) => setAvgOrderVol(Number(e.target.value))}
                  className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center space-y-4">
              <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                Estimated Monthly Earning
              </p>
              <p className="text-4xl sm:text-5xl font-extrabold text-emerald-400">
                ₦{totalMonthlyEarnings.toLocaleString()}
              </p>
              <div className="text-xs text-gray-300 space-y-1 border-t border-white/10 pt-4">
                <p>• Subscription Rewards: ₦{subscriptionEarnings.toLocaleString()}</p>
                <p>• Commission Share: ₦{monthlyCommissionEarnings.toLocaleString()}/mo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works 3-Step Process */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            How It Works in 3 Simple Steps
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Getting started takes less than 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Get Your Unique Link',
              desc: 'Copy your personalized referral URL or create a memorable custom handle (e.g. ?ref=YOURNAME) from your dashboard.',
              icon: '🔗',
            },
            {
              step: '02',
              title: 'Share Anywhere',
              desc: 'Share your link on WhatsApp, Twitter, Instagram, blogs, or directly with store owners looking to launch an online shop.',
              icon: '📱',
            },
            {
              step: '03',
              title: 'Withdraw Earnings Direct',
              desc: 'Watch your wallet balance grow in real time and withdraw directly to any Nigerian bank account via Monnify.',
              icon: '🏦',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden"
            >
              <div className="text-5xl font-extrabold text-gray-100 dark:text-gray-800 absolute top-4 right-4 select-none">
                {item.step}
              </div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Everything you need to know about the MultiShopNG Partner Program.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full text-left p-6 font-semibold text-gray-900 dark:text-white flex items-center justify-between gap-4 focus:outline-none"
              >
                <span>{faq.q}</span>
                <span className="text-emerald-500 font-bold text-xl">
                  {openFaq === index ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-6 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Banner CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl p-10 text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Ready to Start Earning Passive Income?
          </h2>
          <p className="text-emerald-100 max-w-xl mx-auto">
            Join hundreds of affiliates earning monthly referral rewards on MultiShopNG.
          </p>
          <div>
            {isAuthenticated ? (
              <Link
                to="/referrals"
                className="px-8 py-4 bg-white text-emerald-950 font-extrabold rounded-2xl shadow-lg hover:bg-emerald-50 transition-all text-lg inline-block"
              >
                Open My Referral Dashboard
              </Link>
            ) : (
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-emerald-950 font-extrabold rounded-2xl shadow-lg hover:bg-emerald-50 transition-all text-lg inline-block"
              >
                Sign Up & Get Referral Link
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <SEOHead title="Terms & Conditions — MultiShopNG" />
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl space-y-8"
        >
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
            <div className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold mb-3">
              MultiShopNG Terms of Service
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Terms & Conditions</h1>
            <p className="text-sm text-gray-400 mt-2">Last Updated: August 20, 2026</p>
          </div>

          {/* Quick Summary Alert Box */}
          <div className="p-5 rounded-2xl bg-primary-50 border border-primary-100 text-sm text-primary-800 leading-relaxed">
            <strong>💡 Quick Summary:</strong> MultiShopNG is an online multi-vendor marketplace and commerce technology platform. We connect independent sellers and verified buyers with secure payment processing powered by licensed payment partners (Paystack, Monnify, Stripe), delivery verification codes, customizable storefront themes, and automated seller verification.
          </div>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h3>
              <p>
                By accessing MultiShopNG (`multishopng.com`), registering an account, subscribing to seller plans, creating storefronts, listing products, or purchasing items, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you must discontinue platform usage immediately.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">2. Marketplace Platform Role</h3>
              <p>
                MultiShopNG operates strictly as an online technology provider and multi-vendor marketplace platform.
                <strong> We are not the direct seller of goods unless explicitly marked.</strong> Contracts for purchase are established directly between independent shop owners and buyers. Shop owners are solely responsible for item accuracy, inventory, delivery fulfillment, and customer service.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">3. Payment Processing & Buyer Protection</h3>
              <p>
                To provide a trusted e-commerce experience for buyers and sellers across Nigeria, MultiShopNG integrates standard marketplace checkout and buyer protection workflows:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Licensed Payment Providers:</strong> All transactions are processed through CBN-licensed payment gateways, including <strong>Paystack</strong>, <strong>Monnify (Moniepoint Microfinance Bank)</strong>, and <strong>Stripe</strong>. MultiShopNG utilizes marketplace split payment and settlement capabilities provided by our licensed payment partners.</li>
                <li><strong>Buyer Protection & Delivery Verification:</strong> Upon successful checkout, buyers receive a unique 6-digit delivery confirmation code in their order panel and confirmation receipt.</li>
                <li><strong>Delivery Confirmation:</strong> Buyers provide their 6-digit delivery confirmation code to the courier or seller upon physical receipt and inspection of their items. Entering this confirmation code verifies successful package delivery.</li>
                <li><strong>Disputes & Refunds:</strong> If an order is not delivered, incorrect, or defective, buyers may open a dispute before confirming delivery. Customer support and vendor resolution will evaluate the order for return or refund in accordance with the Refund Policy.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">4. Seller Subscription Tiers & Custom Shop Themes</h3>
              <p>
                Sellers may select from tiered subscription plans (Free, Growth, Pro, Scale, Enterprise):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Resource Caps:</strong> Subscriptions regulate limits on the number of active shops, total product inventory listings, staff accounts, custom domain connections, and priority support.</li>
                <li><strong>Custom Shop Themes:</strong> Premium subscription tiers unlock access to exclusive high-conversion Storefront Themes (including HoneySpicy, Obsidian, Artisan, Boho, Cyberpunk, Minimalist, etc.). Sellers may customize themes in compliance with community brand standards.</li>
                <li><strong>Billing & Renewals:</strong> Recurring plan fees are billed monthly via Paystack or Monnify auto-debit or manual renewal. Plan downgrades require sellers to clean up excess shops or products prior to tier change.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">5. Cloud Storage & Content Ownership</h3>
              <p>
                Product photos, store banners, and media uploads are hosted via high-speed Cloud Storage (Backblaze B2 S3 infrastructure):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Sellers retain copyright ownership over their uploaded media and graphics.</li>
                <li>Sellers grant MultiShopNG a non-exclusive license to host, display, and optimize uploaded assets for marketplace promotion.</li>
                <li>Uploads containing counterfeit products, copyright infringement, adult content, or prohibited items are strictly forbidden and subject to instant deletion.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">6. Identity Verification (KYC) & Abuse Protection</h3>
              <p>
                All sellers are required to submit valid Know Your Customer (KYC) verification (Government ID, CAC, or BVN verification):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Unverified shops face restricted listing limits and withdrawal limits.</li>
                <li><strong>Automated Suspension:</strong> If a storefront accumulates <strong>3 or more verified scam reports</strong> within 7 days, the system initiates an automated temporary suspension.</li>
                <li>Verified fraudulent accounts forfeit pending settlement balances, which are refunded to impacted buyers.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">7. Data Privacy & Authentication</h3>
              <p>
                We process personal information in compliance with global data privacy standards. User accounts may be authenticated via passwordless email OTPs (delivered via Brevo transaction services) or official Google One-Tap social sign-in. We do not sell user data to third-party advertisers.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">8. Referral & Partner Program Terms</h3>
              <p>
                MultiShopNG operates a free-to-join Partner & Affiliate Referral Program. By participating or sharing your referral links/codes, you agree to the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Subscription Referral Reward:</strong> Referrers earn <strong>20% of the actual net amount paid</strong> when a referred user activates or renews a paid subscription tier, capped at a maximum of <strong>₦500.00</strong> per plan payment.</li>
                <li><strong>Coupons & Discounts:</strong> If the referred user applies a promotional coupon or discount, the 20% referral reward is calculated strictly against the <em>net amount actually paid</em> after discounts. For example, if a coupon reduces the subscription price to ₦300.00, the referrer receives 20% of ₦300.00 (₦60.00). Subscriptions activated under a 100% free coupon or trial tier yield ₦0.00 referral reward.</li>
                <li><strong>Sales Commission Share:</strong> Referrers earn a <strong>20% recurring share</strong> of MultiShopNG's platform commission on orders successfully fulfilled and completed by shops they referred.</li>
                <li><strong>Payouts & Wallet Balances:</strong> Referral earnings are credited to the user's available wallet balance and can be withdrawn directly to verified Nigerian bank accounts via Monnify.</li>
                <li><strong>Anti-Abuse & Prohibited Conduct:</strong> Self-referrals (referring one's own secondary accounts or creating fictitious shops) and fraudulent redemptions are strictly prohibited. MultiShopNG reserves the right to void illegitimate referral earnings and suspend violating accounts.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">9. Limitation of Liability</h3>
              <p>
                MultiShopNG and its operators shall not be liable for indirect, punitive, or consequential damages arising from shop owner breach of contract, off-platform cash transactions, delivery courier delays, or unauthorized user conduct.
              </p>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-semibold">
              ← Return to Home
            </Link>
            <span className="text-gray-400">© 2026 MultiShopNG. All rights reserved.</span>
            <a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 font-medium transition">
              Powered by <span className="font-semibold text-gray-700">Apexlabs</span> (<span className="text-primary-600 hover:underline">apexlabs.it.com</span>)
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

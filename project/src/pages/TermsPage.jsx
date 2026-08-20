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
            <strong>💡 Quick Summary:</strong> MultiShopNG is a multi-vendor e-commerce platform and technology provider. We connect independent sellers and buyers with integrated payment gateways (Paystack, Monnify / Moniepoint, Stripe), strict 6-digit confirmation code escrow protection, tiered subscriptions with Custom Shop Themes, and automated identity verification (KYC). Sellers receive escrow payouts only upon buyer delivery confirmation.
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
                MultiShopNG operates strictly as a technology provider and intermediary platform.
                <strong> We are not the direct seller of goods unless explicitly marked.</strong> Contracts for purchase are established directly between independent shop owners and buyers. Shop owners are solely responsible for item accuracy, inventory, delivery fulfillment, and customer service.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">3. Payment Gateways & Escrow Protection</h3>
              <p>
                To eliminate payment fraud, MultiShopNG enforces a mandatory Payment Escrow Protocol:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Supported Payment Providers:</strong> Payments are processed via licensed payment gateways, including <strong>Paystack</strong>, <strong>Monnify (Moniepoint Microfinance Bank)</strong>, and <strong>Stripe</strong>.</li>
                <li><strong>Escrow Holding:</strong> All buyer payments are securely held in platform-managed escrow holding accounts until delivery completion.</li>
                <li><strong>6-Digit Confirmation Code:</strong> Upon successful checkout, buyers receive a unique 6-digit delivery confirmation OTP in their order panel and confirmation email.</li>
                <li><strong>Irreversible Code Release:</strong> Buyers must disclose their 6-digit code to the courier/seller <em>only</em> upon physical receipt and inspection of their items. Inputting the matching code immediately releases escrow funds to the seller's wallet balance.</li>
                <li><strong>Disputes & Refunds:</strong> If an order is not delivered or fails inspection, buyers may open a dispute before disclosing the confirmation code. Escrowed funds remain locked during investigation.</li>
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
                <li>Verified fraudulent accounts forfeit escrowed balances, which are refunded to impacted buyers.</li>
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
              <h3 className="text-lg font-bold text-gray-900">8. Limitation of Liability</h3>
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

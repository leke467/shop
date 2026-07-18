import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <SEOHead title="Privacy Policy" />
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl space-y-8"
        >
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Privacy Policy</h1>
            <p className="text-sm text-gray-400 mt-2">Last Updated: July 18, 2026</p>
          </div>

          {/* Quick Summary Alert Box */}
          <div className="p-5 rounded-2xl bg-primary-50 border border-primary-100 text-sm text-primary-800 leading-relaxed">
            <strong>💡 Quick Summary:</strong> We protect your personal information and transactions. We collect basic account details, shop setup data, and payout details. We use secure Stripe and Paystack processors to handle cards/transfers, meaning we never store card numbers. Sellers' identity verification documents (KYC NIN/BVN/CAC) are accessed solely by authorized administrators for anti-scam review and are never shared.
          </div>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">1. Information We Collect</h3>
              <p>
                We collect personal information to provide a secure and customized shopping environment:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account Registration:</strong> Name, email address, display handle, contact numbers, and passwords.</li>
                <li><strong>Shipping & Delivery:</strong> Physical delivery address, postal codes, and city location selection.</li>
                <li><strong>Shop Verification (KYC):</strong> Legal name, shop branding assets, and scanned copies of identity verification documents (government ID, NIN documents, CAC details) submitted by sellers.</li>
                <li><strong>Transactions:</strong> Purchase lists, order groups, pricing totals, and transaction history.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">2. How We Use Your Information</h3>
              <p>
                The information collected is used strictly to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Process checkout requests and hold payments securely in the escrow system.</li>
                <li>Verify shop owners' identities to prevent scam listings and resolve disputes.</li>
                <li>Track and display order history and transaction records.</li>
                <li>Send transactional email notifications (order receipts, shipping info, password resets).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">3. Payment Security & Processing</h3>
              <p>
                All customer card payments are processed securely through certified third-party payment gateways (Stripe and Paystack). 
                <strong> We do not store or have direct access to your credit card details or bank credentials on our servers.</strong> Financial transaction records are encrypted using TLS/SSL protocols.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">4. KYC Identity Information Protection</h3>
              <p>
                Identity files uploaded for verification are treated with maximum security:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Files are saved on protected storage buckets, accessible only by platform administrators.</li>
                <li>We do not sell, rent, or distribute identity documents or legal names to third-party marketing companies.</li>
                <li>Documents are preserved solely for the duration necessary to satisfy anti-fraud compliance requirements.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">5. Cookies & Tracking</h3>
              <p>
                Our platform uses secure, HTTP-only cookies to handle authentication states and session management. Cookies are strictly utilized to verify login credentials and maintain product cart continuity. We do not engage in invasive cross-site behavioral advertising trackers.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">6. Third-Party Disclosures</h3>
              <p>
                We do not share buyer or seller personal information with outside parties except when:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Necessary to execute delivery (e.g. sharing the delivery address and buyer name with the seller for fulfillment).</li>
                <li>Required by payment gateways to complete transaction processing.</li>
                <li>Compelled by a court order or binding legal authority.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">7. Data Retention & Deletion</h3>
              <p>
                You may request account termination and data deletion at any time. When an account is terminated, personal credentials, delivery details, and shop pages will be archived or permanently purged. Note that transactional accounting logs and dispute files must be kept for financial audit purposes.
              </p>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-gray-100 pt-6 flex justify-between items-center text-xs">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-semibold">
              ← Return to Home
            </Link>
            <span className="text-gray-400">© 2026 Marketplace Inc. All rights reserved.</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

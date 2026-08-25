import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <SEOHead title="Refund Policy" />
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl space-y-8"
        >
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Refund & Buyer Protection Policy</h1>
            <p className="text-sm text-gray-400 mt-2">Last Updated: August 20, 2026</p>
          </div>

          {/* Quick Summary Alert Box */}
          <div className="p-5 rounded-2xl bg-primary-50 border border-primary-100 text-sm text-primary-800 leading-relaxed">
            <strong>💡 Quick Summary:</strong> Under MultiShop Buyer Protection, you have the right to request a refund <strong>before</strong> the 6-digit delivery confirmation code is confirmed. Do not provide the confirmation code if the items received are incorrect, damaged, or not delivered. If a dispute is raised, order settlement is held pending support review to issue a vendor payout or buyer refund.
          </div>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">1. Refund Eligibility Period</h3>
              <p>
                Refunds are eligible and processing is guaranteed **before** the buyer shares the 6-digit delivery confirmation code with the seller. Once a delivery confirmation code is entered and verified, the order is marked completed and settled to the seller's balance.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">2. Non-Delivery & Lost Packages</h3>
              <p>
                If a seller does not ship the items or fails to complete delivery:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>The buyer must not share their confirmation code.</li>
                <li>The buyer can submit a formal refund request to support or open an order dispute.</li>
                <li>Upon verification of non-delivery, the platform will void the transaction and issue a full refund to the buyer's original payment method (Paystack, Monnify, or Stripe).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">3. Damaged or Incorrect Products</h3>
              <p>
                Buyers have the right to inspect goods during pickup or face-to-face handovers:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>If the products are damaged, fake, or different from the description, **do not share the confirmation code**.</li>
                <li>Request that the seller take back the goods and issue a replacement or return.</li>
                <li>If the seller refuses to accept a valid return, flag/report the shop and request support intervention.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">4. Raising an Order Dispute</h3>
              <p>
                When a dispute is opened by a buyer:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>The order group status changes to `Disputed`.</li>
                <li>Order payout settlement is temporarily held.</li>
                <li>Our support team will request evidence (shipping receipts, product photographs, messaging history) from both parties.</li>
                <li>Admin review takes up to 5 business days, after which funds will be either refunded to the buyer or released to the seller.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">5. Manual Delivery Disclaimers</h3>
              <p>
                For orders placed with "Manual Delivery Arrangement", any shipping fees sent directly to a seller's bank account are handled outside our platform. We cannot reclaim or refund cash sent off-platform. Only the purchase subtotal processed through the platform checkout is protected.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">6. Refund Processing Method</h3>
              <p>
                Approved refunds are credited directly back to the payment method (credit card, bank account, or mobile money) used during checkout. Refund timing depends on the provider (Stripe usually takes 5-10 business days; Paystack takes 1-3 business days).
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

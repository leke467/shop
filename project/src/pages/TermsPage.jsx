import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl space-y-8"
        >
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Terms & Conditions</h1>
            <p className="text-sm text-gray-400 mt-2">Last Updated: July 18, 2026</p>
          </div>

          {/* Quick Summary Alert Box */}
          <div className="p-5 rounded-2xl bg-primary-50 border border-primary-100 text-sm text-primary-800 leading-relaxed">
            <strong>💡 Quick Summary:</strong> This platform acts strictly as an intermediary/technology provider linking independent buyers and sellers. We hold buyer payments securely in escrow. Funds are only transferred to the seller once the buyer provides the delivery confirmation code (Confirmation Code Escrow). Sellers must submit valid KYC verification, and scam activities will result in immediate termination of account and forfeiture of escrowed balances.
          </div>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h3>
              <p>
                By creating a user profile, registering a storefront, listing items, or buying products on this platform, you agree to comply with and be legally bound by these Terms and Conditions. If you do not accept these terms in full, you must immediately cease all use of our services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">2. Role of the Platform</h3>
              <p>
                We provide technology and infrastructure facilitating independent e-commerce transactions. 
                <strong> We are not the seller of record, we do not own, inspect, pack, ship, or guarantee any physical products listed.</strong> Any contract for sale is formed directly between the buyer and the seller. We do not assume any liability for product defects, safety warnings, non-delivery, or misrepresentation by shop owners.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">3. Escrow & Delivery Code System</h3>
              <p>
                To shield our marketplace community against fraud, we operate a mandatory payment escrow protocol:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Payment Capture:</strong> When a buyer pays via Paystack or Stripe, the funds are securely held in a platform-controlled escrow holding wallet.</li>
                <li><strong>Confirmation Code:</strong> Upon checkout, a unique 6-digit confirmation code is generated and displayed on the buyer's home panel.</li>
                <li><strong>Verification on Receipt:</strong> The buyer must share this code with the courier/seller <strong>only</strong> when they have physically received and inspected the purchase. Sharing this code is an irreversible confirmation of delivery.</li>
                <li><strong>Release of Funds:</strong> Once the seller inputs the matching delivery code, the escrow funds are released to the seller's available wallet balance.</li>
                <li><strong>No Auto-Release:</strong> There is no timer auto-releasing funds. Funds remain locked in escrow until either a matching code is input by the seller, or a formal dispute is raised and reviewed by our admin team.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">4. Manual Delivery Disclaimers</h3>
              <p>
                Where sellers enable the "Manual Delivery Arrangement" option:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Buyers pay ₦0 shipping fees upfront on our platform.</li>
                <li>Delivery costs and courier logistics must be agreed upon directly between the buyer and the seller.</li>
                <li><strong>Safety Caution:</strong> Do not wire cash for shipping directly to a seller before receiving the package. Any transaction happening off-platform is completely unprotected by our escrow refund policies.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">5. Know Your Customer (KYC) & Identity Verification</h3>
              <p>
                To maintain a safe e-commerce space, all shop owners must undergo verification:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Sellers must submit accurate legal names and supporting documents (Government IDs, NIN verification letters, or CAC registration papers).</li>
                <li>Unverified sellers face listing count constraints and payout restrictions.</li>
                <li>We reserve the right to deploy automated validation tools (such as BVN check APIs) or perform manual checks at our sole discretion.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">6. Abuse, Scam Reports, and Suspension</h3>
              <p>
                Users can report shops for suspicious activity or policy breaches.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>If a storefront gathers **3 or more unique user reports** within any 7-day period, the system will trigger an automatic temporary suspension.</li>
                <li>Suspended shops cannot receive orders, and their products are hidden from the explore feeds.</li>
                <li>Escrowed funds tied to suspended accounts are locked pending investigation. If scam activity is verified, we will return the held funds to the respective buyers.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">7. Fees and Payouts</h3>
              <p>
                Payout balances are tracked on the seller wallet page. Withdrawals are processed manually via transfer request to admin. We reserve the right to charge transaction fees or subscription rates on premium tiers, which will be detailed on our Pricing page.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">8. Limitation of Liability</h3>
              <p>
                In no event shall the platform owner, developers, or affiliates be liable for indirect, incidental, or consequential damages resulting from transaction disputes, account suspension, loss of sales data, system down-time, or financial fraud occurring between buyers and sellers.
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

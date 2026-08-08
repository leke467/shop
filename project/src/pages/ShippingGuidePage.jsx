import React from 'react'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'

const PARTNERS = [
  { name: 'GIG Logistics', desc: 'Nationwide coverage with fast delivery times. Great for parcels of all sizes.', color: 'from-red-500 to-red-700' },
  { name: 'Kwik Delivery', desc: 'On-demand delivery for Lagos and Abuja. Fast dispatch for urgent items.', color: 'from-blue-500 to-blue-700' },
  { name: 'Sendbox', desc: 'Ideal for e-commerce with built-in escrow and international shipping options.', color: 'from-green-500 to-green-700' },
  { name: 'Topship', desc: 'Global and local shipping made easy. Door-to-door delivery.', color: 'from-purple-500 to-purple-700' },
  { name: 'Fez Delivery', desc: 'Reliable last-mile delivery services tailored for businesses.', color: 'from-orange-500 to-orange-700' }
]

export default function ShippingGuidePage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4 sm:px-6 lg:px-8"
    >
      <SEOHead title="Shipping Guide | Marketplace" description="Learn about shipping partners and logistics in Nigeria." />
      
      <div className="max-w-4xl mx-auto space-y-16">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">Shipping in Nigeria</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to know about delivering your products safely and efficiently to customers nationwide.</p>
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Logistics Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PARTNERS.map((partner, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${partner.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {partner.name[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{partner.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{partner.desc}</p>
                <a href="#" className="inline-block mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">Learn more &rarr;</a>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <h2 className="text-2xl font-bold mb-4">Packaging Tips</h2>
            <ul className="space-y-4 relative z-10">
              <li className="flex items-start"><span className="mr-2">📦</span> Use sturdy corrugated boxes for fragile items.</li>
              <li className="flex items-start"><span className="mr-2">🫧</span> Wrap items in bubble wrap or packing peanuts.</li>
              <li className="flex items-start"><span className="mr-2">📝</span> Clearly print and attach shipping labels.</li>
              <li className="flex items-start"><span className="mr-2">🌧️</span> Waterproof your packages during the rainy season.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Delivery Zones</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">You can set up custom delivery zones in your shop dashboard to automatically calculate shipping costs based on the customer's state.</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">Intra-State (e.g. Lagos to Lagos)</span>
                <span className="font-medium text-gray-900 dark:text-white">Usually 1-2 Days</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">Inter-State (e.g. Lagos to Abuja)</span>
                <span className="font-medium text-gray-900 dark:text-white">Usually 2-4 Days</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500 dark:text-gray-400">Remote Areas</span>
                <span className="font-medium text-gray-900 dark:text-white">Usually 3-7 Days</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  )
}

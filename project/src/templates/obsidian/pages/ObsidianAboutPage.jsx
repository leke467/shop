import { motion } from 'framer-motion'

export default function ObsidianAboutPage({ shop }) {
  const extra = shop?.theme?.extra_tokens || {}

  return (
    <div className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 sm:p-12 rounded-3xl bg-[#0F1420] border border-white/10 space-y-8"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
          About Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">
          Our Brand Story & Craftsmanship
        </h1>

        <p className="text-slate-300 text-lg leading-relaxed">
          {shop?.description || 'Welcome to our official store. We are dedicated to bringing you top-tier products backed by uncompromised quality, exceptional design, and seamless customer service.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">✨</span>
            <h4 className="font-bold text-white text-lg">Premium Standards</h4>
            <p className="text-xs text-slate-400 mt-1">Every item is rigorously tested</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">🚚</span>
            <h4 className="font-bold text-white text-lg">Nationwide Shipping</h4>
            <p className="text-xs text-slate-400 mt-1">Dispatched directly to your door</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">🛡️</span>
            <h4 className="font-bold text-white text-lg">Secure Payments</h4>
            <p className="text-xs text-slate-400 mt-1">Moniepoint & Paystack escrow protected</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

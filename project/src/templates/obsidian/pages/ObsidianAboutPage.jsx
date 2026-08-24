import { motion } from 'framer-motion'

export default function ObsidianAboutPage({ shop }) {
  const extra = shop?.theme?.extra_tokens || {}

  const heroTitle = extra.about_hero_title || 'Our Brand Story & Craftsmanship'
  const heroSubtitle = extra.about_hero_subtitle || shop?.tagline || 'Welcome to our official store.'
  const missionTitle = extra.about_mission_title || 'Our Mission'
  const missionHighlight = extra.about_mission_highlight || shop?.tagline || 'We are dedicated to bringing you top-tier products backed by uncompromised quality, exceptional design, and seamless customer service.'
  const missionText = extra.about_text || shop?.description || 'Every single item is crafted and selected to meet the highest performance and aesthetic standards.'

  const value1Title = extra.value1_title || 'Premium Standards'
  const value1Desc = extra.value1_desc || 'Every item is rigorously inspected and verified.'
  const value2Title = extra.value2_title || 'Nationwide Shipping'
  const value2Desc = extra.value2_desc || 'Fast and secure delivery to your doorstep.'
  const value3Title = extra.value3_title || 'Escrow Protection'
  const value3Desc = extra.value3_desc || '100% buyer protection via MultiShop Escrow.'
  const value4Title = extra.value4_title || 'Customer Dedication'
  const value4Desc = extra.value4_desc || '24/7 client support and satisfaction commitment.'

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
          {heroTitle}
        </h1>

        <p className="text-purple-300 text-lg font-medium">
          {heroSubtitle}
        </p>

        <div className="border-l-4 border-purple-500 bg-white/5 p-4 rounded-r-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">{missionTitle}</h3>
          <p className="text-white text-base sm:text-lg font-semibold">{missionHighlight}</p>
        </div>

        <p className="text-slate-300 text-base leading-relaxed">
          {missionText}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">✨</span>
            <h4 className="font-bold text-white text-sm">{value1Title}</h4>
            <p className="text-xs text-slate-400 mt-1">{value1Desc}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">🚚</span>
            <h4 className="font-bold text-white text-sm">{value2Title}</h4>
            <p className="text-xs text-slate-400 mt-1">{value2Desc}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">🛡️</span>
            <h4 className="font-bold text-white text-sm">{value3Title}</h4>
            <p className="text-xs text-slate-400 mt-1">{value3Desc}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-3xl block mb-1">🤝</span>
            <h4 className="font-bold text-white text-sm">{value4Title}</h4>
            <p className="text-xs text-slate-400 mt-1">{value4Desc}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

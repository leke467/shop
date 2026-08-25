import { motion } from 'framer-motion'

export default function ObsidianFeatures({ shop }) {
  const extra = shop?.theme?.extra_tokens || {}

  const features = [
    {
      icon: '🚀',
      title: extra.feature1_title || 'Express Dispatch',
      desc: extra.feature1_desc || 'Fast nationwide delivery with live tracking',
    },
    {
      icon: '🛡️',
      title: extra.feature2_title || 'Buyer Protection',
      desc: extra.feature2_desc || 'Verified delivery with 6-digit confirmation code verification',
    },
    {
      icon: '💎',
      title: extra.feature3_title || '100% Guaranteed',
      desc: extra.feature3_desc || 'Authentic products sourced directly from verified sellers',
    },
    {
      icon: '🎧',
      title: extra.feature4_title || '24/7 Dedicated Support',
      desc: extra.feature4_desc || 'Instant assistance whenever you need help with your order',
    },
  ]

  return (
    <section className="py-16 border-t border-white/10 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-[#121826]/60 border border-white/10 hover:border-purple-500/30 transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

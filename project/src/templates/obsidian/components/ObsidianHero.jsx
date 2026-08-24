import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function ObsidianHero({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { setIsCartOpen } = useCart()

  const extra = shop?.theme?.extra_tokens || {}

  const primaryAccent = extra.primary_color || '#8B5CF6'
  const heroHeadline = extra.hero_headline || shop?.name || 'Exclusive Luxury Collection'
  const heroSubtitle = extra.hero_subtitle || shop?.tagline || shop?.description || 'Elevate your lifestyle with our handpicked, premium products engineered for perfection.'

  const ctaPrimary = extra.hero_cta_primary || 'Explore Collection'
  const ctaSecondary = extra.hero_cta_secondary || 'View Cart'

  const heroImg1 = extra.hero_image_1
    ? getImageUrl(extra.hero_image_1)
    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'

  const heroImg2 = extra.hero_image_2
    ? getImageUrl(extra.hero_image_2)
    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'

  const heroImg3 = extra.hero_image_3
    ? getImageUrl(extra.hero_image_3)
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'

  const baseSlug = shopSlug || shop?.slug || ''
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const bannerImage = extra.banner_url || shop?.banner

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      {/* Banner Background Image */}
      {bannerImage && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img src={getImageUrl(bannerImage)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/40 via-[#0F172A]/80 to-[#0F172A]" />
        </div>
      )}

      {/* Background Ambient Glow Circles */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${primaryAccent} 0%, rgba(6, 182, 212, 0.4) 100%)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: primaryAccent }} />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Premium Storefront Experience
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white"
            >
              {heroHeadline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={() => navigate(catalogUrl)}
                className="px-8 py-4 rounded-2xl font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition-all text-base flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${primaryAccent} 0%, #4C1D95 100%)`,
                  boxShadow: `0 10px 30px -5px ${primaryAccent}66`,
                }}
              >
                <span>✨</span> {ctaPrimary}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="px-8 py-4 rounded-2xl font-bold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-base"
              >
                {ctaSecondary}
              </button>
            </motion.div>

            {/* Metrics Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-slate-400 font-medium">Verified Quality</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">24/7</p>
                <p className="text-xs text-slate-400 font-medium">Customer Service</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">Fast</p>
                <p className="text-xs text-slate-400 font-medium">Nationwide Delivery</p>
              </div>
            </div>
          </div>

          {/* Right Floating Showcase Grid Column */}
          <div className="lg:col-span-5 relative h-[420px] flex items-center justify-center">
            <motion.div
              className="relative w-full h-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {/* Card 1 */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="absolute top-4 left-6 w-48 h-64 rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900/80 backdrop-blur-xl"
              >
                <img
                  src={heroImg1}
                  alt="Showcase 1"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
                  }}
                />
              </motion.div>

              {/* Card 2 */}
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 0.8 }}
                className="absolute top-20 right-4 w-52 h-72 rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900/80 backdrop-blur-xl"
              >
                <img
                  src={heroImg2}
                  alt="Showcase 2"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
                  }}
                />
              </motion.div>

              {/* Card 3 */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 1.5 }}
                className="absolute bottom-2 left-1/3 w-44 h-44 rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-slate-900/80 backdrop-blur-xl"
              >
                <img
                  src={heroImg3}
                  alt="Showcase 3"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

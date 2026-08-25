import { Link } from 'react-router-dom'
import { getImageUrl } from '../../services/api'

/**
 * Reusable About & Story Page for all Storefront Templates.
 * Consumes custom extra_tokens saved in the Manage Template modal.
 */
export default function TemplateAboutView({ shop, shopSlug, theme = 'default', products = [] }) {
  const extra = shop?.theme?.extra_tokens || {}
  const base = shopSlug || shop?.slug || ''

  const heroTitle = extra.about_hero_title || 'Our Story & Mission'
  const heroSubtitle = extra.about_hero_subtitle || shop?.tagline || 'Dedicated to crafting and delivering excellence in every single order.'

  const missionTitle = extra.about_mission_title || 'Our Mission'
  const missionHighlight = extra.about_mission_highlight || shop?.tagline || 'Creating exceptional experiences through quality and passion.'
  const missionText = extra.about_text || shop?.description || 'We are dedicated to delivering the finest products, crafted with care, integrity, and attention to detail.'

  const value1Title = extra.value1_title || 'Quality First'
  const value1Desc = extra.value1_desc || 'We never compromise on the quality, authenticity, and precision of our products.'

  const value2Title = extra.value2_title || 'Customer Experience'
  const value2Desc = extra.value2_desc || 'Every order and interaction is an opportunity to create a memorable customer relationship.'

  const value3Title = extra.value3_title || 'Integrity & Care'
  const value3Desc = extra.value3_desc || 'Committed to responsible, sustainable, and transparent practices in everything we build.'

  const value4Desc = extra.value4_desc || 'Backed by 100% MultiShop Buyer Protection for complete shopping confidence.'

  const heroBanner = extra.banner_url || shop?.banner || ''
  const shopLogo = extra.logo_url || shop?.logo || ''

  const getThemeStyles = () => {
    switch (theme) {
      case 'cyberpunk':
        return {
          wrapper: 'bg-[#05010D] text-[#00F0FF] font-mono min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#0D0221]/90 border border-[#00F0FF]/40 p-8 sm:p-12 shadow-[0_0_25px_rgba(0,240,255,0.15)] rounded-none',
          badge: 'bg-[#FF007F] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest',
          title: 'text-3xl sm:text-5xl font-black uppercase text-[#00F0FF] tracking-tight drop-shadow-[0_0_8px_#00F0FF]',
          subtext: 'text-gray-300 text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-4 border-[#FF007F] bg-black/50 p-4 text-[#00F0FF] font-bold',
          valueCard: 'bg-[#0D0221]/80 border border-[#00F0FF]/30 p-6 hover:border-[#FF007F] transition-all',
          valueIcon: 'text-3xl mb-3 text-[#FF007F]',
          valueTitle: 'text-base font-bold text-white uppercase',
          valueDesc: 'text-xs text-gray-400 mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3 bg-[#FF007F] hover:bg-[#D9006C] text-white font-bold tracking-wider uppercase transition-all',
        }
      case 'minimalist':
        return {
          wrapper: 'bg-white text-[#111827] font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-gray-50 border border-gray-200 p-8 sm:p-12 rounded-2xl',
          badge: 'bg-black text-white px-3 py-1 text-[11px] font-mono uppercase tracking-widest',
          title: 'text-3xl sm:text-5xl font-light tracking-tight text-gray-900',
          subtext: 'text-gray-600 text-sm sm:text-base leading-relaxed font-normal',
          highlightBox: 'border-l-2 border-black bg-white p-4 text-gray-900 font-medium italic',
          valueCard: 'bg-white border border-gray-200 p-6 rounded-xl hover:border-black transition-all',
          valueIcon: 'text-2xl mb-3',
          valueTitle: 'text-sm font-bold text-gray-900 uppercase tracking-wider',
          valueDesc: 'text-xs text-gray-500 mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3 bg-black hover:bg-gray-800 text-white font-medium text-xs tracking-widest uppercase transition-all rounded-md',
        }
      case 'emerald':
        return {
          wrapper: 'bg-[#F0FDF4] text-[#064E3B] font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#022C22] text-white p-8 sm:p-12 rounded-3xl shadow-xl border border-emerald-800',
          badge: 'bg-emerald-500 text-white px-3.5 py-1 text-xs font-bold uppercase tracking-widest rounded-full',
          title: 'text-3xl sm:text-5xl font-light tracking-wide text-white',
          subtext: 'text-emerald-100/90 text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-4 border-emerald-400 bg-emerald-950/60 p-4 text-emerald-300 font-medium rounded-r-xl',
          valueCard: 'bg-white border border-emerald-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all',
          valueIcon: 'text-3xl mb-3 text-emerald-600',
          valueTitle: 'text-base font-bold text-[#064E3B]',
          valueDesc: 'text-xs text-emerald-700 mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md',
        }
      case 'royal':
        return {
          wrapper: 'bg-[#120A11] text-[#F5E6D3] font-serif min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#1A1019] border border-[#C9A84C]/40 p-8 sm:p-12 shadow-2xl rounded-none',
          badge: 'border border-[#C9A84C] text-[#C9A84C] px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
          title: 'text-3xl sm:text-5xl font-light uppercase tracking-widest text-[#F5E6D3]',
          subtext: 'text-[#F5E6D3]/80 text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-2 border-[#C9A84C] bg-black/40 p-4 text-[#C9A84C] font-normal italic',
          valueCard: 'bg-[#1A1019] border border-[#C9A84C]/20 p-6 hover:border-[#C9A84C] transition-all',
          valueIcon: 'text-3xl mb-3 text-[#C9A84C]',
          valueTitle: 'text-sm font-bold text-[#F5E6D3] uppercase tracking-wider',
          valueDesc: 'text-xs text-[#F5E6D3]/70 mt-2 leading-relaxed font-sans',
          ctaBtn: 'px-8 py-3 border-2 border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#120A11] font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300',
        }
      case 'boho':
        return {
          wrapper: 'bg-[#FAF5EF] text-[#4A3225] font-serif min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#5C3828] text-white p-8 sm:p-12 shadow-lg rounded-[32px]',
          badge: 'bg-[#FAF5EF] text-[#5C3828] px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full',
          title: 'text-3xl sm:text-5xl font-normal leading-tight text-white',
          subtext: 'text-white/80 text-sm sm:text-base leading-relaxed font-sans',
          highlightBox: 'border-l-4 border-[#FAF5EF] bg-black/20 p-4 text-[#FAF5EF] font-sans font-medium rounded-r-2xl',
          valueCard: 'bg-white border border-[#E8DDD2] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all font-sans',
          valueIcon: 'text-3xl mb-3 text-[#C4785A]',
          valueTitle: 'text-base font-bold text-[#4A3225]',
          valueDesc: 'text-xs text-[#8B6F5C] mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-[#5C3828] hover:bg-[#43271A] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all font-sans',
        }
      case 'popart':
        return {
          wrapper: 'bg-[#FEF08A] text-black font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-white border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_#000]',
          badge: 'bg-pink-500 text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_#000]',
          title: 'text-3xl sm:text-6xl font-black uppercase text-black drop-shadow-[3px_3px_0px_#EC4899]',
          subtext: 'text-black font-bold text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-3 border-black bg-cyan-300 p-4 text-black font-black shadow-[4px_4px_0px_#000]',
          valueCard: 'bg-white border-3 border-black p-6 shadow-[5px_5px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-transform',
          valueIcon: 'text-3xl mb-3',
          valueTitle: 'text-base font-black text-black uppercase',
          valueDesc: 'text-xs text-gray-800 font-bold mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-sm uppercase border-3 border-black shadow-[4px_4px_0px_#000] transition-all',
        }
      case 'retro':
        return {
          wrapper: 'bg-[#FFFBEB] text-[#78350F] font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#78350F] text-white p-8 sm:p-12 rounded-3xl shadow-xl',
          badge: 'bg-[#FDE68A] text-[#78350F] px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full',
          title: 'text-3xl sm:text-5xl font-extrabold text-[#FDE68A] tracking-tight leading-tight',
          subtext: 'text-[#FEF3C7] text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-4 border-[#FDE68A] bg-black/30 p-4 text-white font-bold rounded-r-xl',
          valueCard: 'bg-white border-2 border-[#D97706]/30 p-6 rounded-2xl shadow-sm hover:border-[#D97706] transition-all',
          valueIcon: 'text-3xl mb-3 text-[#EA580C]',
          valueTitle: 'text-base font-extrabold text-[#78350F]',
          valueDesc: 'text-xs text-[#92400E] mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md',
        }
      case 'pastel':
        return {
          wrapper: 'bg-[#FDF2F8] text-[#4A3560] font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-gradient-to-br from-pink-300 to-purple-400 text-white p-8 sm:p-12 rounded-3xl shadow-lg',
          badge: 'bg-white/80 text-[#4A3560] px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-xs',
          title: 'text-3xl sm:text-5xl font-extrabold text-white leading-tight',
          subtext: 'text-white/90 text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-4 border-white bg-white/20 p-4 text-white font-bold rounded-r-2xl',
          valueCard: 'bg-white/80 backdrop-blur-md border border-purple-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all',
          valueIcon: 'text-3xl mb-3 text-pink-500',
          valueTitle: 'text-base font-extrabold text-[#4A3560]',
          valueDesc: 'text-xs text-purple-600 mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md',
        }
      case 'industrial':
        return {
          wrapper: 'bg-[#121212] text-[#E0D8C8] font-mono min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-[#1C1C1C] border border-dashed border-[#3D3D3D] p-8 sm:p-12 shadow-2xl',
          badge: 'border border-dashed border-[#F59E0B] text-[#F59E0B] px-3 py-1 text-xs font-bold uppercase tracking-widest',
          title: 'text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#F59E0B]',
          subtext: 'text-[#8B8B7A] text-sm sm:text-base leading-relaxed font-sans',
          highlightBox: 'border-l-2 border-dashed border-[#F59E0B] bg-black/60 p-4 text-[#E0D8C8]',
          valueCard: 'bg-[#1C1C1C] border border-dashed border-[#3D3D3D] p-6 hover:border-[#F59E0B] transition-all',
          valueIcon: 'text-3xl mb-3 text-[#F59E0B]',
          valueTitle: 'text-sm font-bold text-[#E0D8C8] uppercase tracking-wider',
          valueDesc: 'text-xs text-[#8B8B7A] mt-2 leading-relaxed font-sans',
          ctaBtn: 'px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs tracking-widest uppercase transition-all',
        }
      default:
        return {
          wrapper: 'bg-gray-50 text-gray-900 font-sans min-h-[80vh] py-12 px-4 sm:px-8',
          heroCard: 'bg-white border border-gray-200 p-8 sm:p-12 rounded-3xl shadow-sm',
          badge: 'bg-amber-500 text-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full',
          title: 'text-3xl sm:text-5xl font-bold text-gray-900 leading-tight',
          subtext: 'text-gray-600 text-sm sm:text-base leading-relaxed',
          highlightBox: 'border-l-4 border-amber-500 bg-amber-50/60 p-4 text-gray-900 font-medium rounded-r-xl',
          valueCard: 'bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all',
          valueIcon: 'text-3xl mb-3 text-amber-500',
          valueTitle: 'text-base font-bold text-gray-900',
          valueDesc: 'text-xs text-gray-500 mt-2 leading-relaxed',
          ctaBtn: 'px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md',
        }
    }
  }

  const styles = getThemeStyles()
  const catalogUrl = base ? `/shop/${base}/catalog` : '/catalog'

  return (
    <div className={styles.wrapper}>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 1. Hero & Mission Section */}
        <div className={styles.heroCard}>
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
            <div className="space-y-6 flex-1">
              <span className={styles.badge}>
                {shop?.name || 'About Our Store'}
              </span>

              <h1 className={styles.title}>
                {heroTitle}
              </h1>

              <p className={styles.subtext}>
                {heroSubtitle}
              </p>

              <div className={styles.highlightBox}>
                <h3 className="text-sm uppercase tracking-wider opacity-80 mb-1">{missionTitle}</h3>
                <p className="text-base sm:text-lg">{missionHighlight}</p>
              </div>

              <p className={styles.subtext}>
                {missionText}
              </p>

              <div className="pt-2">
                <Link to={catalogUrl} className={`inline-block ${styles.ctaBtn}`}>
                  Explore Catalog ➔
                </Link>
              </div>
            </div>

            {/* Store Visual Logo / Banner */}
            {(shopLogo || heroBanner) && (
              <div className="w-full lg:w-96 shrink-0 flex flex-col items-center justify-center p-6 bg-black/5 rounded-2xl border border-black/10">
                {shopLogo ? (
                  <img
                    src={getImageUrl(shopLogo)}
                    alt={shop?.name || 'Logo'}
                    className="max-h-48 max-w-full object-contain rounded-xl shadow-xs"
                  />
                ) : heroBanner ? (
                  <img
                    src={getImageUrl(heroBanner)}
                    alt={shop?.name || 'Banner'}
                    className="w-full h-48 object-cover rounded-xl shadow-xs"
                  />
                ) : null}
                <div className="mt-4 text-center">
                  <h4 className="text-sm font-bold opacity-90">{shop?.name}</h4>
                  <p className="text-xs opacity-60">{shop?.tagline}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Core Values & Principles Grid */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Core Principles</h2>
            <p className="text-xs sm:text-sm opacity-70">The values and commitments that define everything we deliver</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🎯</div>
              <h3 className={styles.valueTitle}>{value1Title}</h3>
              <p className={styles.valueDesc}>{value1Desc}</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>❤️</div>
              <h3 className={styles.valueTitle}>{value2Title}</h3>
              <p className={styles.valueDesc}>{value2Desc}</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌱</div>
              <h3 className={styles.valueTitle}>{value3Title}</h3>
              <p className={styles.valueDesc}>{value3Desc}</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🛡️</div>
              <h3 className={styles.valueTitle}>{value4Title}</h3>
              <p className={styles.valueDesc}>{value4Desc}</p>
            </div>
          </div>
        </div>

        {/* 3. Buyer Protection Trust Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-black/5 border border-black/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔐</span>
            <div>
              <h4 className="font-bold text-base sm:text-lg">MultiShop Buyer Protection</h4>
              <p className="text-xs opacity-75 mt-0.5">Secure payment processing with package verification via 6-digit delivery confirmation code.</p>
            </div>
          </div>
          <Link to={catalogUrl} className={`shrink-0 ${styles.ctaBtn}`}>
            Shop with Confidence
          </Link>
        </div>
      </div>
    </div>
  )
}

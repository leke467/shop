import { Link } from 'react-router-dom'
import { getImageUrl } from '../../services/api'

/**
 * Universal Storefront Footer for all templates.
 * Adapts seamlessly to the active template theme.
 */
export default function TemplateFooterView({ shop, shopSlug, theme = 'default', setIsCartOpen }) {
  const extra = shop?.theme?.extra_tokens || {}
  const base = shopSlug || shop?.slug || ''
  const shopName = shop?.name || 'Storefront'
  const shopTagline = shop?.tagline || 'Verified Merchant on MultiShop'
  const shopLogo = extra.logo_url || shop?.logo || ''
  const footerNote = extra.footer_note || ''

  const getThemeStyles = () => {
    switch (theme) {
      case 'cyberpunk':
        return {
          wrapper: 'bg-[#05010D] border-t-2 border-[#00F0FF]/40 text-[#00F0FF] font-mono py-12 px-6',
          brandTitle: 'text-lg font-black tracking-wider text-[#00F0FF]',
          brandText: 'text-xs text-gray-400',
          heading: 'text-xs font-bold uppercase tracking-widest text-[#FF007F] mb-3',
          link: 'text-xs text-gray-300 hover:text-[#00F0FF] transition-colors block py-1',
          badge: 'border border-[#00F0FF]/40 bg-black/60 p-3 rounded-none text-xs text-[#00F0FF]',
          bottomBorder: 'border-t border-[#00F0FF]/20 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500',
          poweredLink: 'text-[#00F0FF] hover:underline font-bold',
        }
      case 'minimalist':
        return {
          wrapper: 'bg-white border-t border-gray-200 text-gray-900 font-sans py-12 px-6',
          brandTitle: 'text-base font-light tracking-wide text-gray-900',
          brandText: 'text-xs text-gray-500 font-normal',
          heading: 'text-xs font-mono uppercase tracking-widest text-gray-900 mb-3 font-semibold',
          link: 'text-xs text-gray-600 hover:text-black transition-colors block py-1',
          badge: 'border border-gray-200 bg-gray-50 p-3 rounded-lg text-xs text-gray-700',
          bottomBorder: 'border-t border-gray-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-mono',
          poweredLink: 'text-gray-900 hover:underline font-bold',
        }
      case 'emerald':
        return {
          wrapper: 'bg-[#022C22] border-t border-emerald-800 text-white font-sans py-12 px-6',
          brandTitle: 'text-lg font-light tracking-wide text-emerald-300',
          brandText: 'text-xs text-emerald-200/70',
          heading: 'text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3',
          link: 'text-xs text-emerald-300 hover:text-white transition-colors block py-1',
          badge: 'border border-emerald-700/60 bg-emerald-950/60 p-3 rounded-xl text-xs text-emerald-200',
          bottomBorder: 'border-t border-emerald-900 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-400/60',
          poweredLink: 'text-emerald-300 hover:underline font-bold',
        }
      case 'royal':
        return {
          wrapper: 'bg-[#120A11] border-t border-[#C9A84C]/30 text-[#F5E6D3] font-serif py-12 px-6',
          brandTitle: 'text-lg font-light tracking-[0.2em] uppercase text-[#C9A84C]',
          brandText: 'text-xs text-[#F5E6D3]/60 font-sans',
          heading: 'text-[11px] font-bold uppercase tracking-[0.25em] text-[#C9A84C] mb-3',
          link: 'text-xs text-[#F5E6D3]/70 hover:text-[#C9A84C] transition-colors block py-1 font-sans',
          badge: 'border border-[#C9A84C]/30 bg-black/40 p-3 rounded-none text-xs text-[#F5E6D3]',
          bottomBorder: 'border-t border-[#C9A84C]/20 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F5E6D3]/40 font-sans',
          poweredLink: 'text-[#C9A84C] hover:underline font-bold',
        }
      case 'boho':
        return {
          wrapper: 'bg-[#FAF5EF] border-t border-[#E8DDD2] text-[#4A3225] font-sans py-12 px-6',
          brandTitle: 'text-lg font-serif text-[#4A3225]',
          brandText: 'text-xs text-[#8B6F5C]',
          heading: 'text-xs font-bold uppercase tracking-wider text-[#C4785A] mb-3',
          link: 'text-xs text-[#5C4033] hover:text-[#C4785A] transition-colors block py-1',
          badge: 'border border-[#E8DDD2] bg-white p-3 rounded-2xl text-xs text-[#5C4033] shadow-2xs',
          bottomBorder: 'border-t border-[#E8DDD2] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8B6F5C]',
          poweredLink: 'text-[#5C4033] hover:underline font-bold',
        }
      case 'popart':
        return {
          wrapper: 'bg-white border-t-4 border-black text-black font-sans py-12 px-6',
          brandTitle: 'text-xl font-black uppercase text-black drop-shadow-[2px_2px_0px_#EC4899]',
          brandText: 'text-xs font-bold text-gray-700',
          heading: 'text-xs font-black uppercase tracking-wider text-pink-600 mb-3',
          link: 'text-xs font-bold text-black hover:text-pink-600 hover:underline transition-colors block py-1 uppercase',
          badge: 'border-3 border-black bg-yellow-300 p-3 shadow-[4px_4px_0px_#000] text-xs font-black uppercase',
          bottomBorder: 'border-t-3 border-black pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-black',
          poweredLink: 'text-black hover:underline font-black bg-cyan-300 px-1 border border-black',
        }
      case 'retro':
        return {
          wrapper: 'bg-[#FEF3C7] border-t-2 border-[#D97706]/40 text-[#78350F] font-sans py-12 px-6',
          brandTitle: 'text-lg font-extrabold text-[#78350F]',
          brandText: 'text-xs text-[#92400E]',
          heading: 'text-xs font-bold uppercase tracking-wider text-[#EA580C] mb-3',
          link: 'text-xs font-bold text-[#92400E] hover:text-[#EA580C] transition-colors block py-1',
          badge: 'border border-[#D97706]/40 bg-white/70 p-3 rounded-xl text-xs text-[#78350F]',
          bottomBorder: 'border-t border-[#D97706]/20 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#92400E]',
          poweredLink: 'text-[#EA580C] hover:underline font-extrabold',
        }
      case 'pastel':
        return {
          wrapper: 'bg-white/80 backdrop-blur-md border-t border-purple-100 text-[#4A3560] font-sans py-12 px-6',
          brandTitle: 'text-lg font-extrabold text-[#4A3560]',
          brandText: 'text-xs text-purple-500',
          heading: 'text-xs font-bold uppercase tracking-wider text-pink-500 mb-3',
          link: 'text-xs text-[#4A3560] hover:text-pink-500 transition-colors block py-1',
          badge: 'border border-purple-100 bg-[#FDF2F8] p-3 rounded-2xl text-xs text-[#4A3560]',
          bottomBorder: 'border-t border-purple-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-purple-400',
          poweredLink: 'text-pink-500 hover:underline font-bold',
        }
      case 'industrial':
        return {
          wrapper: 'bg-[#1C1C1C] border-t border-dashed border-[#3D3D3D] text-[#E0D8C8] font-mono py-12 px-6',
          brandTitle: 'text-lg font-bold text-[#F59E0B] tracking-wider',
          brandText: 'text-xs text-[#8B8B7A]',
          heading: 'text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-3',
          link: 'text-xs text-[#8B8B7A] hover:text-[#F59E0B] transition-colors block py-1',
          badge: 'border border-dashed border-[#3D3D3D] bg-black/60 p-3 text-xs text-[#E0D8C8]',
          bottomBorder: 'border-t border-dashed border-[#3D3D3D] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B6B6B]',
          poweredLink: 'text-[#F59E0B] hover:underline font-bold',
        }
      default:
        return {
          wrapper: 'bg-gray-900 border-t border-gray-800 text-white font-sans py-12 px-6',
          brandTitle: 'text-lg font-bold text-white',
          brandText: 'text-xs text-gray-400',
          heading: 'text-xs font-bold uppercase tracking-wider text-amber-400 mb-3',
          link: 'text-xs text-gray-300 hover:text-white transition-colors block py-1',
          badge: 'border border-gray-800 bg-gray-800/50 p-3 rounded-xl text-xs text-gray-300',
          bottomBorder: 'border-t border-gray-800 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500',
          poweredLink: 'text-amber-400 hover:underline font-bold',
        }
    }
  }

  const styles = getThemeStyles()

  return (
    <footer className={styles.wrapper}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Branding & Bio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {shopLogo ? (
              <img src={getImageUrl(shopLogo)} alt={shopName} className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
            ) : null}
            <h3 className={styles.brandTitle}>{shopName}</h3>
          </div>
          <p className={styles.brandText}>{shopTagline}</p>
          {footerNote && (
            <p className="text-[11px] opacity-75 italic">{footerNote}</p>
          )}
        </div>

        {/* Col 2: Navigation Links */}
        <div>
          <h4 className={styles.heading}>Navigation</h4>
          <div className="space-y-1">
            <Link to={base ? `/shop/${base}` : '/'} className={styles.link}>⌂ Home</Link>
            <Link to={base ? `/shop/${base}/catalog` : '/catalog'} className={styles.link}>🛍️ Catalog & Products</Link>
            <Link to={base ? `/shop/${base}/about` : '/about'} className={styles.link}>📖 About Our Story</Link>
            <Link to={base ? `/shop/${base}/reviews` : '/reviews'} className={styles.link}>⭐ Customer Reviews</Link>
            <Link to={base ? `/shop/${base}/orders` : '/orders'} className={styles.link}>📦 Track Store Orders</Link>
            {setIsCartOpen && (
              <button onClick={() => setIsCartOpen(true)} className={`${styles.link} text-left`}>🛒 View Shopping Bag</button>
            )}
          </div>
        </div>

        {/* Col 3: Customer Care & Policy */}
        <div>
          <h4 className={styles.heading}>Buyer Protection</h4>
          <div className="space-y-2.5">
            <div className={styles.badge}>
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <span>🛡️</span> Verified Purchase Protection
              </div>
              <p className="opacity-75 text-[10px]">Protected checkout with delivery confirmation code verification.</p>
            </div>
            <Link to="/" className="text-[11px] opacity-75 hover:underline block">← Back to MultiShop Marketplace</Link>
          </div>
        </div>

        {/* Col 4: Verified Badge */}
        <div>
          <h4 className={styles.heading}>Verified Merchant</h4>
          <div className="space-y-2">
            <p className="text-xs opacity-80 leading-relaxed">
              Official storefront on <strong className="opacity-100">MultiShop Nigeria</strong>. 100% genuine products with secured payment checkout.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] opacity-90 font-medium">Storefront Online & Accepting Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & ApexLabs Branding */}
      <div className="max-w-7xl mx-auto">
        <div className={styles.bottomBorder}>
          <div>
            © {new Date().getFullYear()} {shopName}. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0">
            <a href="https://apexlab.it.com" target="_blank" rel="noopener noreferrer" className={styles.poweredLink}>
              Powered by ApexLabs
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

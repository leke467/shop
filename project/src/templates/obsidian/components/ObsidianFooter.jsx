import { Link } from 'react-router-dom'
import { getImageUrl } from '../../../services/api'

export default function ObsidianFooter({ shop, shopSlug }) {
  const baseSlug = shopSlug || shop?.slug || ''
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const aboutUrl = baseSlug ? `/shop/${baseSlug}/about` : '/about'
  const contactUrl = baseSlug ? `/shop/${baseSlug}/contact` : '/contact'

  const extra = shop?.theme?.extra_tokens || {}
  const primaryAccent = extra.primary_color || '#8B5CF6'

  return (
    <footer className="bg-[#05070B] border-t border-white/10 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Link to={homeUrl} className="flex items-center gap-3">
              {shop?.logo ? (
                <img src={getImageUrl(shop.logo)} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryAccent}, #4C1D95)` }}
                >
                  {shop?.name?.charAt(0) || 'O'}
                </div>
              )}
              <span className="font-extrabold text-xl text-white">{shop?.name || 'Obsidian Luxe'}</span>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {shop?.description || shop?.tagline || 'Ultra-sleek storefront powered by MultiShop marketplace.'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Storefront</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to={homeUrl} className="hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link to={catalogUrl} className="hover:text-purple-400 transition-colors">Catalog</Link></li>
              <li><Link to={baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'} className="hover:text-purple-400 transition-colors">Customer Reviews</Link></li>
              <li><Link to={aboutUrl} className="hover:text-purple-400 transition-colors">Our Story</Link></li>
              <li><Link to={contactUrl} className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Contact & Socials</h4>
            {shop?.phone && <p className="text-xs text-slate-300">📞 {shop.phone}</p>}
            {shop?.email && <p className="text-xs text-slate-300">✉️ {shop.email}</p>}
            {shop?.address && <p className="text-xs text-slate-300">📍 {shop.address}</p>}

            <div className="flex gap-3 pt-2">
              {shop?.instagram_url && (
                <a href={shop.instagram_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:text-purple-400">
                  📸
                </a>
              )}
              {shop?.twitter_url && (
                <a href={shop.twitter_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:text-purple-400">
                  🐦
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© {new Date().getFullYear()} {shop?.name || 'Obsidian Luxe'}. All rights reserved.</p>
          <p className="text-slate-500 text-center sm:text-right">
            Powered by MultiShop Platform
            <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

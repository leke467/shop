import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../../services/api'

/**
 * Universal Mobile Navigation Bar & Drawer for all Storefront Templates.
 * Provides a responsive hamburger menu, shopping bag trigger, and touch-optimized navigation.
 */
export default function TemplateMobileNav({
  shop,
  shopSlug,
  theme = 'default',
  cartCount = 0,
  setIsCartOpen,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const extra = shop?.theme?.extra_tokens || {}
  const base = shopSlug || shop?.slug || ''
  const homeUrl = base ? `/shop/${base}` : '/'
  const catalogUrl = base ? `/shop/${base}/catalog` : '/catalog'
  const aboutUrl = base ? `/shop/${base}/about` : '/about'
  const reviewsUrl = base ? `/shop/${base}/reviews` : '/reviews'
  const shopName = shop?.name || 'Storefront'
  const shopLogo = extra.logo_url || shop?.logo || ''

  const isActive = (path) => location.pathname === path

  const getThemeStyles = () => {
    switch (theme) {
      case 'cyberpunk':
        return {
          menuBg: 'bg-[#0A0A14] text-[#00F0FF] border-b-2 border-[#00F0FF]/40 font-mono',
          drawerBg: 'bg-[#080810] text-[#00F0FF] border-r-2 border-[#FF007F] font-mono',
          activeLink: 'bg-[#FF007F] text-white font-bold',
          inactiveLink: 'text-[#94A3B8] hover:text-[#00F0FF] hover:bg-white/5',
          btnCart: 'border border-[#00F0FF] bg-[#00F0FF]/10 text-white font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]',
          badge: 'border border-[#00F0FF]/30 text-xs text-[#00F0FF]',
        }
      case 'minimalist':
      case 'monochrome':
        return {
          menuBg: 'bg-white text-gray-900 border-b border-gray-200 font-sans',
          drawerBg: 'bg-white text-gray-900 border-r border-gray-200 font-sans',
          activeLink: 'bg-black text-white font-bold',
          inactiveLink: 'text-gray-600 hover:text-black hover:bg-gray-100',
          btnCart: 'border border-gray-900 bg-black text-white font-mono',
          badge: 'border border-gray-200 bg-gray-50 text-xs text-gray-700 font-mono',
        }
      case 'emerald':
        return {
          menuBg: 'bg-[#022C22] text-white border-b border-emerald-800 font-sans',
          drawerBg: 'bg-[#022C22] text-white border-r border-emerald-700 font-sans',
          activeLink: 'bg-emerald-600 text-white font-bold',
          inactiveLink: 'text-emerald-300 hover:text-white hover:bg-emerald-900/50',
          btnCart: 'bg-emerald-600 text-white font-bold',
          badge: 'border border-emerald-700 bg-emerald-950 text-xs text-emerald-300',
        }
      case 'royal':
        return {
          menuBg: 'bg-[#1A1019] text-[#F5E6D3] border-b border-[#C9A84C]/30 font-serif',
          drawerBg: 'bg-[#140C13] text-[#F5E6D3] border-r border-[#C9A84C]/40 font-serif',
          activeLink: 'bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-black font-bold',
          inactiveLink: 'text-[#C9A84C]/70 hover:text-[#C9A84C] hover:bg-white/5 font-sans',
          btnCart: 'bg-[#C9A84C] text-black font-bold',
          badge: 'border border-[#C9A84C]/30 text-xs text-[#C9A84C] font-sans',
        }
      case 'boho':
        return {
          menuBg: 'bg-[#FAF5EF] text-[#5C4033] border-b border-[#E8DDD2] font-sans',
          drawerBg: 'bg-[#FAF5EF] text-[#5C4033] border-r border-[#E8DDD2] font-sans',
          activeLink: 'bg-[#5C3828] text-white font-bold',
          inactiveLink: 'text-[#8B6F5C] hover:text-[#5C4033] hover:bg-[#F3ECE2]',
          btnCart: 'bg-[#5C3828] text-white font-bold',
          badge: 'border border-[#E8DDD2] bg-white text-xs text-[#5C4033]',
        }
      case 'popart':
        return {
          menuBg: 'bg-yellow-300 text-black border-b-4 border-black font-sans font-black',
          drawerBg: 'bg-white text-black border-r-4 border-black font-sans font-black',
          activeLink: 'bg-pink-500 text-white border-2 border-black shadow-[3px_3px_0px_#000]',
          inactiveLink: 'text-black hover:bg-yellow-200 uppercase',
          btnCart: 'bg-pink-500 text-white border-2 border-black shadow-[3px_3px_0px_#000]',
          badge: 'border-2 border-black bg-yellow-200 text-xs text-black',
        }
      case 'retro':
        return {
          menuBg: 'bg-[#FEF3C7] text-[#78350F] border-b-2 border-[#D97706]/40 font-sans',
          drawerBg: 'bg-[#FFFBEB] text-[#78350F] border-r-2 border-[#D97706] font-sans',
          activeLink: 'bg-[#EA580C] text-white font-bold',
          inactiveLink: 'text-[#92400E] hover:text-[#EA580C] hover:bg-[#FDE68A]',
          btnCart: 'bg-[#EA580C] text-white font-bold shadow-md',
          badge: 'border border-[#D97706]/40 bg-white/80 text-xs text-[#78350F]',
        }
      case 'pastel':
        return {
          menuBg: 'bg-white/80 backdrop-blur-md text-[#4A3560] border-b border-purple-100 font-sans',
          drawerBg: 'bg-[#FAF5FF] text-[#4A3560] border-r border-purple-200 font-sans',
          activeLink: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold',
          inactiveLink: 'text-[#7C3AED] hover:bg-purple-100/60',
          btnCart: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold shadow-md shadow-purple-200',
          badge: 'border border-purple-200 bg-white text-xs text-purple-700',
        }
      case 'industrial':
        return {
          menuBg: 'bg-[#1C1C1C] text-[#E0D8C8] border-b border-dashed border-[#3D3D3D] font-mono',
          drawerBg: 'bg-[#141414] text-[#E0D8C8] border-r border-dashed border-[#F59E0B] font-mono',
          activeLink: 'bg-[#F59E0B] text-black font-bold',
          inactiveLink: 'text-[#8B8B7A] hover:text-[#F59E0B] hover:bg-white/5',
          btnCart: 'border border-dashed border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-black',
          badge: 'border border-dashed border-[#3D3D3D] bg-black text-xs text-[#E0D8C8]',
        }
      default:
        return {
          menuBg: 'bg-gray-900 text-white border-b border-gray-800 font-sans',
          drawerBg: 'bg-gray-900 text-white border-r border-gray-800 font-sans',
          activeLink: 'bg-amber-500 text-white font-bold',
          inactiveLink: 'text-gray-300 hover:text-white hover:bg-gray-800',
          btnCart: 'bg-amber-500 text-white font-bold',
          badge: 'border border-gray-800 bg-gray-800 text-xs text-gray-300',
        }
    }
  }

  const styles = getThemeStyles()

  return (
    <div className="md:hidden">
      {/* Mobile Top Navigation Header */}
      <div className={`px-4 py-3 flex items-center justify-between sticky top-0 z-40 ${styles.menuBg}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-black/10 flex items-center gap-2 focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <span className="text-xl leading-none">☰</span>
          <span className="text-xs font-bold uppercase tracking-wider">Menu</span>
        </button>

        <Link to={homeUrl} className="flex items-center gap-2 max-w-[180px] truncate">
          {shopLogo ? (
            <img src={getImageUrl(shopLogo)} alt={shopName} className="w-6 h-6 rounded-md object-contain" />
          ) : null}
          <span className="text-sm font-bold truncate">{shopName}</span>
        </Link>

        <button
          onClick={() => setIsCartOpen && setIsCartOpen(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${styles.btnCart}`}
        >
          <span>🛒</span>
          <span>{cartCount}</span>
        </button>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 left-0 bottom-0 w-4/5 max-w-xs z-50 shadow-2xl flex flex-col justify-between p-6 ${styles.drawerBg}`}
            >
              <div>
                {/* Header with Close button */}
                <div className="flex items-center justify-between pb-4 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    {shopLogo ? (
                      <img src={getImageUrl(shopLogo)} alt={shopName} className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{shopName}</h3>
                      <p className="text-[10px] opacity-60">Verified Storefront</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 -mr-2 rounded-lg hover:bg-black/10 text-lg leading-none font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Nav Links List */}
                <nav className="mt-6 space-y-2">
                  <Link
                    to={homeUrl}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive(homeUrl) ? styles.activeLink : styles.inactiveLink
                    }`}
                  >
                    <span>⌂</span>
                    <span>Home</span>
                  </Link>

                  <Link
                    to={catalogUrl}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive(catalogUrl) ? styles.activeLink : styles.inactiveLink
                    }`}
                  >
                    <span>🛍️</span>
                    <span>Catalog & Products</span>
                  </Link>

                  <Link
                    to={aboutUrl}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive(aboutUrl) ? styles.activeLink : styles.inactiveLink
                    }`}
                  >
                    <span>📖</span>
                    <span>About Our Story</span>
                  </Link>

                  <Link
                    to={reviewsUrl}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive(reviewsUrl) ? styles.activeLink : styles.inactiveLink
                    }`}
                  >
                    <span>⭐</span>
                    <span>Customer Reviews</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setIsCartOpen && setIsCartOpen(true)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all ${styles.inactiveLink}`}
                  >
                    <div className="flex items-center gap-3">
                      <span>🛒</span>
                      <span>Shopping Bag</span>
                    </div>
                    <span className="font-bold">({cartCount})</span>
                  </button>
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-black/10 space-y-3 text-center">
                <div className={`p-3 rounded-xl ${styles.badge}`}>
                  <div className="font-bold flex items-center justify-center gap-1">
                    <span>🛡️</span> 100% Escrow Protected
                  </div>
                </div>

                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="block text-xs opacity-75 hover:opacity-100 hover:underline"
                >
                  ← Back to MultiShop
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

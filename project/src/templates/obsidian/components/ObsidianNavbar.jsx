import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'
import Logo from '../../../components/Logo'

export default function ObsidianNavbar({ shop, shopSlug }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const extra = shop?.theme?.extra_tokens || {}
  const primaryAccent = extra.primary_color || '#8B5CF6'

  const baseSlug = shopSlug || shop?.slug || ''
  const homeUrl = baseSlug ? `/shop/${baseSlug}` : '/'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'
  const reviewsUrl = baseSlug ? `/shop/${baseSlug}/reviews` : '/reviews'
  const aboutUrl = baseSlug ? `/shop/${baseSlug}/about` : '/about'
  const contactUrl = baseSlug ? `/shop/${baseSlug}/contact` : '/contact'
  const cartList = Array.isArray(cart) ? cart : (cart?.items || [])
  const cartCount = cartList.reduce((sum, item) => sum + (item.quantity || 1), 0)

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090E]/80 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to={homeUrl} className="flex items-center gap-3 group">
          {shop?.logo ? (
            <img
              src={getImageUrl(shop.logo)}
              alt={shop.name}
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primaryAccent}, #4C1D95)` }}
            >
              {shop?.name?.charAt(0) || 'O'}
            </div>
          )}
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-purple-300 transition-colors">
            {shop?.name || 'Obsidian Luxe'}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to={homeUrl}
            className={`text-sm font-semibold transition-colors ${
              isActive(homeUrl) ? 'text-purple-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            to={catalogUrl}
            className={`text-sm font-semibold transition-colors ${
              isActive(catalogUrl) ? 'text-purple-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Catalog
          </Link>
          <Link
            to={reviewsUrl}
            className={`text-sm font-semibold transition-colors hover:text-cyan-400 ${
              isActive(reviewsUrl) ? 'text-cyan-400 font-bold' : 'text-slate-300'
            }`}
          >
            Reviews
          </Link>
          <Link
            to={aboutUrl}
            className={`text-sm font-semibold transition-colors ${
              isActive(aboutUrl) ? 'text-purple-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Our Story
          </Link>
          <Link
            to={contactUrl}
            className={`text-sm font-semibold transition-colors ${
              isActive(contactUrl) ? 'text-purple-400 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Actions (MultiShop Link, Cart & Mobile Menu Button) */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white font-bold text-xs transition-all shadow-xs"
            title="Return to MultiShop Marketplace"
          >
            <Logo size="sm" isDarkBg={true} />
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105 active:scale-95"
            aria-label="View Cart"
          >
            <span className="text-xl">🛍️</span>
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow-lg animate-pulse"
                style={{ backgroundColor: primaryAccent }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0F19] border-b border-white/10 px-6 py-4 space-y-3">
          <Link
            to={homeUrl}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-white"
          >
            Home
          </Link>
          <Link
            to={catalogUrl}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-white"
          >
            Catalog
          </Link>
          <Link
            to={reviewsUrl}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-cyan-400"
          >
            Reviews
          </Link>
          <Link
            to={aboutUrl}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-white"
          >
            Our Story
          </Link>
          <Link
            to={contactUrl}
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-white"
          >
            Contact
          </Link>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-purple-400 hover:text-purple-300 pt-2 border-t border-white/10 flex items-center gap-2"
          >
            <span>🏪</span> Return to MultiShop Marketplace
          </Link>
        </div>
      )}
    </header>
  )
}

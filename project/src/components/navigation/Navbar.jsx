import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { useWishlist } from '../../context/WishlistContext'
import { messagingAPI } from '../../services/api'
import Logo from '../Logo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useUser()
  const menuRef = useRef(null)
  
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [navQuery, setNavQuery] = useState('')
  const [navCategory, setNavCategory] = useState('all')

  const handleNavQueryChange = (e) => {
    const val = e.target.value
    setNavQuery(val)

    const params = new URLSearchParams()
    if (val.trim()) {
      params.set('q', val.trim())
    }
    if (navCategory && navCategory !== 'all') {
      if (navCategory === 'shops') {
        navigate(`/explore/shops?${params.toString()}`, { replace: true })
        return
      }
      params.set('category', navCategory)
    }

    const targetPath = location.pathname.startsWith('/explore') ? location.pathname : '/explore/products'
    navigate(`${targetPath}?${params.toString()}`, { replace: true })
  }

  const handleNavSearch = (e) => {
    e.preventDefault()
    handleNavQueryChange({ target: { value: navQuery } })
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  
  useEffect(() => {
    let isMounted = true
    if (isAuthenticated) {
      messagingAPI.unreadCount()
        .then(res => { if (isMounted) setUnreadMessages(res?.unread_count || res?.count || 0) })
        .catch(() => { if (isMounted) setUnreadMessages(0) })
        
      const interval = setInterval(() => {
        messagingAPI.unreadCount()
          .then(res => { if (isMounted) setUnreadMessages(res?.unread_count || res?.count || 0) })
          .catch(() => { if (isMounted) setUnreadMessages(0) })
      }, 30000)
      return () => {
        isMounted = false
        clearInterval(interval)
      }
    } else {
      setUnreadMessages(0)
    }
  }, [isAuthenticated])

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false) }, [location.pathname])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isHome = location.pathname === '/'

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      isScrolled || !isHome
        ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo size="md" isDarkBg={!isScrolled && isHome} />
          </Link>

          {/* Header Search Bar */}
          <form onSubmit={handleNavSearch} className="hidden md:flex items-center flex-1 max-w-4xl lg:max-w-5xl mx-2 lg:mx-6">
            <div className="flex items-stretch w-full bg-white rounded-xl shadow-xs border border-gray-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30 overflow-hidden">
              <select
                value={navCategory}
                onChange={e => setNavCategory(e.target.value)}
                className="bg-gray-100 border-r border-gray-200 text-xs font-semibold text-gray-700 px-3 py-2 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Categories</option>
                <option value="shops">🏪 All Shops</option>
                <option value="arts-crafts">Arts & Crafts</option>
                <option value="automotive">Automotive</option>
                <option value="baby">Baby</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="books">Books</option>
                <option value="boys-fashion">Boys' Fashion</option>
                <option value="computers">Computers & Tech</option>
                <option value="deals">⚡ Hot Deals</option>
                <option value="electronics">Electronics</option>
                <option value="girls-fashion">Girls' Fashion</option>
                <option value="health">Health & Household</option>
                <option value="home-kitchen">Home & Kitchen</option>
                <option value="industrial">Industrial & Scientific</option>
                <option value="luggage">Luggage & Travel</option>
                <option value="mens-fashion">Men's Fashion</option>
                <option value="movies-tv">Movies & TV</option>
                <option value="music">Music & Audio</option>
                <option value="pet-supplies">Pet Supplies</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="tools">Tools & Home Improvement</option>
                <option value="toys-games">Toys & Games</option>
                <option value="video-games">Video Games</option>
                <option value="womens-fashion">Women's Fashion</option>
              </select>
              <input
                type="text"
                value={navQuery}
                onChange={handleNavQueryChange}
                placeholder="Search products, brands, categories..."
                className="flex-1 min-w-0 px-3.5 py-2 text-xs md:text-sm text-gray-900 bg-white focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold px-3.5 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-slate-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/explore/products', label: 'Explore' },
              { to: '/blog', label: 'Blog' },
              { to: '/referral-program', label: 'Referrals' },
              { to: '/pricing', label: 'Pricing' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? (isScrolled || !isHome ? 'bg-primary-50 text-primary-700 font-semibold' : 'bg-white/20 text-white font-semibold')
                    : (isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isSeller && (
              <Link to="/dashboard" className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}>
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}>
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                isScrolled || !isHome ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Wishlist */}
            <Link 
              to="/wishlist" 
              className={`relative p-2 rounded-xl transition-all ${
                isScrolled || !isHome ? 'hover:bg-gray-100/60' : 'hover:bg-white/10'
              }`}
              title="My Wishlist"
            >
              <svg className={`w-5 h-5 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link 
              to="/cart" 
              className={`relative p-2 rounded-xl transition-all ${
                isScrolled || !isHome ? 'hover:bg-gray-100/60' : 'hover:bg-white/10'
              }`}
              title="Shopping Cart"
            >
              <svg className={`w-5 h-5 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Messages */}
            {isAuthenticated && (
              <Link 
                to="/messages" 
                className={`relative p-2 rounded-xl transition-all ${
                  isScrolled || !isHome ? 'hover:bg-gray-100/60' : 'hover:bg-white/10'
                }`}
                title="Messages"
              >
                <svg className={`w-5 h-5 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${
                    isScrolled || !isHome ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-xs">
                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={`hidden sm:inline text-sm font-medium ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`}>
                    {user?.first_name || 'Account'}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden py-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>👤</span> My Profile
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>❤️</span> My Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                      </Link>
                      <Link to="/referrals" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>🎁</span> Refer & Earn
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>📊</span> Vendor Dashboard
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <span>🛡️</span> Admin Panel
                        </Link>
                      )}
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>🛍️</span> My Orders
                      </Link>
                      <Link to="/create-shop" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>🏪</span> Create Shop
                      </Link>
                      <Link to="/subscription" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span>💳</span> Subscription
                      </Link>
                      <hr className="my-1 border-gray-100 dark:border-gray-800" />

                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                        <span>🚪</span> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isScrolled || !isHome ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                }`}>
                  Sign in
                </Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg transition-all">
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100/50 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg className={`w-6 h-6 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-800 overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 space-y-1">
              <Link to="/" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">Home</Link>
              <Link to="/explore/products" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">Explore</Link>
              <Link to="/blog" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">📰 Blog & Guides</Link>
              <Link to="/pricing" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">💳 Pricing</Link>
              <Link to="/referral-program" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">🎁 Referral Program</Link>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <Link to="/wishlist" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                  ❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
                <Link to="/cart" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                  🛒 Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
                {isAuthenticated && <Link to="/orders" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">🛍️ My Orders</Link>}
                {isSeller && <Link to="/dashboard" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">📊 Dashboard</Link>}
                {isAdmin && <Link to="/admin" className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">🛡️ Admin</Link>}
              </div>

              {/* Theme toggle on mobile */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 py-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200"
                >
                  <span>{darkMode ? '🌙 Dark' : '☀️ Light'}</span>
                </button>
              </div>

              {isAuthenticated && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 rounded-xl text-base font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                    🚪 Sign out
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <Link to="/login" className="block w-full text-center py-2.5 rounded-xl text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-semibold transition-colors">
                    Sign in
                  </Link>
                  <Link to="/signup" className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-md shadow-primary-500/20 hover:opacity-95 transition-all">
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
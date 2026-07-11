import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useUser()
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/30 group-hover:shadow-lg transition-all">
              M
            </div>
            <span className={`font-bold text-lg transition-colors ${isScrolled || !isHome ? 'text-gray-900' : 'text-white'}`}>
              Marketplace
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/explore/products', label: 'Explore' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? (isScrolled || !isHome ? 'bg-primary-50 text-primary-700' : 'bg-white/20 text-white')
                    : (isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10')
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isSeller && (
              <Link to="/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}>
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isScrolled || !isHome ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}>
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-xl transition-all hover:bg-gray-100/50">
              <svg className={`w-5 h-5 ${isScrolled || !isHome ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isScrolled || !isHome ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
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
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link to="/create-shop" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>🏪</span> Create Shop
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 transition-colors">
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
            className="md:hidden bg-white border-t border-gray-200/50 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-4 space-y-1">
              <Link to="/" className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Home</Link>
              <Link to="/explore/products" className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Explore</Link>
              {isSeller && <Link to="/dashboard" className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Dashboard</Link>}
              {isAdmin && <Link to="/admin" className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Admin</Link>}
              
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Link to="/login" className="block w-full text-center py-2.5 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition-colors">
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
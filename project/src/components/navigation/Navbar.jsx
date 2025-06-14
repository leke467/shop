import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useUser } from '../../context/UserContext'

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const { itemCount } = useCart()
  const { user, isAdmin, logout } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Close mobile menu when changing routes
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  const navbarClasses = `fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
    isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
  }`

  const linkClasses = 'text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
  const activeLinkClasses = 'text-primary-600 font-semibold'

  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className={navbarClasses}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <span className="text-2xl font-bold gradient-text">MultiShop</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={`${linkClasses} ${isLinkActive('/') ? activeLinkClasses : ''}`}>
              Home
            </Link>
            <Link to="/explore/products" className={`${linkClasses} ${isLinkActive('/explore') ? activeLinkClasses : ''}`}>
              Explore
            </Link>
            {user && (
              <Link to="/create-shop" className={`${linkClasses} ${isLinkActive('/create-shop') ? activeLinkClasses : ''}`}>
                Create Shop
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={`${linkClasses} ${isLinkActive('/admin') ? activeLinkClasses : ''}`}>
                Admin
              </Link>
            )}
          </div>

          {/* Cart & User Menu */}
          <div className="flex items-center">
            <Link to="/cart" className="relative p-2 mr-4 text-gray-700 hover:text-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary-600 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold focus:outline-none"
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Shop Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn-primary ml-4 hidden md:inline-flex">
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none ml-2"
            >
              <span className="sr-only">Open main menu</span>
              <svg 
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg 
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isMobileMenuOpen ? 1 : 0,
          height: isMobileMenuOpen ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/') ? activeLinkClasses : 'text-gray-700'}`}>
            Home
          </Link>
          <Link to="/explore/products" className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/explore') ? activeLinkClasses : 'text-gray-700'}`}>
            Explore
          </Link>
          {user && (
            <>
              <Link to="/create-shop" className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/create-shop') ? activeLinkClasses : 'text-gray-700'}`}>
                Create Shop
              </Link>
              <Link to="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/dashboard') ? activeLinkClasses : 'text-gray-700'}`}>
                Shop Dashboard
              </Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/admin') ? activeLinkClasses : 'text-gray-700'}`}>
              Admin
            </Link>
          )}
          {!user && (
            <button className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-primary-600">
              Sign In
            </button>
          )}
        </div>
      </motion.div>
    </nav>
  )
}

export default Navbar
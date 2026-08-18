import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import HSLogo from './HSLogo'
import HSCartButton from './HSCartButton'
import { useCart } from '../../../context/CartContext'

export default function HSNavbar({ shop, shopSlug }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { setIsCartOpen } = useCart()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setIsOpen(false)
  const base = shopSlug || shop?.slug || ''
  const basePath = base ? `/shop/${base}` : '/'

  const menuVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1, when: 'beforeChildren' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  }
  const itemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <nav className={`hs-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="hs-navbar-container">
        <Link to={basePath} className="hs-navbar-logo" onClick={closeMenu}>
          <HSLogo shop={shop} />
        </Link>

        <div className="hs-menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div className="hs-mobile-menu" variants={menuVariants} initial="initial" animate="animate" exit="exit">
              <motion.div variants={itemVariants}><NavLink to={basePath} end onClick={closeMenu}>Home</NavLink></motion.div>
              <motion.div variants={itemVariants}><NavLink to={`${basePath}/menu`} onClick={closeMenu}>Menu</NavLink></motion.div>
              <motion.div variants={itemVariants}><NavLink to={`${basePath}/about`} onClick={closeMenu}>About</NavLink></motion.div>
              <motion.div variants={itemVariants}><NavLink to={`${basePath}/contact`} onClick={closeMenu}>Contact</NavLink></motion.div>
              <motion.div variants={itemVariants}><NavLink to={`${basePath}/reviews`} onClick={closeMenu}>Reviews</NavLink></motion.div>
              <motion.div variants={itemVariants}>
                <Link to="/" className="hs-multishop-badge" onClick={closeMenu}>🛍️ MultiShop</Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <button className="hs-btn hs-btn-primary hs-order-btn" onClick={() => { closeMenu(); setIsCartOpen(true) }}>Order Now</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ul className="hs-nav-menu">
          <li><NavLink to={basePath} end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink></li>
          <li><NavLink to={`${basePath}/menu`} className={({isActive}) => isActive ? 'active' : ''}>Menu</NavLink></li>
          <li><NavLink to={`${basePath}/about`} className={({isActive}) => isActive ? 'active' : ''}>About</NavLink></li>
          <li><NavLink to={`${basePath}/contact`} className={({isActive}) => isActive ? 'active' : ''}>Contact</NavLink></li>
          <li><NavLink to={`${basePath}/reviews`} className={({isActive}) => isActive ? 'active' : ''}>Reviews</NavLink></li>
          <li><Link to="/" className="hs-multishop-badge" title="Return to MultiShop Marketplace">🛍️ MultiShop</Link></li>
          <li><HSCartButton /></li>
          <li><button className="hs-btn hs-btn-primary" onClick={() => setIsCartOpen(true)}>Order Now</button></li>
        </ul>
      </div>
    </nav>
  )
}

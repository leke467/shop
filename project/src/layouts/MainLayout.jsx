import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/navigation/Navbar'
import Footer from '../components/navigation/Footer'
import { useEffect } from 'react'
import { useShop, getTemplateShopCache } from '../context/ShopContext'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

const BUILTIN_ROUTES = new Set([
  '',
  'explore',
  'product',
  'create-shop',
  'dashboard',
  'messages',
  'orders',
  'pricing',
  'subscription',
  'admin',
  'referrals',
  'referral-program',
  'cart',
  'login',
  'signup',
  'forgot-password',
  'terms',
  'privacy',
  'refund',
  'profile',
  'wishlist',
  'shipping-guide',
  'blog',
])

function MainLayout() {
  const location = useLocation()
  const { activeTemplateShop, getShopBySlug } = useShop() || {}

  const firstSegment = (location.pathname.split('/')[1] || '').toLowerCase()
  const isExplicitShopRoute = location.pathname.startsWith('/shop/')
  const isDirectShopRoute = !isExplicitShopRoute && Boolean(firstSegment) && !BUILTIN_ROUTES.has(firstSegment)
  
  const isShopRoute = isExplicitShopRoute || isDirectShopRoute
  const shopSlugFromPath = isExplicitShopRoute ? location.pathname.split('/')[2] : (isDirectShopRoute ? firstSegment : null)
  
  const knownShop = shopSlugFromPath && getShopBySlug ? getShopBySlug(shopSlugFromPath) : null
  const cachedTemplateId = shopSlugFromPath ? getTemplateShopCache(shopSlugFromPath) : null

  const isTemplateActive = Boolean(
    isShopRoute && (activeTemplateShop?.template_id || knownShop?.template_id || cachedTemplateId)
  )

  const isPendingShopTemplate = Boolean(
    isShopRoute && activeTemplateShop === undefined && !knownShop && !cachedTemplateId
  )

  const hideMarketplaceNav = isTemplateActive || isPendingShopTemplate

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!hideMarketplaceNav && <Navbar />}
      <main className="flex-grow">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </main>
      {!hideMarketplaceNav && <Footer />}
    </div>
  )
}

export default MainLayout
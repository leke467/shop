import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import ShopCreationPage from './pages/ShopCreationPage'
import ShopDashboard from './pages/ShopDashboard'
import PricingPage from './pages/PricingPage'
import SubscriptionDashboard from './pages/SubscriptionDashboard'
import AdminPanel from './pages/AdminPanel'

import OrdersPage from './pages/OrdersPage'

import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPassword from './pages/ForgotPassword'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import RefundPage from './pages/RefundPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import ShippingGuidePage from './pages/ShippingGuidePage'
import BlogListPage from './pages/BlogListPage'
import ReferralDashboard from './pages/ReferralDashboard'

// Context
import { ShopProvider } from './context/ShopContext'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <UserProvider>
          <ShopProvider>
          <CartProvider>
            <AnimatePresence mode="wait">
              <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="explore/:exploreType" element={<ExplorePage />} />
                <Route path="shop/:shopSlug" element={<ShopPage />} />
                <Route path="product/:productSlug" element={<ProductPage />} />
                <Route path="create-shop" element={<ShopCreationPage />} />
                <Route path="dashboard" element={<ShopDashboard />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="subscription" element={<SubscriptionDashboard />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="admin/dashboard" element={<AdminPanel />} />
                <Route path="referrals" element={<ReferralDashboard />} />

                <Route path="cart" element={<CartPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="signup" element={<SignUpPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="refund" element={<RefundPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="shipping-guide" element={<ShippingGuidePage />} />
                <Route path="blog" element={<BlogListPage />} />
                <Route path="blog/:slug" element={<BlogPostPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </CartProvider>
        </ShopProvider>
      </UserProvider>
    </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
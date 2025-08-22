import { useState } from 'react'
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
import AdminPanel from './pages/AdminPanel'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import NotFoundPage from './pages/NotFoundPage'

// Context
import { ShopProvider } from './context/ShopContext'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'

function App() {
  return (
    <UserProvider>
      <ShopProvider>
        <CartProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="explore/products" element={<ExplorePage />} />
                <Route path="shop/:shopId" element={<ShopPage />} />
                <Route path="product/:productId" element={<ProductPage />} />
                <Route path="create-shop" element={<ShopCreationPage />} />
                <Route path="dashboard" element={<ShopDashboard />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignUpPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </CartProvider>
      </ShopProvider>
    </UserProvider>
  )
}

export default App
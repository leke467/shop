import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HSNavbar from './components/HSNavbar'
import HSCart from './components/HSCart'
import HSFooter from './components/HSFooter'
import HSHome from './pages/HSHome'
import HSMenu from './pages/HSMenu'
import HSAbout from './pages/HSAbout'
import HSContact from './pages/HSContact'
import HSCheckout from './pages/HSCheckout'
import HSReviews from './pages/HSReviews'
import './styles/honeyspicy.css'

export default function HoneySpicyApp({ shop, products, reviews, shopSlug }) {
  const location = useLocation()
  const extra = shop?.theme?.extra_tokens || {}
  const fontChoice = extra.font_family || extra.heading_font || ''

  useEffect(() => {
    if (fontChoice && !['inherit', 'sans-serif', 'serif'].includes(fontChoice)) {
      const cleanFont = fontChoice.split(',')[0].replace(/['"]/g, '').trim()
      const fontId = `custom-font-${cleanFont.replace(/\s+/g, '-')}`
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link')
        link.id = fontId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFont)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [fontChoice])

  const dynamicStyles = {
    '--hs-color-honey': extra.primary_color || shop?.theme?.primary_color || '#E5A43B',
    '--hs-color-text': extra.text_color || shop?.theme?.text_color || '#2B1F0C',
    '--hs-color-background': extra.background_color || shop?.theme?.background_color || '#FFFDF9',
    '--hs-color-features-bg': extra.banner_color || '#E5A43B',
    ...(fontChoice ? { fontFamily: `"${fontChoice}", var(--hs-font-family, sans-serif)` } : {}),
    backgroundColor: extra.background_color || shop?.theme?.background_color || '#FFFDF9',
    color: extra.text_color || shop?.theme?.text_color || '#2B1F0C',
  }

  const baseSlug = shopSlug || shop?.slug || ''

  return (
    <div className="hs-template" style={dynamicStyles}>
      <HSNavbar shop={shop} shopSlug={baseSlug} />
      <HSCart shop={shop} shopSlug={baseSlug} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route index element={<HSHome shop={shop} products={products} reviews={reviews} shopSlug={baseSlug} />} />
          <Route path="catalog" element={<HSMenu shop={shop} products={products} shopSlug={baseSlug} />} />
          <Route path="menu" element={<HSMenu shop={shop} products={products} shopSlug={baseSlug} />} />
          <Route path="about" element={<HSAbout shop={shop} products={products} />} />
          <Route path="contact" element={<HSContact shop={shop} />} />
          <Route path="reviews" element={<HSReviews shop={shop} reviews={reviews} shopSlug={baseSlug} />} />
          <Route path="checkout" element={<HSCheckout shop={shop} shopSlug={baseSlug} />} />
          <Route path="*" element={<HSHome shop={shop} products={products} reviews={reviews} shopSlug={baseSlug} />} />
        </Routes>
      </AnimatePresence>
      <HSFooter shop={shop} shopSlug={baseSlug} />
    </div>
  )
}

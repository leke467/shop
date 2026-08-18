import { Routes, Route } from 'react-router-dom'
import ObsidianNavbar from './components/ObsidianNavbar'
import ObsidianFooter from './components/ObsidianFooter'
import ObsidianCart from './components/ObsidianCart'
import TemplateReviewsView from '../../components/shop/TemplateReviewsView'

import ObsidianHome from './pages/ObsidianHome'
import ObsidianCatalogPage from './pages/ObsidianCatalogPage'
import ObsidianAboutPage from './pages/ObsidianAboutPage'
import ObsidianContactPage from './pages/ObsidianContactPage'
import ObsidianCheckout from './pages/ObsidianCheckout'

import './styles/obsidian.css'

export default function ObsidianApp({ shop, products = [], reviews = [], shopSlug }) {
  const baseSlug = shopSlug || shop?.slug || ''

  return (
    <div className="obsidian-template">
      <ObsidianNavbar shop={shop} shopSlug={baseSlug} />
      <ObsidianCart shop={shop} shopSlug={baseSlug} />

      <Routes>
        <Route index element={<ObsidianHome shop={shop} products={products} shopSlug={baseSlug} />} />
        <Route path="catalog" element={<ObsidianCatalogPage shop={shop} products={products} shopSlug={baseSlug} />} />
        <Route path="menu" element={<ObsidianCatalogPage shop={shop} products={products} shopSlug={baseSlug} />} />
        <Route path="reviews" element={<TemplateReviewsView reviews={reviews} shop={shop} shopSlug={baseSlug} theme="obsidian" />} />
        <Route path="about" element={<ObsidianAboutPage shop={shop} products={products} shopSlug={baseSlug} />} />
        <Route path="contact" element={<ObsidianContactPage shop={shop} products={products} shopSlug={baseSlug} />} />
        <Route path="checkout" element={<ObsidianCheckout shop={shop} shopSlug={baseSlug} />} />
        <Route path="*" element={<ObsidianHome shop={shop} products={products} shopSlug={baseSlug} />} />
      </Routes>

      <ObsidianFooter shop={shop} shopSlug={baseSlug} />
    </div>
  )
}

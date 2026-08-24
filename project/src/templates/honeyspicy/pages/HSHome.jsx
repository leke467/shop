import { useState } from 'react'
import HSPageTransition from '../components/HSPageTransition'
import HSHeroSection from '../components/HSHeroSection'
import HSFeaturedProducts from '../components/HSFeaturedProducts'
import HSAboutSection from '../components/HSAboutSection'
import HSTestimonialsSection from '../components/HSTestimonialsSection'
import HSQuickViewModal from '../components/HSQuickViewModal'

export default function HSHome({ shop, products, reviews, shopSlug }) {
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <HSPageTransition>
      <main>
        <HSHeroSection shop={shop} products={products} shopSlug={shopSlug} />
        <HSFeaturedProducts shop={shop} products={products} shopSlug={shopSlug} onQuickView={setQuickViewProduct} />
        <HSAboutSection shop={shop} products={products} />
        <HSTestimonialsSection reviews={reviews} />
        {quickViewProduct && (
          <HSQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        )}
      </main>
    </HSPageTransition>
  )
}

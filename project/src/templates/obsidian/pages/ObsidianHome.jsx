import { useState } from 'react'
import ObsidianHero from '../components/ObsidianHero'
import ObsidianCatalog from '../components/ObsidianCatalog'
import ObsidianFeatures from '../components/ObsidianFeatures'
import ObsidianQuickViewModal from '../components/ObsidianQuickViewModal'

export default function ObsidianHome({ shop, products, shopSlug }) {
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <div>
      <ObsidianHero shop={shop} shopSlug={shopSlug} />
      <ObsidianFeatures shop={shop} />
      <ObsidianCatalog products={products} shop={shop} onQuickView={setQuickViewProduct} />

      {quickViewProduct && (
        <ObsidianQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  )
}

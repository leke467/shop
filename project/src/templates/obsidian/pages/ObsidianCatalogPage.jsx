import { useState } from 'react'
import ObsidianCatalog from '../components/ObsidianCatalog'
import ObsidianQuickViewModal from '../components/ObsidianQuickViewModal'

export default function ObsidianCatalogPage({ shop, products, shopSlug }) {
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <div className="pt-8 pb-16">
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

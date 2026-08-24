import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import HSPageTransition from '../components/HSPageTransition'
import HSAnimatedSection from '../components/HSAnimatedSection'
import HSQuickViewModal from '../components/HSQuickViewModal'
import { getImageUrl, handleImageError } from '../../../services/api'

export default function HSMenu({ shop, products = [], shopSlug }) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const { addToCart } = useCart()

  const extra = shop?.theme?.extra_tokens || {}
  const menuTitle = extra.categories_title || extra.honeyspicy_categories_title || 'Our Menu'
  const menuSubtitle = extra.categories_subtitle || extra.honeyspicy_categories_subtitle || 'Discover our delicious gourmet selection made with love'

  const categories = useMemo(() => {
    const cats = new Set((products || []).map(p => p.category_name || p.category || 'Other'))
    return ['All', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    let list = (products || []).filter(p => {
      const matchCat = activeCategory === 'All' || (p.category_name || p.category || 'Other') === activeCategory
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

    if (sort === 'low') {
      list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    } else if (sort === 'high') {
      list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    }

    return list
  }, [products, activeCategory, search, sort])

  return (
    <HSPageTransition>
      <main className="hs-menu-page">
        <section className="hs-menu-hero">
          <div className="hs-container">
            <HSAnimatedSection>
              <h1>{menuTitle}</h1>
              <p>{menuSubtitle}</p>
            </HSAnimatedSection>
          </div>
        </section>

        <section className="hs-menu-content hs-section">
          <div className="hs-container">
            {/* Search & Sort Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '400px' }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search treats..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: '50px',
                    border: '1.5px solid rgba(229, 164, 59, 0.4)',
                    backgroundColor: '#FFFDF9',
                    color: '#2B1F0C',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Sort By:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '50px',
                    border: '1.5px solid rgba(229, 164, 59, 0.4)',
                    backgroundColor: '#FFFDF9',
                    color: '#2B1F0C',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="default">Featured</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <HSAnimatedSection>
              <div className="hs-menu-categories">
                {categories.map(cat => (
                  <motion.button
                    key={cat}
                    className={`hs-category-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </HSAnimatedSection>

            {/* Products Grid */}
            <div className="hs-menu-grid">
              {filtered.map((product, index) => {
                const img = product.primary_image || product.image || (product.images?.[0]?.medium || product.images?.[0]?.image)
                const imgUrl = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
                const price = Number(product.base_price || product.price || 0)

                return (
                  <HSAnimatedSection key={product.public_id || product.id} delay={0.05 * (index % 6)}>
                    <motion.div className="hs-menu-item" whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                      <div className="hs-menu-item-image" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setQuickViewProduct(product)}>
                        {imgUrl ? <img src={imgUrl} alt={product.name} onError={(e) => handleImageError(e, 'product')} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>}
                        <div className="hs-menu-item-tag">{product.category_name || product.category || 'Other'}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 253, 249, 0.9)',
                            border: '1px solid rgba(229, 164, 59, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                          title="Quick View"
                        >
                          👁️
                        </button>
                      </div>
                      <div className="hs-menu-item-info">
                        <h3 onClick={() => setQuickViewProduct(product)} style={{ cursor: 'pointer' }}>{product.name}</h3>
                        <p>{product.description?.substring(0, 100) || ''}{product.description?.length > 100 ? '...' : ''}</p>
                        <div className="hs-menu-item-footer">
                          <span className="hs-menu-item-price">₦{price.toLocaleString()}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="hs-btn hs-btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setQuickViewProduct(product)}>Quick View</button>
                            <button className="hs-btn hs-btn-primary" onClick={() => addToCart(product)}>Add to Cart</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </HSAnimatedSection>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <p style={{ color: '#666', marginTop: '1rem' }}>No products found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        {quickViewProduct && (
          <HSQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        )}
      </main>
    </HSPageTransition>
  )
}

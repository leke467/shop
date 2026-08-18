import { motion } from 'framer-motion'
import HSAnimatedSection from './HSAnimatedSection'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function HSFeaturedProducts({ products, shopSlug, onQuickView }) {
  const { addToCart } = useCart()
  const featured = (products || []).slice(0, 6)

  return (
    <section className="hs-featured hs-section">
      <div className="hs-container">
        <HSAnimatedSection>
          <div className="hs-section-header">
            <h2>Our Signature Treats</h2>
            <p>Explore our most popular and delicious creations</p>
          </div>
        </HSAnimatedSection>

        {featured.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📦</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>No products listed in this shop yet.</p>
            <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>Products added by the seller will appear right here.</p>
          </div>
        ) : (
          <div className="hs-featured-grid">
            {featured.map((product, index) => {
              const img = product.primary_image || product.image || (product.images?.[0]?.medium || product.images?.[0]?.image)
              const imgUrl = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
              return (
                <HSAnimatedSection key={product.public_id || product.id} delay={0.1 * index}>
                  <motion.div className="hs-product-card" whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                    <div className="hs-product-image" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => onQuickView && onQuickView(product)}>
                      {imgUrl ? <img src={imgUrl} alt={product.name} /> : <div className="hs-product-placeholder">📦</div>}
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(product); }}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 32,
                          height: 32,
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
                    <div className="hs-product-info">
                      <h3 onClick={() => onQuickView && onQuickView(product)} style={{ cursor: 'pointer' }}>{product.name}</h3>
                      <p>{product.description?.substring(0, 80) || ''}{product.description?.length > 80 ? '...' : ''}</p>
                      <div className="hs-product-footer">
                        <span className="hs-product-price">₦{Number(product.base_price || product.price || 0).toLocaleString()}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="hs-btn hs-btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onQuickView && onQuickView(product)}>Quick View</button>
                          <button className="hs-btn hs-btn-primary" onClick={() => addToCart(product)}>Add to Cart</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </HSAnimatedSection>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

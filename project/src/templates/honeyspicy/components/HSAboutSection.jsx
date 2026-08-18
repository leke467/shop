import HSAnimatedSection from './HSAnimatedSection'
import { getImageUrl } from '../../../services/api'

export default function HSAboutSection({ shop, products }) {
  const extra = shop?.theme?.extra_tokens || {}
  const aboutTitle = extra.about_title || 'Our Story'
  const aboutText = extra.about_text || shop?.description || 'We believe in creating exceptional products with love, quality ingredients, and attention to detail.'

  const images = (products || []).slice(0, 4).map(p => {
    const img = p.primary_image || p.image || (p.images?.[0]?.medium || p.images?.[0]?.image)
    return img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  }).filter(Boolean)

  return (
    <section className="hs-about-section hs-section">
      <div className="hs-container">
        <div className="hs-about-content">
          <div className="hs-about-text">
            <HSAnimatedSection>
              <h2>{aboutTitle}</h2>
              <p className="hs-highlight-text">{shop?.tagline || 'Crafting moments of joy'}</p>
              <p>{aboutText}</p>
              <ul className="hs-about-features">
                <li><span className="hs-icon">🍯</span><span>Premium Quality</span></li>
                <li><span className="hs-icon">❤️</span><span>Made with Love</span></li>
                <li><span className="hs-icon">🚀</span><span>Fast Delivery</span></li>
              </ul>
            </HSAnimatedSection>
          </div>
          <HSAnimatedSection direction="right" delay={0.3}>
            <div className="hs-about-images">
              {images.map((img, i) => (
                <div key={i} className={`hs-about-img hs-about-img-${i + 1}`}>
                  <img src={img} alt="Product" />
                </div>
              ))}
            </div>
          </HSAnimatedSection>
        </div>
      </div>
    </section>
  )
}

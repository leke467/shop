import HSPageTransition from '../components/HSPageTransition'
import HSAnimatedSection from '../components/HSAnimatedSection'
import { getImageUrl } from '../../../services/api'

export default function HSAbout({ shop, products }) {
  const extra = shop?.theme?.extra_tokens || {}

  const heroTitle = extra.about_hero_title || 'Our Story'
  const heroSubtitle = extra.about_hero_subtitle || 'Learn about our journey and passion'

  const missionTitle = extra.about_mission_title || 'Our Mission'
  const missionHighlight = extra.about_mission_highlight || shop?.tagline || 'Creating exceptional experiences through quality and passion.'
  const missionText = extra.about_text || shop?.description || 'We are dedicated to delivering the finest products, crafted with care and attention to detail.'

  const value1Title = extra.value1_title || 'Quality First'
  const value1Desc = extra.value1_desc || 'We never compromise on the quality of our products.'

  const value2Title = extra.value2_title || 'Customer Love'
  const value2Desc = extra.value2_desc || 'Every interaction is an opportunity to create a memorable experience.'

  const value3Title = extra.value3_title || 'Sustainability'
  const value3Desc = extra.value3_desc || 'Committed to sustainable practices in everything we do.'

  const value4Title = extra.value4_title || 'Community'
  const value4Desc = extra.value4_desc || 'We believe in giving back and supporting our local community.'

  const mainImage = (() => { const p = (products || [])[0]; if (!p) return null; const img = p.primary_image || p.image || (p.images?.[0]?.medium || p.images?.[0]?.image); return img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null })()

  return (
    <HSPageTransition>
      <main className="hs-about-page">
        <section className="hs-about-hero"><div className="hs-container"><HSAnimatedSection><h1>{heroTitle}</h1><p>{heroSubtitle}</p></HSAnimatedSection></div></section>
        <section className="hs-about-mission hs-section">
          <div className="hs-container">
            <div className="hs-mission-content">
              <HSAnimatedSection direction="left"><div className="hs-mission-text"><h2>{missionTitle}</h2><p className="hs-highlight-text">{missionHighlight}</p><p>{missionText}</p></div></HSAnimatedSection>
              <HSAnimatedSection direction="right" delay={0.3}><div className="hs-mission-image">{mainImage ? <img src={mainImage} alt={shop?.name || 'About'} /> : <div style={{height:'300px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem',background:'#f9f5f0',borderRadius:'16px'}}>🏪</div>}</div></HSAnimatedSection>
            </div>
          </div>
        </section>
        <section className="hs-about-values hs-section">
          <div className="hs-container">
            <HSAnimatedSection><div className="hs-section-header"><h2>Our Values</h2><p>The principles that guide everything we do</p></div></HSAnimatedSection>
            <div className="hs-values-grid">
              {[
                { icon: '🎯', title: value1Title, desc: value1Desc },
                { icon: '❤️', title: value2Title, desc: value2Desc },
                { icon: '🌱', title: value3Title, desc: value3Desc },
                { icon: '🤝', title: value4Title, desc: value4Desc },
              ].map((v, i) => (
                <HSAnimatedSection key={i} delay={0.1 * (i + 1)}><div className="hs-value-card"><div className="hs-value-icon">{v.icon}</div><h3>{v.title}</h3><p>{v.desc}</p></div></HSAnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </main>
    </HSPageTransition>
  )
}

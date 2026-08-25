import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function HSHeroSection({ shop, products, shopSlug }) {
  const navigate = useNavigate()
  const { setIsCartOpen } = useCart()

  const extra = shop?.theme?.extra_tokens || {}

  const heroHeadline = extra.hero_headline || shop?.name || 'Our Shop'
  const heroSubtitle = extra.hero_subtitle || shop?.tagline || shop?.description || 'Discover our amazing products crafted with love and passion!'
  const ctaPrimary = extra.hero_cta_primary || 'Order Now'
  const ctaSecondary = extra.hero_cta_secondary || 'View Menu'

  const bannerColor = extra.banner_color || '#E5A43B'
  const feature1Title = extra.feature1_title || 'Fresh Daily'
  const feature1Desc = extra.feature1_desc || 'All of our treats are made fresh every day'
  const feature2Title = extra.feature2_title || 'Quality Ingredients'
  const feature2Desc = extra.feature2_desc || 'We use only the finest ingredients'
  const feature3Title = extra.feature3_title || 'Fast Delivery'
  const feature3Desc = extra.feature3_desc || 'Doorstep delivery within 30 minutes'

  // 3 Hero Showcase Images pulled directly from Template Manage section (extra_tokens)
  const heroImg1 = extra.hero_image_1
    ? getImageUrl(extra.hero_image_1)
    : 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'

  const heroImg2 = extra.hero_image_2
    ? getImageUrl(extra.hero_image_2)
    : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'

  const heroImg3 = extra.hero_image_3
    ? getImageUrl(extra.hero_image_3)
    : 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }
  const welcomePrefix = extra.hero_welcome_prefix !== undefined ? extra.hero_welcome_prefix : 'Welcome to'
  const bannerImage = extra.banner_url !== undefined ? extra.banner_url : (shop?.banner || '')

  return (
    <section 
      className="hs-hero"
      style={bannerImage ? {
        backgroundImage: `linear-gradient(rgba(255, 253, 249, 0.90), rgba(255, 253, 249, 0.94)), url(${getImageUrl(bannerImage)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      <div className="hs-hero-content hs-container">
        <div className="hs-hero-text">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.99] }}
          >
            {welcomePrefix ? <>{welcomePrefix} </> : null}
            <span className="hs-highlight">{heroHeadline}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.6, 0.05, 0.01, 0.99] }}
          >
            {heroSubtitle}
          </motion.p>

          <motion.div
            className="hs-hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.6, 0.05, 0.01, 0.99] }}
          >
            <button className="hs-btn hs-btn-primary" onClick={() => setIsCartOpen(true)}>
              {ctaPrimary}
            </button>
            <button className="hs-btn hs-btn-secondary" onClick={() => navigate(`/shop/${shopSlug || shop?.slug || ''}/menu`)}>
              {ctaSecondary}
            </button>
          </motion.div>
        </div>

        <motion.div
          className="hs-hero-image"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.div
            className="hs-floating-item hs-float-1"
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <img
              src={heroImg1}
              alt=""
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
              }}
            />
          </motion.div>

          <motion.div
            className="hs-floating-item hs-float-2"
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
          >
            <img
              src={heroImg2}
              alt=""
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
              }}
            />
          </motion.div>

          <motion.div
            className="hs-floating-item hs-float-3"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 1 }}
          >
            <img
              src={heroImg3}
              alt=""
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80'
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="hs-hero-features" style={{ backgroundColor: bannerColor }}>
        <motion.div className="hs-container" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.div className="hs-feature" variants={itemVariants}><h3>{feature1Title}</h3><p>{feature1Desc}</p></motion.div>
          <motion.div className="hs-feature" variants={itemVariants}><h3>{feature2Title}</h3><p>{feature2Desc}</p></motion.div>
          <motion.div className="hs-feature" variants={itemVariants}><h3>{feature3Title}</h3><p>{feature3Desc}</p></motion.div>
        </motion.div>
      </div>
    </section>
  )
}

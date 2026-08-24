import { motion } from 'framer-motion'
import BrandLogoRenderer from '../../../components/shop/BrandLogoRenderer'

export default function HSLogo({ shop }) {
  const extra = shop?.theme?.extra_tokens || {}
  const primaryColor = extra.primary_color || '#E5A43B'

  return (
    <motion.div
      className="hs-logo"
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    >
      <BrandLogoRenderer
        shop={shop}
        accentColor={primaryColor}
        textClassName="hs-logo-name"
        logoClassName="hs-logo-img"
        fallbackIcon={<span className="hs-logo-text">{shop?.name?.[0] || '🍯'}</span>}
      />
    </motion.div>
  )
}

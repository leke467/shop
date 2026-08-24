import { motion } from 'framer-motion'
import { getImageUrl } from '../../../services/api'

export default function HSLogo({ shop }) {
  const logoSrc = shop?.logo || shop?.theme?.extra_tokens?.logo_url

  return (
    <motion.div
      className="hs-logo"
      whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
    >
      {logoSrc ? (
        <img src={getImageUrl(logoSrc)} alt={shop?.name || 'Shop'} className="hs-logo-img" />
      ) : (
        <span className="hs-logo-text">{shop?.name?.[0] || '🍯'}</span>
      )}
      <span className="hs-logo-name">{shop?.name || 'Shop'}</span>
    </motion.div>
  )
}

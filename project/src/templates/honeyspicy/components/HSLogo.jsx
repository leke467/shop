import { motion } from 'framer-motion'
import { getImageUrl } from '../../../services/api'

export default function HSLogo({ shop }) {
  return (
    <motion.div
      className="hs-logo"
      whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
    >
      {shop?.logo ? (
        <img src={getImageUrl(shop.logo)} alt={shop?.name || 'Shop'} className="hs-logo-img" />
      ) : (
        <span className="hs-logo-text">{shop?.name?.[0] || '🍯'}</span>
      )}
      <span className="hs-logo-name">{shop?.name || 'Shop'}</span>
    </motion.div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../../context/CartContext'

export default function HSCartButton() {
  const { getCartItemsCount, itemCount, setIsCartOpen } = useCart() || {}
  const count = typeof getCartItemsCount === 'function' ? getCartItemsCount() : (itemCount || 0)
  return (
    <motion.button
      className="hs-cart-button"
      onClick={() => setIsCartOpen(true)}
      whileTap={{ scale: 0.9 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            className="hs-cart-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            key={count}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const directions = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
}

export default function HSAnimatedSection({ children, direction = 'up', delay = 0, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const d = directions[direction] || directions.up
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...d }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...d }}
      transition={{ duration: 0.6, delay, ease: [0.6, 0.05, 0.01, 0.99] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

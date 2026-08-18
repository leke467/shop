import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HSAnimatedSection from './HSAnimatedSection'

export default function HSTestimonialsSection({ reviews }) {
  const [current, setCurrent] = useState(0)
  const testimonials = (reviews || []).filter(r => r.comment)

  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <section className="hs-testimonials hs-section">
      <div className="hs-container">
        <HSAnimatedSection>
          <div className="hs-section-header">
            <h2>What Our Customers Say</h2>
            <p>Don&apos;t just take our word for it</p>
          </div>
        </HSAnimatedSection>
        <div className="hs-testimonial-carousel">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className="hs-testimonial-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hs-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < (testimonials[current]?.rating || 5) ? 'hs-star-filled' : 'hs-star-empty'}>★</span>
                ))}
              </div>
              <p className="hs-testimonial-text">"{testimonials[current]?.comment}"</p>
              <div className="hs-testimonial-author">
                <div className="hs-testimonial-avatar">
                  {testimonials[current]?.user_email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4>{testimonials[current]?.user_email?.split('@')[0] || 'Customer'}</h4>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          {testimonials.length > 1 && (
            <div className="hs-testimonial-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`hs-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

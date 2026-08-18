import { useState } from 'react'
import { motion } from 'framer-motion'

export default function HSReviewForm({ shop, onSubmit }) {
  const [formData, setFormData] = useState({ rating: 5, comment: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(formData)
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setFormData({ rating: 5, comment: '' }) }, 3000)
  }

  if (submitted) {
    return (
      <motion.div className="hs-form-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <span className="hs-success-icon">✓</span>
        <h3>Review Submitted!</h3>
        <p>Thank you for your feedback.</p>
      </motion.div>
    )
  }

  return (
    <form className="hs-review-form" onSubmit={handleSubmit}>
      <div className="hs-star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`hs-star-btn ${star <= formData.rating ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
          >
            ★
          </button>
        ))}
      </div>
      <div className="hs-form-group">
        <textarea
          name="comment"
          placeholder="Share your experience..."
          rows="4"
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          required
        />
      </div>
      <motion.button type="submit" className="hs-btn hs-btn-primary" whileTap={{ scale: 0.95 }}>
        Submit Review
      </motion.button>
    </form>
  )
}

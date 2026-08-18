import { useState } from 'react'
import { motion } from 'framer-motion'
import { messagingAPI } from '../../../services/api'

export default function HSContactForm({ shop }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!shop?.slug) {
      setError('Store details missing. Please refresh and try again.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await messagingAPI.sendContactInquiry({
        shop_slug: shop.slug,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', phone: '', message: '' })
      }, 5000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send message. Please check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  if (submitted) {
    return (
      <motion.div className="hs-form-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <span className="hs-success-icon">✓</span>
        <h3>Message Delivered!</h3>
        <p>Your inquiry has been sent directly to the store owner&apos;s dashboard & email.</p>
      </motion.div>
    )
  }

  return (
    <form className="hs-contact-form" onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      <div className="hs-form-group">
        <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="hs-form-row">
        <div className="hs-form-group">
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="hs-form-group">
          <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
        </div>
      </div>
      <div className="hs-form-group">
        <textarea name="message" placeholder="Your Message" rows="5" value={formData.message} onChange={handleChange} required />
      </div>
      <motion.button type="submit" className="hs-btn hs-btn-primary" disabled={submitting} whileTap={{ scale: 0.95 }}>
        {submitting ? 'Sending Message...' : 'Send Message'}
      </motion.button>
    </form>
  )
}

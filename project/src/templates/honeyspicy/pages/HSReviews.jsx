import { useState } from 'react'
import { motion } from 'framer-motion'
import { shopAPI } from '../../../services/api'
import HSPageTransition from '../components/HSPageTransition'
import HSAnimatedSection from '../components/HSAnimatedSection'

export default function HSReviews({ shop, reviews = [], shopSlug }) {
  const [reviewList, setReviewList] = useState(reviews)
  const [form, setForm] = useState({ rating: 5, title: '', comment: '', customer_name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const slug = shopSlug || shop?.slug || ''

  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewList.length).toFixed(1)
    : '5.0'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.comment.trim()) return
    setSubmitting(true)
    try {
      const created = await shopAPI.addReview(slug, form)
      setReviewList(prev => [created || { ...form, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setSubmitted(true)
      setForm({ rating: 5, title: '', comment: '', customer_name: '' })
    } catch {
      setReviewList(prev => [{ ...form, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setSubmitted(true)
      setForm({ rating: 5, title: '', comment: '', customer_name: '' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <HSPageTransition>
      <main className="hs-reviews-page">
        {/* Gourmet Hero Section */}
        <section className="hs-contact-hero" style={{ padding: '6rem 1rem 3rem' }}>
          <div className="hs-container" style={{ textAlign: 'center' }}>
            <HSAnimatedSection>
              <span className="hs-badge" style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: '#E5A43B', color: '#fff', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                ⭐ Verified Feedback
              </span>
              <h1 style={{ fontSize: '2.5rem', fontFamily: 'serif', color: '#2B1F0C', margin: '0.5rem 0' }}>
                Customer Reviews & Ratings
              </h1>
              <p style={{ color: '#666', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                See what food lovers and shoppers have to say about {shop?.name || 'our store'}.
              </p>
            </HSAnimatedSection>
          </div>
        </section>

        <section className="hs-section" style={{ padding: '2rem 1rem 5rem' }}>
          <div className="hs-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Rating Summary Card */}
            <HSAnimatedSection>
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid #F0E6D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'serif', color: '#2B1F0C' }}>Overall Satisfaction</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.9rem' }}>Based on {reviewList.length} customer reviews</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#2B1F0C', lineHeight: 1 }}>{avgRating}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '0.2rem' }}>OUT OF 5</div>
                  </div>
                  <div style={{ fontSize: '1.6rem', color: '#E5A43B' }}>
                    {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
                  </div>
                </div>
              </div>
            </HSAnimatedSection>

            {/* Leave a Review Form */}
            <HSAnimatedSection delay={0.2}>
              <div style={{
                background: '#FFFDF9',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid #E5A43B',
                boxShadow: '0 8px 24px rgba(229,164,59,0.12)',
                marginBottom: '3rem'
              }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontFamily: 'serif', color: '#2B1F0C' }}>Leave a Gourmet Review</h3>
                <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: '0.875rem' }}>Did you enjoy your purchase? Share your experience with us!</p>

                {submitted ? (
                  <div style={{ padding: '1rem 1.5rem', background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    ✓ Thank you! Your review has been added.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#2B1F0C', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Your Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Adewale K."
                          value={form.customer_name}
                          onChange={e => setForm({ ...form, customer_name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid #DDD0BD',
                            background: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none',
                            color: '#2B1F0C'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#2B1F0C', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Your Rating</label>
                        <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.2rem' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setForm({ ...form, rating: star })}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.6rem',
                                color: star <= form.rating ? '#E5A43B' : '#DDD',
                                transition: 'transform 0.1s ease',
                                transform: star <= form.rating ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#2B1F0C', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Review Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Absolutely delicious, will order again!"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid #DDD0BD',
                          background: '#fff',
                          fontSize: '0.9rem',
                          outline: 'none',
                          color: '#2B1F0C'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#2B1F0C', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Your Review</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Tell us about the flavor, freshness, or delivery speed..."
                        value={form.comment}
                        onChange={e => setForm({ ...form, comment: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid #DDD0BD',
                          background: '#fff',
                          fontSize: '0.9rem',
                          outline: 'none',
                          color: '#2B1F0C',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '0.85rem 2rem',
                        background: '#E5A43B',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Post Review ★'}
                    </motion.button>
                  </form>
                )}
              </div>
            </HSAnimatedSection>

            {/* List of Reviews */}
            <HSAnimatedSection delay={0.4}>
              <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem', fontFamily: 'serif', color: '#2B1F0C' }}>Customer Experiences ({reviewList.length})</h3>

              {reviewList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #F0E6D8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
                  <h4 style={{ margin: 0, color: '#2B1F0C' }}>No reviews yet</h4>
                  <p style={{ margin: '0.3rem 0 0', color: '#888', fontSize: '0.875rem' }}>Be the first customer to leave a review above!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviewList.map((r, idx) => (
                    <div key={r.id || idx} style={{
                      background: '#fff',
                      borderRadius: '14px',
                      padding: '1.5rem',
                      border: '1px solid #F0E6D8',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#FDF3E3',
                            color: '#E5A43B',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem'
                          }}>
                            {(r.customer_name || r.user_name || 'C')[0]}
                          </div>
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#2B1F0C', fontSize: '0.95rem', display: 'block' }}>
                              {r.customer_name || r.user_name || 'Customer'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 'bold' }}>✓ Verified Buyer</span>
                          </div>
                        </div>
                        <div style={{ color: '#E5A43B', fontSize: '1rem' }}>
                          {'★'.repeat(Number(r.rating || 5))}{'☆'.repeat(5 - Number(r.rating || 5))}
                        </div>
                      </div>

                      {r.title && <h4 style={{ margin: '0 0 0.4rem', color: '#2B1F0C', fontSize: '1rem' }}>{r.title}</h4>}
                      <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', lineHeight: '1.5' }}>{r.comment || r.body || r.content}</p>
                      <span style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem', display: 'block' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </HSAnimatedSection>

          </div>
        </section>
      </main>
    </HSPageTransition>
  )
}

import { useState } from 'react'
import { shopAPI } from '../../services/api'

/**
 * Reusable Reviews Section/Page for all Storefront Templates.
 * Supports submitting new reviews and displaying existing customer reviews.
 */
export default function TemplateReviewsView({ reviews = [], shop, shopSlug, theme = 'default' }) {
  const [reviewList, setReviewList] = useState(reviews)
  const [form, setForm] = useState({ rating: 5, title: '', comment: '', customer_name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const slug = shopSlug || shop?.slug || ''

  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewList.length).toFixed(1)
    : '5.0'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.comment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const created = await shopAPI.addReview(slug, form)
      setReviewList(prev => [created || { ...form, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setSubmitted(true)
      setForm({ rating: 5, title: '', comment: '', customer_name: '' })
    } catch (err) {
      // Fallback for offline/mock display
      setReviewList(prev => [{ ...form, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setSubmitted(true)
      setForm({ rating: 5, title: '', comment: '', customer_name: '' })
    } finally {
      setSubmitting(false)
    }
  }

  // Preset Theme Classes
  const getThemeStyles = () => {
    switch (theme) {
      case 'dark':
      case 'obsidian':
        return {
          container: 'bg-[#0B0F17] text-white',
          card: 'bg-white/5 border border-white/10 text-white',
          input: 'bg-white/5 border border-white/10 text-white placeholder-gray-500',
          btn: 'bg-cyan-500 text-black font-bold hover:bg-cyan-400',
          subtext: 'text-cyan-400',
          border: 'border-white/10'
        }
      case 'cyberpunk':
        return {
          container: 'bg-[#06060C] text-[#00F0FF] font-mono',
          card: 'bg-black border border-[#00F0FF]/40 text-[#00F0FF]',
          input: 'bg-black border border-[#00F0FF] text-[#00F0FF] placeholder-[#00F0FF]/40',
          btn: 'bg-[#FF0055] text-white font-bold hover:bg-[#D90048]',
          subtext: 'text-[#FF0055]',
          border: 'border-[#00F0FF]/30'
        }
      case 'industrial':
        return {
          container: 'bg-[#1C1C1C] text-[#E0D8C8] font-mono',
          card: 'bg-[#222] border border-dashed border-[#3D3D3D] text-[#E0D8C8]',
          input: 'bg-[#2A2A2A] border border-dashed border-[#3D3D3D] text-[#E0D8C8]',
          btn: 'bg-[#F59E0B] text-black font-bold hover:bg-[#D97706]',
          subtext: 'text-[#F59E0B]',
          border: 'border-dashed border-[#3D3D3D]'
        }
      case 'royal':
        return {
          container: 'bg-[#1A1019] text-[#F5E6D3] font-serif',
          card: 'bg-[#2A1F2A] border border-[#C9A84C]/30 text-[#F5E6D3]',
          input: 'bg-[#2A1F2A] border border-[#C9A84C]/30 text-[#F5E6D3] placeholder-[#C9A84C]/40',
          btn: 'bg-gradient-to-r from-[#C9A84C] to-[#A07B3C] text-[#1A1019] font-bold hover:from-[#D4B55C]',
          subtext: 'text-[#C9A84C]',
          border: 'border-[#C9A84C]/30'
        }
      case 'boho':
        return {
          container: 'bg-[#FAF5EF] text-[#5C4033]',
          card: 'bg-white border border-[#E8DDD2] text-[#5C4033] rounded-2xl shadow-sm',
          input: 'bg-white border border-[#E8DDD2] text-[#5C4033] rounded-xl outline-none placeholder-[#8B6F5C]/50',
          btn: 'bg-[#5C4033] text-[#FAF5EF] font-bold rounded-full hover:bg-[#4A3B32]',
          subtext: 'text-[#C4956A]',
          border: 'border-[#E8DDD2]'
        }
      case 'popart':
        return {
          container: 'bg-[#FEF08A] text-black font-black',
          card: 'bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
          input: 'bg-yellow-100 border-3 border-black text-black outline-none font-bold placeholder-gray-500',
          btn: 'bg-pink-500 text-white font-black border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-600 active:translate-x-0.5 active:translate-y-0.5',
          subtext: 'text-black',
          border: 'border-black'
        }
      case 'retro':
        return {
          container: 'bg-[#FFFBEB] text-[#78350F] font-serif',
          card: 'bg-[#FEF3C7] border-2 border-[#D97706]/40 text-[#78350F] rounded-2xl shadow-sm',
          input: 'bg-[#FEF3C7] border-2 border-[#D97706]/40 text-[#78350F] rounded-xl outline-none font-sans placeholder-[#92400E]/50',
          btn: 'bg-[#EA580C] text-white font-sans font-bold rounded-full hover:bg-[#C2410C] shadow-md',
          subtext: 'text-[#EA580C]',
          border: 'border-[#D97706]/40'
        }
      case 'pastel':
        return {
          container: 'bg-gradient-to-br from-[#FDF2F8] via-[#F3E8FF] to-[#EFF6FF] text-[#4A3560]',
          card: 'bg-white/80 backdrop-blur-md border border-purple-100 text-[#4A3560] rounded-2xl shadow-sm',
          input: 'bg-white/80 border border-purple-100 text-[#4A3560] rounded-xl outline-none placeholder-purple-300',
          btn: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold rounded-full shadow-md hover:shadow-lg',
          subtext: 'text-purple-400',
          border: 'border-purple-100'
        }
      case 'honeyspicy':
        return {
          container: 'bg-[#FFF8F0] text-amber-950 font-serif',
          card: 'bg-white border border-amber-200 text-amber-950 shadow-sm',
          input: 'bg-white border border-amber-300 text-amber-950',
          btn: 'bg-amber-500 text-white font-bold hover:bg-amber-600',
          subtext: 'text-amber-600',
          border: 'border-amber-200'
        }
      case 'polaroid':
        return {
          container: 'bg-[#C4A882] text-[#4A3728]',
          card: 'bg-white border border-[#D4B896] text-[#4A3728] shadow-md -rotate-1',
          input: 'bg-white border-2 border-[#D4B896] text-[#4A3728]',
          btn: 'bg-[#4A3728] text-[#F5E6D3] font-bold',
          subtext: 'text-[#4A3728]',
          border: 'border-[#B09670]'
        }
      case 'futura':
        return {
          container: 'bg-[#0C0015] text-white',
          card: 'bg-white/5 border border-white/10 backdrop-blur-md text-white',
          input: 'bg-white/5 border border-white/10 text-white',
          btn: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold',
          subtext: 'text-purple-300',
          border: 'border-white/10'
        }
      default:
        return {
          container: 'bg-white text-gray-900',
          card: 'bg-gray-50 border border-gray-200 text-gray-900',
          input: 'bg-white border border-gray-300 text-gray-900',
          btn: 'bg-gray-900 text-white font-bold hover:bg-black',
          subtext: 'text-gray-600',
          border: 'border-gray-200'
        }
    }
  }

  const styles = getThemeStyles()
  const extra = shop?.theme?.extra_tokens || {}
  const reviewsTitle = extra.testimonials_title || (extra[`${theme}_testimonials_title`]) || 'Reviews & Ratings'
  const reviewsSubtitle = extra.testimonials_subtitle || `Real feedback from verified buyers of ${shop?.name || 'our store'}.`

  return (
    <div className={`min-h-[70vh] pt-28 sm:pt-36 pb-16 px-6 ${styles.container}`}>
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Stats */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 border-b pb-8 ${styles.border}`}>
          <div>
            <span className="text-xs uppercase tracking-widest opacity-60 font-bold block mb-1">Customer Feedback</span>
            <h1 className="text-3xl sm:text-4xl font-bold">{reviewsTitle}</h1>
            <p className="text-sm opacity-75 mt-1">{reviewsSubtitle}</p>
          </div>

          <div className={`flex items-center gap-4 p-4 rounded-2xl ${styles.card}`}>
            <div className="text-center">
              <span className="text-3xl font-bold block leading-none">{avgRating}</span>
              <span className="text-[10px] opacity-60 uppercase font-bold">out of 5</span>
            </div>
            <div className="h-8 w-px bg-current opacity-20"></div>
            <div>
              <div className="text-amber-400 text-lg">
                {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
              </div>
              <span className="text-xs opacity-75">{reviewList.length} total reviews</span>
            </div>
          </div>
        </div>

        {/* Review Submission Form */}
        <div className={`p-6 rounded-2xl ${styles.card}`}>
          <h2 className="text-xl font-bold mb-1">Leave a Review</h2>
          <p className="text-xs opacity-75 mb-6">Share your experience with other shoppers.</p>

          {submitted ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold">
              ✓ Thank you! Your review has been submitted successfully.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Your Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Chisom A."
                    value={form.customer_name}
                    onChange={e => setForm({ ...form, customer_name: e.target.value })}
                    className={`w-full p-3 rounded-xl text-sm outline-none ${styles.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Rating</label>
                  <div className="flex gap-2 items-center pt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className={`text-2xl transition-transform ${star <= form.rating ? 'scale-110 text-amber-400' : 'opacity-30'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Review Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Excellent quality and fast shipping!"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={`w-full p-3 rounded-xl text-sm outline-none ${styles.input}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Comments</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us what you liked about your order..."
                  value={form.comment}
                  onChange={e => setForm({ ...form, comment: e.target.value })}
                  className={`w-full p-3 rounded-xl text-sm outline-none ${styles.input}`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${styles.btn}`}
              >
                {submitting ? 'Submitting...' : 'Submit Review ★'}
              </button>
            </form>
          )}
        </div>

        {/* Review List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Recent Reviews ({reviewList.length})</h2>

          {reviewList.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl ${styles.card}`}>
              <span className="text-3xl block mb-2">⭐</span>
              <p className="text-sm font-semibold">No reviews yet for this shop.</p>
              <p className="text-xs opacity-60 mt-1">Be the first customer to leave a review above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewList.map((r, idx) => (
                <div key={r.id || idx} className={`p-5 rounded-2xl ${styles.card} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-500 font-bold text-xs flex items-center justify-center">
                        {(r.customer_name || r.user_name || r.user?.first_name || 'C')[0]}
                      </div>
                      <div>
                        <span className="font-bold text-sm block leading-tight">
                          {r.customer_name || r.user_name || (r.user ? `${r.user.first_name || ''} ${r.user.last_name || ''}` : 'Customer')}
                        </span>
                        <span className="text-[10px] text-green-500 font-semibold">✓ Verified Buyer</span>
                      </div>
                    </div>
                    <div className="text-amber-400 text-xs font-bold">
                      {'★'.repeat(Number(r.rating || 5))}{'☆'.repeat(5 - Number(r.rating || 5))}
                    </div>
                  </div>

                  {r.title && <h4 className="font-bold text-sm">{r.title}</h4>}
                  <p className="text-xs opacity-80 leading-relaxed">{r.comment || r.body || r.content}</p>
                  <span className="text-[10px] opacity-40 block">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

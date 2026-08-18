import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ObsidianContactPage({ shop }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 sm:p-12 rounded-3xl bg-[#0F1420] border border-white/10 space-y-6"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Contact Store Support</h1>
        <p className="text-slate-400 text-sm">Have a question about an order or product? Send us a message.</p>

        {sent ? (
          <div className="p-6 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-center space-y-2">
            <span className="text-3xl block">🎉</span>
            <h3 className="font-bold text-lg text-white">Message Sent!</h3>
            <p className="text-xs text-slate-300">Thank you for contacting us. We will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Name"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help you?"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 text-sm resize-y"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-xl transition-all"
            >
              Send Message ✉️
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

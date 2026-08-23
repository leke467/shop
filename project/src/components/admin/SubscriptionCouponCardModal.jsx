import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNotification } from '../../context/NotificationContext'

export default function SubscriptionCouponCardModal({ coupon, onClose }) {
  const { toast } = useNotification()
  const [downloading, setDownloading] = useState(false)

  if (!coupon) return null

  const tierName = coupon.plan_name || 'All Subscription Tiers'
  const is100Percent =
    coupon.discount_type === 'percentage' && Number(coupon.discount_value) >= 100
  const discountLabel = is100Percent
    ? '100% FREE TRIAL'
    : coupon.discount_type === 'percentage'
    ? `${coupon.discount_value}% OFF`
    : `₦${Number(coupon.discount_value).toLocaleString()} OFF`

  const durationLabel =
    coupon.duration_months === 0
      ? 'Lifetime Access'
      : `${coupon.duration_months} Month${coupon.duration_months > 1 ? 's' : ''} Access`

  const expiryLabel = coupon.expires_at
    ? new Date(coupon.expires_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Expiration'

  const shareUrl = `${window.location.origin}/pricing?coupon=${coupon.code}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code)
    toast(`Coupon code ${coupon.code} copied!`, 'success')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast('Redemption link copied to clipboard!', 'success')
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 Exclusive MultiShop Seller Promo!\n\nUse coupon code *${coupon.code}* to get *${discountLabel}* (${durationLabel}) on the ${tierName} plan!\n\nRedeem here: ${shareUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `🚀 Join MultiShop with exclusive promo code "${coupon.code}" for ${discountLabel} on the ${tierName} plan! #MultiShopNG #Ecommerce`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  // --- High-Resolution Canvas Card Generator & Downloader ---
  const handleDownloadPNG = () => {
    try {
      setDownloading(true)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const width = 1200
      const height = 630
      canvas.width = width
      canvas.height = height

      // Background Gradient (Dark Luxury Emerald/Indigo)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height)
      bgGrad.addColorStop(0, '#091512')
      bgGrad.addColorStop(0.5, '#0c221e')
      bgGrad.addColorStop(1, '#081018')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Decorative Glowing Ambient Circles
      const g1 = ctx.createRadialGradient(200, 150, 20, 200, 150, 400)
      g1.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
      g1.addColorStop(1, 'rgba(16, 185, 129, 0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, width, height)

      const g2 = ctx.createRadialGradient(1000, 500, 20, 1000, 500, 350)
      g2.addColorStop(0, 'rgba(99, 102, 241, 0.2)')
      g2.addColorStop(1, 'rgba(99, 102, 241, 0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, width, height)

      // Card Border & Inner Box
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
      ctx.lineWidth = 4
      ctx.strokeRect(40, 40, width - 80, height - 80)

      // Top Brand Header
      ctx.fillStyle = '#10B981'
      ctx.font = 'bold 32px Inter, sans-serif'
      ctx.fillText('MULTISHOP MARKETPLACE', 80, 110)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '600 20px Inter, sans-serif'
      ctx.fillText('OFFICIAL VENDOR PASS / PROMO VOUCHER', 80, 145)

      // Tier Badge
      ctx.fillStyle = '#064E3B'
      ctx.fillRect(width - 400, 80, 320, 55)
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 2
      ctx.strokeRect(width - 400, 80, 320, 55)

      ctx.fillStyle = '#34D399'
      ctx.font = 'bold 20px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`👑 ${tierName.toUpperCase()}`, width - 240, 115)
      ctx.textAlign = 'left'

      // Big Discount Headline
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 68px Inter, sans-serif'
      ctx.fillText(discountLabel, 80, 250)

      // Duration Subtitle
      ctx.fillStyle = '#F59E0B'
      ctx.font = 'bold 30px Inter, sans-serif'
      ctx.fillText(`✨ ${durationLabel} for Verified Sellers`, 80, 305)

      // Coupon Code Container (Dashed Card)
      ctx.fillStyle = '#0F172A'
      ctx.fillRect(80, 360, 680, 120)
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 3
      ctx.setLineDash([12, 8])
      ctx.strokeRect(80, 360, 680, 120)
      ctx.setLineDash([])

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 18px Inter, sans-serif'
      ctx.fillText('PROMO COUPON CODE', 110, 395)

      ctx.fillStyle = '#38BDF8'
      ctx.font = '900 48px monospace'
      ctx.fillText(coupon.code, 110, 455)

      // Expiry & Redeem Instructions on Right
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px Inter, sans-serif'
      ctx.fillText('How to Redeem:', 800, 380)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '18px Inter, sans-serif'
      ctx.fillText('1. Go to multishopng.com/pricing', 800, 415)
      ctx.fillText(`2. Select ${tierName} plan`, 800, 445)
      ctx.fillText('3. Apply code at checkout for 0 fee', 800, 475)

      // Bottom Footer Bar
      ctx.fillStyle = '#64748B'
      ctx.font = '500 18px Inter, sans-serif'
      ctx.fillText(`Expires: ${expiryLabel}  •  Single use per vendor  •  multishopng.com`, 80, 550)

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `MultiShop-Coupon-${coupon.code}.png`
      link.href = dataUrl
      link.click()
      toast('Coupon card image downloaded successfully!', 'success')
    } catch (err) {
      console.error(err)
      toast('Failed to download image.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          ✕
        </button>

        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Shareable Promotional Asset
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Vendor Subscription Voucher</h2>
          <p className="text-sm text-gray-400">
            Share this coupon card directly with sellers or download as an image banner.
          </p>
        </div>

        {/* --- Card Visual Mockup --- */}
        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-emerald-950 via-gray-900 to-indigo-950 border-2 border-emerald-500/40 shadow-xl space-y-6">
          {/* Top Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-4">
            <div>
              <p className="text-xs font-extrabold text-emerald-400 tracking-wider">MULTISHOP MARKETPLACE</p>
              <p className="text-[11px] text-gray-400">Official Seller Subscription Pass</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              👑 {tierName}
            </span>
          </div>

          {/* Center Discount Banner */}
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{discountLabel}</p>
            <p className="text-sm font-semibold text-amber-400">✨ {durationLabel} Free Trial</p>
          </div>

          {/* Coupon Code Block */}
          <div className="bg-gray-950/80 border-2 border-dashed border-amber-500/60 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">PROMO CODE</p>
              <p className="font-mono text-2xl font-black text-cyan-400 tracking-wider mt-0.5">
                {coupon.code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-lg shadow transition-all active:scale-95 shrink-0"
            >
              Copy Code
            </button>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
            <span>Expires: <strong className="text-gray-200">{expiryLabel}</strong></span>
            <span className="font-mono text-emerald-400">multishopng.com</span>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition-all active:scale-95"
          >
            <span className="text-lg mb-1">📸</span>
            <span>{downloading ? 'Generating...' : 'Download PNG'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs border border-gray-700 transition-all active:scale-95"
          >
            <span className="text-lg mb-1">🔗</span>
            <span>Copy Link</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-200 font-semibold text-xs border border-emerald-700 transition-all active:scale-95"
          >
            <span className="text-lg mb-1">💬</span>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleShareTwitter}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-950 hover:bg-sky-900 text-sky-300 font-semibold text-xs border border-sky-800 transition-all active:scale-95"
          >
            <span className="text-lg mb-1">🐦</span>
            <span>Twitter / X</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

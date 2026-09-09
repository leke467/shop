import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * OffPlatformWarningModal
 * 
 * Intercepts off-platform communication clicks (WhatsApp, Phone, Instagram, etc.)
 * to clearly inform buyers that payments made directly to a seller outside MultiShop
 * are not covered by our 6-digit delivery code Escrow Protection and refund policies.
 */
export default function OffPlatformWarningModal({
  isOpen,
  onClose,
  onProceed,
  targetUrl,
  channelName = 'WhatsApp',
  shopName = 'this merchant',
}) {
  if (!isOpen) return null

  const handleProceed = () => {
    onClose()
    if (onProceed) {
      onProceed()
    } else if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden z-10"
        >
          {/* Header banner */}
          <div className="bg-amber-500/10 border-b border-amber-200/80 px-6 py-5 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Leaving MultiShop Escrow
              </h3>
              <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                External communication with {shopName}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                <span>🚨</span>
                <span>Zero Buyer Protection Off-Platform</span>
              </div>
              <p className="text-xs text-red-900/90 leading-relaxed font-normal">
                If you transfer money directly to the seller via personal bank account outside MultiShop:
              </p>
              <ul className="text-xs text-red-800 space-y-1.5 pl-4 list-disc font-medium">
                <li>MultiShop <strong>cannot hold funds in escrow</strong>.</li>
                <li>We <strong>cannot refund</strong> your money if goods are fake, damaged, or never sent.</li>
                <li>You forfeit the <strong>6-digit delivery inspection code</strong> security guarantee.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Stay Safe:</strong> You can use {channelName} to ask questions or enquire, but <strong>always complete your checkout on MultiShop</strong> to keep your funds 100% protected until delivery!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>🛡️</span>
                <span>Stay & Pay with Escrow Protection</span>
              </button>

              <button
                type="button"
                onClick={handleProceed}
                className="w-full py-2.5 px-4 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span>I understand the risks, continue to {channelName}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

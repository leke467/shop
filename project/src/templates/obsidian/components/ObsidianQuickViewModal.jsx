import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function ObsidianQuickViewModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgUrl = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  const price = Number(product.base_price || product.price || 0)

  const handleAdd = () => {
    addToCart({ ...product, quantity })
    onClose && onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0F1420] border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
              {imgUrl ? (
                <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              {product.category?.name && (
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {product.category.name}
                </span>
              )}

              <h2 className="text-2xl font-black text-white">{product.name}</h2>
              <p className="text-sm text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                {product.description || 'No detailed description available.'}
              </p>

              <div className="text-3xl font-black text-white pt-2">
                ₦{(price * quantity).toLocaleString()}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Quantity:</span>
                <div className="flex items-center border border-white/20 rounded-xl overflow-hidden bg-white/5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-white hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-white hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={handleAdd}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>🛍️</span> Add to Cart • ₦{(price * quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

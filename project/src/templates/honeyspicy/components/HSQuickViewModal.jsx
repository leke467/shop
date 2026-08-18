import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function HSQuickViewModal({ product, onClose }) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
  const imgUrl = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
  const price = Number(product.base_price || product.price || 0)

  const handleAdd = () => {
    addToCart({ ...product, quantity })
    if (onClose) onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#E5A43B]/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#E5A43B]/20 text-[#2B1F0C] font-bold flex items-center justify-center hover:bg-[#E5A43B] hover:text-white transition-colors"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-[#FBF3E4] border border-[#E5A43B]/20">
              {imgUrl ? (
                <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🍯</div>
              )}
            </div>

            <div className="space-y-4 text-left">
              {(product.category_name || product.category) && (
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5A43B] bg-[#FFF8E7] px-2.5 py-1 rounded-full border border-[#E5A43B]/30 inline-block">
                  {product.category_name || product.category}
                </span>
              )}

              <h2 className="text-2xl font-black text-[#2B1F0C]">{product.name}</h2>
              <p className="text-sm text-[#666] leading-relaxed max-h-32 overflow-y-auto">
                {product.description || 'Delicately crafted gourmet recipe with fresh, wholesome ingredients.'}
              </p>

              <div className="text-2xl font-black text-[#E5A43B]">
                ₦{(price * quantity).toLocaleString()}
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#888] uppercase">Qty:</span>
                <div className="flex items-center border border-[#E5A43B]/40 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-[#2B1F0C] font-bold hover:bg-[#FFF8E7]"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold text-[#2B1F0C]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-[#2B1F0C] font-bold hover:bg-[#FFF8E7]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAdd}
                className="w-full py-3.5 rounded-2xl bg-[#E5A43B] hover:bg-[#D4932B] text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>🛒</span> Add to Cart • ₦{(price * quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

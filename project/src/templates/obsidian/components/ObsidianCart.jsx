import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function ObsidianCart({ shop, shopSlug }) {
  const navigate = useNavigate()
  const { cart, items: ctxItems, isCartOpen, setIsCartOpen, updateQuantity, updateQty, removeFromCart, removeItem } = useCart() || {}

  if (!isCartOpen) return null

  const cartList = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(ctxItems) ? ctxItems : []))
  const subtotal = cartList.reduce((sum, item) => sum + Number(item.unit_price || item.price || item.base_price || 0) * (item.quantity || 1), 0)

  const baseSlug = shopSlug || shop?.slug || ''
  const checkoutUrl = baseSlug ? `/shop/${baseSlug}/checkout` : '/checkout'
  const catalogUrl = baseSlug ? `/shop/${baseSlug}/catalog` : '/catalog'

  const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty
  const handleRemove = typeof removeFromCart === 'function' ? removeFromCart : removeItem

  const handleCheckout = () => {
    setIsCartOpen(false)
    navigate(checkoutUrl)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Drawer */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[#0F1420] border-l border-white/10 text-white flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛍️</span>
                <h2 className="text-xl font-black">Your Shopping Cart</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Items Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartList.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <span className="text-5xl block">🛒</span>
                  <p className="text-slate-400 font-medium">Your cart is currently empty.</p>
                  <button
                    onClick={() => { setIsCartOpen(false); navigate(catalogUrl); }}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                cartList.map((item, idx) => {
                  const img = item.image || item.variant?.image || item.variant_image
                  const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
                  const price = Number(item.unit_price || item.price || 0)

                  return (
                    <div key={item.id || idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border border-white/10 shrink-0">
                        {imgSrc ? (
                          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{item.name || item.product_name || 'Product'}</h4>
                        <p className="text-xs text-purple-400 font-extrabold mt-0.5">₦{price.toLocaleString()}</p>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-white/20 rounded-lg overflow-hidden bg-black/40">
                            <button
                              onClick={() => handleUpdate && handleUpdate(item.id, (item.quantity || 1) - 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-bold text-white">{item.quantity || 1}</span>
                            <button
                              onClick={() => handleUpdate && handleUpdate(item.id, (item.quantity || 1) + 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove && handleRemove(item.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer / Checkout CTA */}
            {cartList.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#0B0F19] space-y-4">
                <div className="flex items-center justify-between text-base">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-white">₦{subtotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout ➔
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

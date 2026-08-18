import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { getImageUrl } from '../../../services/api'

export default function HSCart({ shop, shopSlug }) {
  const { cart = [], items = [], isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateQty, removeItem, getCartTotal, total: cartTotal, clearCart } = useCart() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const cartList = Array.isArray(cart) && cart.length > 0 ? cart : (cart?.items || (Array.isArray(items) ? items : []))
  const total = typeof getCartTotal === 'function' && getCartTotal() > 0 ? getCartTotal() : (cartTotal || cartList.reduce((sum, i) => sum + Number(i.unit_price || i.base_price || i.price || 0) * (i.quantity || 1), 0))

  const base = shopSlug || shop?.slug || ''
  const handleCheckout = () => {
    if (setIsCartOpen) setIsCartOpen(false)
    if (base) {
      navigate(`/shop/${base}/checkout`)
    } else {
      navigate('/cart')
    }
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            className="hs-cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            className="hs-cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <div className="hs-cart-header">
              <h3>Your Order</h3>
              <button className="hs-cart-close" onClick={() => setIsCartOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {cartList.length === 0 ? (
              <div className="hs-cart-empty">
                <span className="hs-cart-empty-icon">🛒</span>
                <p>Your cart is empty</p>
                <button className="hs-btn hs-btn-primary" onClick={() => { if (setIsCartOpen) setIsCartOpen(false); navigate(base ? `/shop/${base}/menu` : '/menu'); }}>Browse Menu</button>
              </div>
            ) : (
              <>
                <div className="hs-cart-items">
                  {cartList.map(item => {
                    const img = item.primary_image || item.image || (item.images?.[0]?.medium || item.images?.[0]?.image)
                    const imgSrc = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
                    const handleUpdate = typeof updateQuantity === 'function' ? updateQuantity : updateQty
                    const handleRemove = typeof removeFromCart === 'function' ? removeFromCart : removeItem
                    return (
                      <motion.div key={item.id || item.public_id} className="hs-cart-item" layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                        <div className="hs-cart-item-image">
                          {imgSrc ? <img src={imgSrc} alt={item.product_name || item.name} /> : <span>📦</span>}
                        </div>
                        <div className="hs-cart-item-info">
                          <h4>{item.product_name || item.name}</h4>
                          <p className="hs-cart-item-price">₦{Number(item.unit_price || item.base_price || item.price || 0).toLocaleString()}</p>
                          <div className="hs-cart-item-qty">
                            <button onClick={() => handleUpdate && handleUpdate(item.id || item.public_id, (item.quantity || 1) - 1)}>−</button>
                            <span>{item.quantity || 1}</span>
                            <button onClick={() => handleUpdate && handleUpdate(item.id || item.public_id, (item.quantity || 1) + 1)}>+</button>
                          </div>
                        </div>
                        <button className="hs-cart-item-remove" onClick={() => handleRemove && handleRemove(item.id || item.public_id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="hs-cart-footer">
                  <div className="hs-cart-total">
                    <span>Total:</span>
                    <span>₦{Number(total).toLocaleString()}</span>
                  </div>
                  <button className="hs-btn hs-btn-primary hs-cart-checkout-btn" onClick={handleCheckout}>
                    Proceed to Checkout
                  </button>
                  <button className="hs-cart-clear" onClick={clearCart}>Clear Cart</button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

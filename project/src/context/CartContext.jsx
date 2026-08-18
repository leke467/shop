import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { orderAPI } from '../services/api'
import { useUser } from './UserContext'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

function getGuestCart() {
  try {
    const data = localStorage.getItem('guestCart')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveGuestCart(cart) {
  localStorage.setItem('guestCart', JSON.stringify(cart))
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: userLoading } = useUser()
  const [items, setItems] = useState([])
  const [itemCount, setItemCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const updateCartState = useCallback((cartItems) => {
    setItems(cartItems)
    setItemCount(cartItems.reduce((sum, i) => sum + i.quantity, 0))
    setTotal(cartItems.reduce((sum, i) => sum + Number(i.unit_price || 0) * i.quantity, 0))
  }, [])

  const refreshCart = useCallback(() => {
    if (userLoading) return

    if (!isAuthenticated) {
      updateCartState(getGuestCart())
      setLoading(false)
      return
    }

    setLoading(true)
    orderAPI.cart()
      .then(data => {
        updateCartState(data?.items || data || [])
      })
      .catch(() => {
        updateCartState([])
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, userLoading, updateCartState])

  // Sync guest cart to API when user logs in
  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      const guestCart = getGuestCart()
      if (guestCart.length > 0) {
        // Sync items sequentially to avoid race conditions on order creation
        const syncItems = async () => {
          for (const item of guestCart) {
            try {
              await orderAPI.addToCart({
                variant_id: item.variant,
                quantity: item.quantity,
              })
            } catch (err) {
              console.error('Failed to sync guest cart item', err)
            }
          }
          localStorage.removeItem('guestCart')
          refreshCart()
        }
        syncItems()
      } else {
        refreshCart()
      }
    } else if (!userLoading && !isAuthenticated) {
      refreshCart()
    }
  }, [isAuthenticated, userLoading, refreshCart])

  const addToCart = async (param) => {
    if (!param) return
    const variant_id = param.variant_id || param.variants?.[0]?.id || param.variant?.id
    const product_id = param.product_id || param.id || param.pk
    const quantity = param.quantity || 1
    const product_name = param.product_name || param.name || 'Product'
    const variant_name = param.variant_name || param.variants?.[0]?.name || ''
    const unit_price = param.unit_price || param.base_price || param.price || 0

    if (isAuthenticated) {
      try {
        await orderAPI.addToCart({ variant_id, product_id, quantity })
        refreshCart()
      } catch (err) {
        console.error('Backend cart sync error', err)
      }
    } else {
      const currentCart = getGuestCart()
      const existingKey = variant_id || product_id
      const existing = currentCart.find(i => (i.variant === existingKey || i.product_id === existingKey))
      if (existing) {
        existing.quantity += quantity
      } else {
        currentCart.push({
          id: `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          variant: variant_id,
          product_id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          line_total: Number(unit_price) * quantity
        })
      }
      saveGuestCart(currentCart)
      updateCartState(currentCart)
    }

    setIsCartOpen(true)
  }

  const updateQty = async (itemId, qty) => {
    if (qty < 1) return removeItem(itemId)

    if (isAuthenticated) {
      await orderAPI.updateCartItem(itemId, { quantity: qty })
      refreshCart()
    } else {
      const currentCart = getGuestCart()
      const item = currentCart.find(i => i.id === itemId)
      if (item) {
        item.quantity = qty
        item.line_total = Number(item.unit_price) * qty
        saveGuestCart(currentCart)
        updateCartState(currentCart)
      }
    }
  }

  const removeItem = async (itemId) => {
    if (isAuthenticated) {
      await orderAPI.removeCartItem(itemId)
      refreshCart()
    } else {
      let currentCart = getGuestCart()
      currentCart = currentCart.filter(i => i.id !== itemId)
      saveGuestCart(currentCart)
      updateCartState(currentCart)
    }
  }

  const [isCartOpen, setIsCartOpen] = useState(false)

  const clearCart = async () => {
    localStorage.removeItem('guestCart')
    if (isAuthenticated) {
      for (const item of items) {
        try { await orderAPI.removeCartItem(item.id) } catch (e) {}
      }
      refreshCart()
    } else {
      updateCartState([])
    }
  }

  const value = {
    cart: items,
    items,
    total,
    itemCount,
    loading,
    isCartOpen,
    setIsCartOpen,
    refreshCart,
    addToCart,
    updateQty,
    removeItem,
    // Template compatibility helpers
    getCartTotal: () => total,
    getCartItemsCount: () => itemCount,
    removeFromCart: (itemId) => removeItem(itemId),
    updateQuantity: (itemId, qty) => updateQty(itemId, qty),
    clearCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
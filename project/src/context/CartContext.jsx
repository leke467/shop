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

  const refreshCart = useCallback((silent = false) => {
    if (userLoading) return

    if (!isAuthenticated) {
      updateCartState(getGuestCart())
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    orderAPI.cart()
      .then(data => {
        updateCartState(data?.items || data || [])
      })
      .catch(() => {
        updateCartState([])
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
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
    const rawVariant = param.variant_id || param.variants?.[0] || param.variant
    const product_id = param.product_id || param.public_id || param.id || param.pk || param.slug
    const variant_id = typeof rawVariant === 'object' 
      ? (rawVariant.public_id || rawVariant.id || rawVariant.pk) 
      : (rawVariant || product_id)
    const quantity = Number(param.quantity || 1)
    const product_name = param.product_name || param.name || 'Product'
    const variant_name = param.variant_name || (typeof rawVariant === 'object' ? rawVariant.name : '') || 'Default'
    const unit_price = Number(param.unit_price || param.base_price || param.price || (typeof rawVariant === 'object' ? rawVariant.price : 0) || 0)

    let backendSuccess = false
    if (isAuthenticated) {
      try {
        await orderAPI.addToCart({ variant_id, product_id, quantity })
        await refreshCart(true)
        backendSuccess = true
      } catch (err) {
        console.error('Backend cart sync error', err)
      }
    }

    if (!isAuthenticated || !backendSuccess) {
      const currentCart = getGuestCart()
      const existingKey = variant_id || product_id || product_name
      const existing = currentCart.find(i => (i.variant === existingKey || i.product_id === existingKey || i.product_name === product_name))
      if (existing) {
        existing.quantity += quantity
        existing.line_total = Number(existing.unit_price) * existing.quantity
      } else {
        currentCart.push({
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          variant: variant_id,
          product_id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          image: param.image || param.primary_image || (typeof param.images?.[0] === 'string' ? param.images[0] : (param.images?.[0]?.medium || param.images?.[0]?.image)),
          line_total: unit_price * quantity
        })
      }
      saveGuestCart(currentCart)
      updateCartState(currentCart)
    }

    setIsCartOpen(true)
  }

  const updateQty = async (itemId, qty) => {
    if (qty < 1) return removeItem(itemId)

    // Optimistically update local state for instantaneous, smooth UI
    setItems(prevItems => {
      const updated = prevItems.map(it => {
        if (it.id === itemId) {
          const newQty = Number(qty)
          return {
            ...it,
            quantity: newQty,
            line_total: Number(it.unit_price) * newQty
          }
        }
        return it
      })
      const newTotal = updated.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0)
      setItemCount(updated.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0))
      setTotal(newTotal)
      return updated
    })

    if (isAuthenticated) {
      try {
        await orderAPI.updateCartItem(itemId, { quantity: qty })
        refreshCart(true)
      } catch (err) {
        console.error('Failed to update cart item on server', err)
        refreshCart(true)
      }
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
    // Optimistically remove from state
    setItems(prevItems => {
      const updated = prevItems.filter(it => it.id !== itemId)
      const newTotal = updated.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0)
      setItemCount(updated.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0))
      setTotal(newTotal)
      return updated
    })

    if (isAuthenticated) {
      try {
        await orderAPI.removeCartItem(itemId)
        refreshCart(true)
      } catch (err) {
        console.error('Failed to remove cart item on server', err)
        refreshCart(true)
      }
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
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

  const addToCart = async ({ variant_id, quantity, product_name, variant_name, unit_price }) => {
    if (isAuthenticated) {
      await orderAPI.addToCart({ variant_id, quantity })
      refreshCart()
    } else {
      const currentCart = getGuestCart()
      const existing = currentCart.find(i => i.variant === variant_id)
      if (existing) {
        existing.quantity += quantity
      } else {
        currentCart.push({
          id: `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          variant: variant_id,
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

  const value = {
    cart: items,
    items,
    total,
    itemCount,
    loading,
    refreshCart,
    addToCart,
    updateQty,
    removeItem,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
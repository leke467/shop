import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { orderAPI } from '../services/api'
import { useUser } from './UserContext'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: userLoading } = useUser()
  const [items, setItems] = useState([])
  const [itemCount, setItemCount] = useState(0)
  const [total, setTotal] = useState(0)

  const refreshCart = useCallback(() => {
    orderAPI.cart()
      .then(data => {
        const cartItems = data?.items || data || []
        setItems(cartItems)
        setItemCount(cartItems.reduce((sum, i) => sum + i.quantity, 0))
        setTotal(cartItems.reduce((sum, i) => sum + Number(i.unit_price || 0) * i.quantity, 0))
      })
      .catch(() => {
        setItems([])
        setItemCount(0)
        setTotal(0)
      })
  }, [])

  // Load cart on mount or auth change
  useEffect(() => {
    if (!userLoading) {
      if (isAuthenticated) {
        refreshCart()
      } else {
        setItems([])
        setItemCount(0)
        setTotal(0)
      }
    }
  }, [isAuthenticated, userLoading, refreshCart])

  const value = {
    cart: items,
    items,
    total,
    itemCount,
    refreshCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
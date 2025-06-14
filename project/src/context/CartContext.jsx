import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  // Structure: { shopId: { items: [{ productId, quantity, price, name, image }], subtotal } }
  const [cart, setCart] = useState({})
  const [total, setTotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)

  // Calculate totals whenever cart changes
  useEffect(() => {
    let newTotal = 0
    let newItemCount = 0

    Object.values(cart).forEach(shopCart => {
      shopCart.items.forEach(item => {
        newTotal += item.price * item.quantity
        newItemCount += item.quantity
      })
    })

    setTotal(newTotal)
    setItemCount(newItemCount)
  }, [cart])

  const addToCart = (product, shopId) => {
    setCart(prevCart => {
      // Create a deep copy of the cart
      const newCart = { ...prevCart }

      // Initialize shop cart if it doesn't exist
      if (!newCart[shopId]) {
        newCart[shopId] = { 
          items: [], 
          subtotal: 0,
          shopName: product.shopName
        }
      }

      // Check if product already exists in cart
      const existingItemIndex = newCart[shopId].items.findIndex(
        item => item.productId === product.id
      )

      if (existingItemIndex >= 0) {
        // Increase quantity if product exists
        newCart[shopId].items[existingItemIndex].quantity += 1
      } else {
        // Add new product to cart
        newCart[shopId].items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        })
      }

      // Update shop subtotal
      newCart[shopId].subtotal = newCart[shopId].items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      )

      return newCart
    })
  }

  const removeFromCart = (productId, shopId) => {
    setCart(prevCart => {
      // Create a deep copy of the cart
      const newCart = { ...prevCart }

      if (!newCart[shopId]) return newCart

      // Filter out the product
      newCart[shopId].items = newCart[shopId].items.filter(
        item => item.productId !== productId
      )

      // Update shop subtotal
      newCart[shopId].subtotal = newCart[shopId].items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      )

      // Remove shop from cart if it's empty
      if (newCart[shopId].items.length === 0) {
        delete newCart[shopId]
      }

      return newCart
    })
  }

  const updateQuantity = (productId, shopId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId, shopId)
      return
    }

    setCart(prevCart => {
      // Create a deep copy of the cart
      const newCart = { ...prevCart }

      if (!newCart[shopId]) return newCart

      // Find the product
      const itemIndex = newCart[shopId].items.findIndex(
        item => item.productId === productId
      )

      if (itemIndex >= 0) {
        // Update quantity
        newCart[shopId].items[itemIndex].quantity = quantity

        // Update shop subtotal
        newCart[shopId].subtotal = newCart[shopId].items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        )
      }

      return newCart
    })
  }

  const clearCart = () => {
    setCart({})
  }

  const value = {
    cart,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
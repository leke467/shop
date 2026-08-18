import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const WishlistContext = createContext()

export function useWishlist() {
  return useContext(WishlistContext)
}

const DEFAULT_WISHLIST = [
  {
    id: 'prod-1',
    name: 'Premium Nigerian Handcrafted Leather Bag',
    price: 45000,
    shop_name: 'LeatherWorks NG',
    shop_slug: 'leatherworks-ng',
    slug: 'premium-leather-bag',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-2',
    name: 'Handmade Nigerian Ceramic Vase',
    price: 15000,
    shop_name: 'Pottery House',
    shop_slug: 'pottery-house',
    slug: 'handmade-ceramic-vase',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-3',
    name: 'Pure Organic Raw Shea Butter (500g)',
    price: 5000,
    shop_name: 'Nature Secrets',
    shop_slug: 'nature-secrets',
    slug: 'organic-shea-butter',
    image: 'https://images.unsplash.com/photo-1608248597359-00994bb46594?w=600&auto=format&fit=crop&q=80',
  },
]

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('marketplace_wishlist')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WISHLIST
  })

  useEffect(() => {
    try {
      localStorage.setItem('marketplace_wishlist', JSON.stringify(wishlist))
    } catch {
      // Ignore quota errors
    }
  }, [wishlist])

  const isInWishlist = useCallback((idOrSlug) => {
    if (!idOrSlug) return false
    return wishlist.some(
      item => item.id === idOrSlug || item.slug === idOrSlug || item.public_id === idOrSlug
    )
  }, [wishlist])

  const addToWishlist = useCallback((product) => {
    if (!product) return
    setWishlist(prev => {
      const exists = prev.some(
        item => item.id === product.id || (product.slug && item.slug === product.slug)
      )
      if (exists) return prev

      const newItem = {
        id: product.id || product.public_id || `wish-${Date.now()}`,
        slug: product.slug || product.productSlug || '',
        name: product.name || product.title || 'Product',
        price: Number(product.price || product.base_price || product.variants?.[0]?.price || 0),
        shop_name: product.shop_name || product.shopName || 'Shop',
        shop_slug: product.shop_slug || product.shopSlug || '',
        image: product.image || product.images?.[0]?.image || product.images?.[0]?.thumbnail || '',
      }
      return [newItem, ...prev]
    })
  }, [])

  const removeFromWishlist = useCallback((idOrSlug) => {
    setWishlist(prev =>
      prev.filter(
        item => item.id !== idOrSlug && item.slug !== idOrSlug && item.public_id !== idOrSlug
      )
    )
  }, [])

  const toggleWishlist = useCallback((product) => {
    if (!product) return
    const idOrSlug = product.slug || product.id || product.public_id
    if (isInWishlist(idOrSlug)) {
      removeFromWishlist(idOrSlug)
      return false
    } else {
      addToWishlist(product)
      return true
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist])

  const clearWishlist = useCallback(() => {
    setWishlist([])
  }, [])

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

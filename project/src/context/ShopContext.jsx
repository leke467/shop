import { createContext, useContext, useState, useEffect } from 'react'
import { mockShops, mockFeatureFlags } from '../data/mockData'

const ShopContext = createContext()

export function useShop() {
  return useContext(ShopContext)
}

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([])
  const [features, setFeatures] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setShops(mockShops)
      setFeatures(mockFeatureFlags)
      setLoading(false)
    }, 500)
  }, [])

  const createShop = (shopData) => {
    const newShop = {
      id: `shop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...shopData,
    }
    
    setShops([...shops, newShop])
    return newShop.id
  }

  const updateShopFeatures = (shopId, updatedFeatures) => {
    setFeatures({
      ...features,
      [shopId]: {
        ...features[shopId],
        ...updatedFeatures
      }
    })
  }

  const getShopById = (shopId) => {
    return shops.find(shop => shop.id === shopId) || null
  }

  const getShopFeatures = (shopId) => {
    return features[shopId] || {}
  }

  const value = {
    shops,
    features,
    loading,
    createShop,
    updateShopFeatures,
    getShopById,
    getShopFeatures
  }

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}
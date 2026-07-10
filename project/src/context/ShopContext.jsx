import { createContext, useContext, useState, useEffect } from 'react'
import { mockFeatureFlags } from '../data/mockData'
import { fetchAllShops, createShop as apiCreateShop, updateShop as apiUpdateShop } from '../services/api'

const ShopContext = createContext()

export function useShop() {
  return useContext(ShopContext)
}

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([])
  const [features, setFeatures] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const shopsData = await fetchAllShops()
        if (!mounted) return
        setShops(shopsData)
        // Initialize feature flags from shop model fields
        const mapShopToFeatures = (shop) => ({
          productListings: shop.enable_product_listings,
          customOrders: shop.enable_custom_orders,
          reviews: shop.enable_reviews,
          contact: shop.enable_contact,
          shipping: shop.enable_shipping,
          socialLinks: shop.enable_social_links
        })

        const initialFeatures = shopsData.reduce((acc, s) => {
          acc[s.id] = mapShopToFeatures(s)
          return acc
        }, {})
        setFeatures(initialFeatures)
      } catch (err) {
        console.error('Failed to load shops:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const createShop = async (shopData) => {
    try {
      const created = await apiCreateShop(shopData)
      setShops(prev => [created, ...prev])
      return created
    } catch (err) {
      console.error('createShop failed:', err)
      throw err
    }
  }

  const updateShopFeatures = async (shopId, updatedFeatures) => {
    // Optimistically update local UI
    setFeatures(prev => ({
      ...prev,
      [shopId]: {
        ...prev[shopId],
        ...updatedFeatures
      }
    }))

    try {
      // Map frontend feature keys to backend model field names
      const featureKeyMap = {
        productListings: 'enable_product_listings',
        customOrders: 'enable_custom_orders',
        reviews: 'enable_reviews',
        contact: 'enable_contact',
        shipping: 'enable_shipping',
        socialLinks: 'enable_social_links'
      }

      const payload = {}
      Object.keys(updatedFeatures).forEach(k => {
        const mapped = featureKeyMap[k] || k
        payload[mapped] = updatedFeatures[k]
      })

      const persisted = await apiUpdateShop(shopId, payload)
      // Update local shop record with any returned fields
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, ...persisted } : s))
      return persisted
    } catch (err) {
      console.error('Failed to persist shop features:', err)
      // On error, revert the optimistic change by toggling back
      setFeatures(prev => ({
        ...prev,
        [shopId]: Object.keys(updatedFeatures).reduce((acc, key) => {
          acc[key] = !updatedFeatures[key]
          return acc
        }, { ...prev[shopId] })
      }))
      throw err
    }
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
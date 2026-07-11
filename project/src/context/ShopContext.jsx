import { createContext, useContext, useState, useEffect } from 'react'
import { shopAPI } from '../services/api'

const ShopContext = createContext()

export function useShop() {
  return useContext(ShopContext)
}

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    shopAPI.list({ page_size: 50 })
      .then(data => {
        if (mounted) setShops(data?.results || data || [])
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const createShop = async (shopData) => {
    const created = await shopAPI.create(shopData)
    setShops(prev => [created, ...prev])
    return created
  }

  const updateShop = async (slug, data) => {
    const updated = await shopAPI.update(slug, data)
    setShops(prev => prev.map(s => s.slug === slug ? { ...s, ...updated } : s))
    return updated
  }

  const getShopBySlug = (slug) => shops.find(s => s.slug === slug) || null

  const value = {
    shops,
    loading,
    createShop,
    updateShop,
    getShopBySlug,
  }

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}
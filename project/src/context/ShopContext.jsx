import { createContext, useContext, useState, useEffect } from 'react'
import { shopAPI } from '../services/api'

const ShopContext = createContext()

export function useShop() {
  return useContext(ShopContext)
}

export function getTemplateShopCache(slug) {
  if (!slug) return null
  try {
    const cached = JSON.parse(localStorage.getItem('template_shops_cache') || '{}')
    return cached[slug] || null
  } catch {
    return null
  }
}

export function setTemplateShopCache(slug, templateId) {
  if (!slug) return
  try {
    const cached = JSON.parse(localStorage.getItem('template_shops_cache') || '{}')
    if (templateId) {
      cached[slug] = templateId
    } else {
      delete cached[slug]
    }
    localStorage.setItem('template_shops_cache', JSON.stringify(cached))
  } catch {}
}

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTemplateShop, setActiveTemplateShop] = useState(undefined)

  useEffect(() => {
    let mounted = true
    shopAPI.list({ page_size: 50 })
      .then(data => {
        const list = data?.results || data || []
        if (mounted) {
          setShops(list)
          list.forEach(s => setTemplateShopCache(s.slug, s.template_id))
        }
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
    activeTemplateShop,
    setActiveTemplateShop,
  }

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}
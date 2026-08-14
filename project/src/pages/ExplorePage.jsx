import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI, getImageUrl } from '../services/api'
import SEOHead from '../components/SEOHead'

function ProductCard({ product }) {
  const img = product.primary_image || (product.images?.[0]?.medium || product.images?.[0]?.image)
  return (
    <Link to={`/product/${product.slug || product.public_id}`}>
      <motion.div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 h-full flex flex-col justify-between" whileHover={{ y: -4 }}>
        <div>
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {img ? (
              <img src={getImageUrl(typeof img === 'string' ? img : (img.medium || img.image))} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm">
              <span className="font-bold text-gray-900">₦{Number(product.base_price || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{product.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{product.shop_name || ''}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

function ShopCard({ shop }) {
  return (
    <Link to={`/shop/${shop.slug}`}>
      <motion.div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300" whileHover={{ y: -4 }}>
        <div className="h-28 bg-gradient-to-br from-primary-400 to-secondary-500 relative">
          {shop.banner && <img src={getImageUrl(shop.banner)} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4 pt-2">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{shop.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{shop.tagline || ''}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <span>⭐ {Number(shop.rating_average || 0).toFixed(1)}</span>
            <span>{shop.product_count || 0} products</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function ExplorePage() {
  const { exploreType } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  const initialType = (exploreType && ['all', 'products', 'shops'].includes(exploreType)) ? exploreType : (searchParams.get('type') || 'all')
  const [type, setType] = useState(initialType)
  
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')

  const [categories, setCategories] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [facets, setFacets] = useState(null)
  const [shopList, setShopList] = useState([])

  // Endless Scroll States:
  const [productList, setProductList] = useState([])
  const [totalProductCount, setTotalProductCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef(null)
  const pageSize = 24

  // Load categories once
  useEffect(() => {
    searchAPI.categories().then(setCategories).catch(() => {})
  }, [])

  // Sync type with URL params
  useEffect(() => {
    if (exploreType && ['all', 'products', 'shops'].includes(exploreType)) {
      setType(exploreType)
    }
  }, [exploreType])

  // Core Search & Load Function
  const fetchProducts = useCallback(async (pageToFetch = 1, isAppending = false) => {
    if (isAppending) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    const params = { q: query, type, sort, page: pageToFetch, page_size: pageSize }
    if (category) params.category = category
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice

    try {
      const data = await searchAPI.search(params)
      const newItems = (data.products?.results || []).filter(p => !p.is_locked)
      const count = data.products?.count || 0

      setFacets(data.facets)
      setShopList((data.shops?.results || []).filter(s => !s.is_locked))
      setTotalProductCount(count)

      if (isAppending) {
        setProductList(prev => {
          const existingIds = new Set(prev.map(p => p.id || p.public_id || p.slug))
          const uniqueNew = newItems.filter(p => !existingIds.has(p.id || p.public_id || p.slug))
          const combined = [...prev, ...uniqueNew]
          setHasMore(combined.length < count && newItems.length > 0)
          return combined
        })
      } else {
        setProductList(newItems)
        setHasMore(newItems.length < count && newItems.length > 0)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [query, type, category, sort, minPrice, maxPrice])

  // Reset and fetch initial page when filters change
  useEffect(() => {
    setPage(1)
    setProductList([])
    fetchProducts(1, false)
  }, [query, category, sort, minPrice, maxPrice, type])

  // Handle Load More (Next Page)
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage, true)
  }, [loading, loadingMore, hasMore, page, fetchProducts])

  // Intersection Observer for Automatic Jumia-style Endless Scrolling
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.2, rootMargin: '300px' }
    )

    const target = observerTarget.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
    }
  }, [hasMore, loading, loadingMore, loadMore])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    setSearchParams(params)
    navigate(`/explore/${type === 'all' ? '' : type}?${params.toString()}`)
    setPage(1)
    setProductList([])
    fetchProducts(1, false)
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead title="Explore Marketplace | MultiShopNG" description="Search and discover products and shops." />

      {/* Filter Sub-bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Mobile Filter toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold text-gray-700 flex-shrink-0 relative"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {(category || minPrice || maxPrice || sort !== 'newest') && (
              <span className="w-2 h-2 rounded-full bg-primary-600" />
            )}
          </button>
          
          {/* Type toggle: All | Products | Shops */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0 ml-auto">
            {['all', 'products', 'shops'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t)
                  const params = new URLSearchParams()
                  if (query) params.set('q', query)
                  setSearchParams(params)
                  navigate(`/explore/${t === 'all' ? '' : t}?${params.toString()}`)
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                  type === t ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex gap-6">
        {/* Desktop Compact Sidebar filters */}
        <aside className="hidden lg:block w-52 xl:w-56 flex-shrink-0">
          <div className="sticky top-40 space-y-4">
            {/* Sort */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2.5">Sort by</h3>
              <div className="space-y-1.5">
                {sortOptions.map(s => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="sort" value={s.value} checked={sort === s.value} onChange={() => setSort(s.value)}
                      className="w-3.5 h-3.5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            {facets?.categories?.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2.5">Categories</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <button onClick={() => setCategory('')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all ${!category ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    All Categories
                  </button>
                  {facets.categories.map(c => (
                    <button key={c.id} onClick={() => setCategory(String(c.id))}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center justify-between ${
                        category === String(c.id) ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono ml-1">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2.5">Price range (₦)</h3>
              <div className="flex items-center gap-1.5">
                <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                <span className="text-gray-400 text-xs">—</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Result count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-600 font-medium">
              {loading ? 'Loading catalog…' : (
                <>
                  Showing <span className="font-bold text-gray-900">{productList.length}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalProductCount}</span> products
                  {query && <> for "<span className="font-medium text-gray-900">{query}</span>"</>}
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Shops */}
              {shopList.length > 0 && (type === 'all' || type === 'shops') && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🏪 Shops <span className="text-sm font-normal text-gray-400">({shopList.length})</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {shopList.map(s => <ShopCard key={s.slug || s.public_id} shop={s} />)}
                  </div>
                </div>
              )}

              {/* Products Grid — 4 items per row on Desktop! */}
              {productList.length > 0 && (type === 'all' || type === 'products') && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
                    {productList.map((p, index) => (
                      <ProductCard key={`${p.slug || p.public_id}-${index}`} product={p} />
                    ))}
                  </div>

                  {/* Sentinel element for automatic endless scroll */}
                  <div ref={observerTarget} className="h-10 my-4" />

                  {/* Loading spinner during endless scroll */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-sm text-gray-600 font-medium">Loading more products...</span>
                    </div>
                  )}

                  {/* Manual Fallback Load More Button */}
                  {hasMore && !loadingMore && (
                    <div className="text-center pt-6 pb-12">
                      <button
                        onClick={loadMore}
                        className="px-8 py-3.5 rounded-2xl bg-white border border-gray-300 shadow-sm text-gray-800 font-bold hover:bg-gray-50 hover:shadow-md transition-all duration-300 inline-flex items-center gap-2"
                      >
                        <span>Load More Products</span>
                        <span className="text-xs text-gray-400 font-normal">({productList.length} of {totalProductCount})</span>
                      </button>
                    </div>
                  )}

                  {!hasMore && productList.length > 0 && (
                    <p className="text-center text-xs text-gray-400 py-8 border-t border-gray-200/60 mt-8">
                      ✓ You have viewed all {totalProductCount} products!
                    </p>
                  )}
                </div>
              )}

              {productList.length === 0 && shopList.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900">No results found</h3>
                  <p className="text-gray-500 mt-2">Try different keywords or browse all categories</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
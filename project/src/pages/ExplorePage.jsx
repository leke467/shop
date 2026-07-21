import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI, getImageUrl } from '../services/api'
import SEOHead from '../components/SEOHead'

function ProductCard({ product }) {
  const img = product.primary_image || (product.images?.[0]?.medium || product.images?.[0]?.image)
  return (
    <Link to={`/product/${product.slug || product.public_id}`}>
      <motion.div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300" whileHover={{ y: -4 }}>
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
  
  // Use URL parameter for type, fallback to searchParam, then 'all'
  const initialType = (exploreType && ['all', 'products', 'shops'].includes(exploreType)) ? exploreType : (searchParams.get('type') || 'all')
  const [type, setType] = useState(initialType)
  
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [results, setResults] = useState({ products: null, shops: null, facets: null })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  // Search effect
  const doSearch = useCallback(() => {
    setLoading(true)
    const params = { q: query, type, sort, page_size: 24 }
    if (category) params.category = category
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice

    searchAPI.search(params)
      .then(data => setResults(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, type, category, sort, minPrice, maxPrice])

  useEffect(() => { doSearch() }, [doSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    setSearchParams(params)
    navigate(`/explore/${type === 'all' ? '' : type}?${params.toString()}`)
    doSearch()
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
  ]

  const productList = (results.products?.results || []).filter(p => !p.is_locked)
  const shopList = (results.shops?.results || []).filter(s => !s.is_locked)
  const facets = results.facets

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEOHead title="Explore Marketplace" description="Search and discover products and shops." />
      {/* Header/Search Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:flex-1 min-w-0">
              <div className="flex-1 relative min-w-0">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="explore-search"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all min-w-0 text-sm sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold text-sm hover:shadow-lg transition-all duration-300 flex-shrink-0"
              >
                Search
              </button>
              {/* Filter toggle (mobile) */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden px-3 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold text-gray-700 flex-shrink-0 relative"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {(category || minPrice || maxPrice || sort !== 'newest') && (
                  <span className="w-2 h-2 rounded-full bg-primary-600" />
                )}
              </button>
            </div>
            
            {/* Type toggle */}
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0">
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
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                    type === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-8">
        {/* Desktop Sidebar filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Sort */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Sort by</h3>
              <div className="space-y-2">
                {sortOptions.map(s => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="sort" value={s.value} checked={sort === s.value} onChange={() => setSort(s.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            {facets?.categories?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button onClick={() => setCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!category ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    All Categories
                  </button>
                  {facets.categories.map(c => (
                    <button key={c.id} onClick={() => setCategory(String(c.id))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                        category === String(c.id) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      <span>{c.name}</span>
                      <span className="text-xs text-gray-400">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Price range</h3>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                <span className="text-gray-400">—</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer / Modal */}
        <AnimatePresence>
          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={() => setFiltersOpen(false)} 
              />
              <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }} 
                exit={{ y: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto z-10 shadow-2xl flex flex-col space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Filter Results</h3>
                  <button 
                    onClick={() => setFiltersOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Sort */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Sort by</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSort(s.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          sort === s.value ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {facets?.categories?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Category</h4>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      <button 
                        onClick={() => setCategory('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          !category ? 'bg-primary-600 text-white font-semibold' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        All Categories
                      </button>
                      {facets.categories.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => setCategory(String(c.id))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            category === String(c.id) ? 'bg-primary-600 text-white font-semibold' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.name} ({c.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price range */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Price Range (₦)</h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice} 
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 box-border" 
                    />
                    <span className="text-gray-400">—</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice} 
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 box-border" 
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => { setCategory(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs sm:text-sm"
                  >
                    Reset All
                  </button>
                  <button 
                    onClick={() => setFiltersOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold text-xs sm:text-sm shadow-md"
                  >
                    Show Results
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Result count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {loading ? 'Searching…' : (
                <>
                  {(results.products?.count || 0) + (results.shops?.count || 0)} results
                  {query && <> for "<span className="font-medium text-gray-900">{query}</span>"</>}
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🏪 Shops <span className="text-sm font-normal text-gray-400">({results.shops?.count || shopList.length})</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {shopList.map(s => <ShopCard key={s.slug || s.public_id} shop={s} />)}
                  </div>
                </div>
              )}

              {/* Products */}
              {productList.length > 0 && (type === 'all' || type === 'products') && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🛒 Products <span className="text-sm font-normal text-gray-400">({results.products?.count || productList.length})</span></h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    {productList.map(p => <ProductCard key={p.slug || p.public_id} product={p} />)}
                  </div>
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
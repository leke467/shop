import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchAPI, personalAPI, shopAPI, productAPI, getImageUrl } from '../services/api'
import { useUser } from '../context/UserContext'

// ── Reusable cards ───────────────────────────────────────────
function ShopCard({ shop }) {
  return (
    <Link to={`/shop/${shop.slug}`}>
      <motion.div
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300"
        whileHover={{ y: -6 }}
      >
        {/* Banner */}
        <div className="h-36 bg-gradient-to-br from-primary-400 to-secondary-500 relative overflow-hidden">
          {shop.banner && (
            <img src={getImageUrl(shop.banner)} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        {/* Logo */}
        <div className="absolute top-24 left-5">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border-2 border-white overflow-hidden flex items-center justify-center">
            {shop.logo ? (
              <img src={getImageUrl(shop.logo)} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-600">{shop.name?.[0]}</span>
            )}
          </div>
        </div>
        <div className="pt-10 pb-5 px-5">
          <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-primary-600 transition-colors">{shop.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{shop.tagline || 'Explore amazing products'}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-warning-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {Number(shop.rating_average || 0).toFixed(1)}
            </span>
            <span>{shop.product_count || 0} products</span>
            {shop.is_verified && <span className="text-success-500 font-medium">✓ Verified</span>}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

function ProductCard({ product }) {
  const firstImage = product.primary_image || (product.images?.[0]?.medium || product.images?.[0]?.image)
  return (
    <Link to={`/product/${product.slug || product.public_id}`}>
      <motion.div
        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300"
        whileHover={{ y: -6 }}
      >
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {firstImage ? (
            <img
              src={getImageUrl(typeof firstImage === 'string' ? firstImage : (firstImage.medium || firstImage.image))}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm">
            <span className="font-bold text-gray-900">${Number(product.base_price || 0).toFixed(2)}</span>
            {product.compare_at_price && (
              <span className="ml-2 text-sm text-gray-400 line-through">${Number(product.compare_at_price).toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.shop_name || product.shop?.name || ''}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-warning-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-gray-500">{Number(product.rating_average || 0).toFixed(1)}</span>
            </div>
            {product.purchase_count > 0 && (
              <span className="text-xs text-gray-400">• {product.purchase_count} sold</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// ── Hero ─────────────────────────────────────────────────────
function Hero({ onSearch }) {
  const [query, setQuery] = useState('')
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-950 to-secondary-950 pt-24 pb-32">
      {/* Animated background shapes */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-600/20 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-accent-600/15 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.3)_100%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Discover
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent"> unique </span>
            shops
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            A marketplace where every shop is unique. Find products curated for you, or create your own shop and start selling.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.form
          className="mt-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onSubmit={(e) => { e.preventDefault(); onSearch(query) }}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <svg className="w-5 h-5 text-gray-400 ml-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="home-search"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-4 text-lg focus:outline-none"
              />
              <button
                type="submit"
                className="mr-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-sm hover:shadow-lg transition-all duration-300"
              >
                Search
              </button>
            </div>
          </div>
        </motion.form>

        {/* Quick categories */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {['Fashion', 'Electronics', 'Home & Garden', 'Art', 'Handmade'].map(cat => (
            <button
              key={cat}
              onClick={() => onSearch(cat)}
              className="px-4 py-2 rounded-full bg-white/10 text-sm text-white/80 hover:bg-white/20 hover:text-white border border-white/10 transition-all duration-200"
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function HomePage() {
  const { user, isAuthenticated } = useUser()
  const navigate = useNavigate()
  const [browseMode, setBrowseMode] = useState('products')
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [feedProducts, setFeedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      shopAPI.list({ page_size: 8 }),
      productAPI.list({ page_size: 12 }),
      isAuthenticated ? personalAPI.feed() : Promise.resolve(null),
    ]).then(([shopRes, prodRes, feedRes]) => {
      if (shopRes.status === 'fulfilled') setShops(shopRes.value?.results || shopRes.value || [])
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value?.results || prodRes.value || [])
      if (feedRes.status === 'fulfilled' && feedRes.value) setFeedProducts(feedRes.value?.results || [])
    }).finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleSearch = (query) => {
    navigate(`/explore/products?q=${encodeURIComponent(query)}`)
  }

  const displayItems = browseMode === 'shops' ? shops : products

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero onSearch={handleSearch} />

      {/* Personalized feed (for authenticated users) */}
      {isAuthenticated && feedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">For You</h2>
              <p className="text-sm text-gray-500">Personalized picks based on your activity</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
            {feedProducts.slice(0, 6).map(p => (
              <ProductCard key={p.public_id || p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Browse toggle + content */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Explore</h2>
            <p className="text-gray-500 mt-1">Browse the marketplace by shops or products</p>
          </div>

          {/* Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            {[
              { key: 'products', label: 'Products', icon: '🛒' },
              { key: 'shops', label: 'Shops', icon: '🏪' },
            ].map(tab => (
              <button
                key={tab.key}
                id={`browse-${tab.key}`}
                onClick={() => setBrowseMode(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  browseMode === tab.key
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={browseMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`grid gap-5 ${
                browseMode === 'shops'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {displayItems.map(item => (
                browseMode === 'shops'
                  ? <ShopCard key={item.slug || item.public_id} shop={item} />
                  : <ProductCard key={item.slug || item.public_id} product={item} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* View all CTA */}
        <div className="text-center mt-12">
          <Link
            to="/explore/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition-all duration-300"
          >
            Explore all {browseMode}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Why Marketplace?</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Everything you need, from discovery to checkout</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Unique Shops',
                desc: 'Every shop has its own identity — custom themes, layouts, and branding that make browsing feel personal.',
                gradient: 'from-primary-500 to-secondary-500',
              },
              {
                icon: '🤖',
                title: 'Smart Recommendations',
                desc: 'Our AI learns what you love and serves a personalized feed that evolves with your taste.',
                gradient: 'from-accent-500 to-primary-500',
              },
              {
                icon: '🔒',
                title: 'Secure Payments',
                desc: 'Bank-grade encryption with Stripe and Paystack. Your money is always protected.',
                gradient: 'from-success-500 to-primary-500',
              },
            ].map(f => (
              <motion.div
                key={f.title}
                className="group p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100 transition-all duration-300"
                whileHover={{ y: -4 }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">{f.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold">Ready to start selling?</h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Create your own shop in minutes. Customize everything. Start selling today.
          </p>
          <Link
            to="/create-shop"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-white text-primary-700 font-bold text-lg shadow-2xl shadow-black/20 hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            Create your shop
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
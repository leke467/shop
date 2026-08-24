import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../../context/CartContext'
import { getImageUrl } from '../../../services/api'

export default function ObsidianCatalog({ products = [], shop, onQuickView }) {
  const { addToCart } = useCart()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sort, setSort] = useState('default')

  const extra = shop?.theme?.extra_tokens || {}
  const primaryAccent = extra.primary_color || '#8B5CF6'
  const catalogTitle = extra.categories_title || extra.obsidian_categories_title || 'Curated Catalog'
  const catalogSubtitle = extra.categories_subtitle || extra.obsidian_categories_subtitle || 'Our Products'

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set()
    products.forEach(p => {
      const catName = p.category?.name || p.category_name || p.category
      if (catName) set.add(catName)
    })
    return ['all', ...Array.from(set)]
  }, [products])

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(search.toLowerCase())
      const catName = p.category?.name || p.category_name || p.category
      const matchCategory = selectedCategory === 'all' || catName === selectedCategory
      return matchSearch && matchCategory
    })

    if (sort === 'low') {
      list = [...list].sort((a, b) => Number(a.base_price || a.price || 0) - Number(b.base_price || b.price || 0))
    } else if (sort === 'high') {
      list = [...list].sort((a, b) => Number(b.base_price || b.price || 0) - Number(a.base_price || a.price || 0))
    }

    return list
  }, [products, search, selectedCategory, sort])

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              {catalogSubtitle}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {catalogTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="w-full sm:w-64 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 text-sm transition-all"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
            </div>

            {/* Sort Select */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="default" className="bg-[#0F1420] text-white">Sort: Featured</option>
              <option value="low" className="bg-[#0F1420] text-white">Price: Low to High</option>
              <option value="high" className="bg-[#0F1420] text-white">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2.5 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/10">
            <span className="text-4xl">📦</span>
            <p className="text-slate-400 text-lg mt-3">No products found matching your filter.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const img = product.primary_image || product.image || product.images?.[0]?.medium || product.images?.[0]?.image
                const imgUrl = img ? getImageUrl(typeof img === 'string' ? img : (img.medium || img.image || img)) : null
                const price = Number(product.base_price || product.price || 0)

                return (
                  <motion.div
                    key={product.id || product.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group relative rounded-3xl bg-[#121826]/80 border border-white/10 overflow-hidden shadow-xl hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 transition-all flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600 bg-slate-950">
                          🛍️
                        </div>
                      )}

                      {/* Quick View Floating Button */}
                      <button
                        onClick={() => onQuickView && onQuickView(product)}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        title="Quick Preview"
                      >
                        👁️
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {product.category?.name && (
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                            {product.category.name}
                          </span>
                        )}
                        <h3 className="font-bold text-lg text-white mt-1 group-hover:text-purple-300 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {product.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Price & Add to Cart Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Price</span>
                          <span className="text-xl font-black text-white">
                            ₦{price.toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${primaryAccent}, #4C1D95)`
                          }}
                        >
                          <span>🛒</span> Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { mockProducts, mockCategories } from '../data/mockData'
import ProductCard from '../components/products/ProductCard'
import { useSearchParams } from 'react-router-dom'

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || 'All'
  
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [priceRange, setPriceRange] = useState([0, 200])
  const [sortOption, setSortOption] = useState('featured')
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setProducts(mockProducts)
      setIsLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products]

      // Filter by category
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(product => 
          product.categories.includes(selectedCategory)
        )
      }

      // Filter by price range
      filtered = filtered.filter(product => 
        product.price >= priceRange[0] && product.price <= priceRange[1]
      )

      // Filter by search text
      if (searchText) {
        const search = searchText.toLowerCase()
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(search) || 
          product.description.toLowerCase().includes(search) ||
          product.shopName.toLowerCase().includes(search)
        )
      }

      // Sort products
      switch (sortOption) {
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price)
          break
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price)
          break
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'featured':
        default:
          // Keep default order for featured
          break
      }

      setFilteredProducts(filtered)
    }
  }, [products, selectedCategory, priceRange, sortOption, searchText])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSearchParams({ category })
  }

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value)
    setPriceRange([0, value])
  }

  const handleSortChange = (e) => {
    setSortOption(e.target.value)
  }

  const handleSearchChange = (e) => {
    setSearchText(e.target.value)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore All Products</h1>
          <p className="text-gray-600">Discover unique products from all our shops in one place</p>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchText}
                  onChange={handleSearchChange}
                  className="input pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range: Up to ${priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange[1]}
                onChange={handlePriceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sort Options */}
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="input"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories sidebar */}
          <div className="w-full lg:w-1/4 xl:w-1/5">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedCategory === 'All'
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {mockCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategoryChange(category.name)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedCategory === category.name
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                      <span className="ml-1 text-xs text-gray-500">({category.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Products grid */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div>
                <p className="text-gray-600 mb-4">{filteredProducts.length} products found</p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExplorePage
import React from 'react'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { Link } from 'react-router-dom'

export default function WishlistPage() {
  // Mock wishlist data
  const wishlistItems = [
    { id: 1, name: 'Premium Leather Bag', price: 45000, shopName: 'LeatherWorks NG', image: 'https://placehold.co/400x400/2563eb/ffffff?text=Bag' },
    { id: 2, name: 'Handmade Ceramic Vase', price: 15000, shopName: 'Pottery House', image: 'https://placehold.co/400x400/059669/ffffff?text=Vase' },
    { id: 3, name: 'Organic Shea Butter', price: 5000, shopName: 'Nature Secrets', image: 'https://placehold.co/400x400/d97706/ffffff?text=Butter' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8"
    >
      <SEOHead title="My Wishlist | Marketplace" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Wishlist</h1>
          <span className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-1 px-3 rounded-full text-sm font-medium">
            {wishlistItems.length} Items
          </span>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlistItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">{item.shopName}</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{item.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">₦{item.price.toLocaleString()}</span>
                    <button className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Save items you love to your wishlist to easily find them later or share with friends.</p>
            <Link to="/explore" className="inline-flex px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

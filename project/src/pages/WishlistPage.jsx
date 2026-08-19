import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()

  const [itemToRemove, setItemToRemove] = useState(null)
  const [addedToast, setAddedToast] = useState(null)

  const handleAddToCart = async (item) => {
    try {
      await addToCart({
        variant_id: item.variant_id || item.id,
        quantity: 1,
        product_name: item.name,
        variant_name: item.variant_name || 'Standard',
        unit_price: item.price,
      })
      setAddedToast(`Added "${item.name}" to cart!`)
      setTimeout(() => setAddedToast(null), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  const confirmRemove = () => {
    if (itemToRemove) {
      removeFromWishlist(itemToRemove.slug || itemToRemove.id)
      setItemToRemove(null)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      <SEOHead title="My Wishlist | Marketplace" description="View and manage your saved wishlist items." />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Wishlist</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saved items you love, ready for instant checkout.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 py-1.5 px-4 rounded-full text-sm font-bold shadow-xs">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
            </span>
            {wishlist.length > 0 && (
              <button 
                onClick={clearWishlist}
                className="text-xs text-gray-400 hover:text-error-500 transition-colors font-medium px-2 py-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Added Toast */}
        <AnimatePresence>
          {addedToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-300 text-sm flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span className="font-semibold">{addedToast}</span>
              </div>
              <Link to="/cart" className="font-bold underline hover:text-success-800 dark:hover:text-success-200">
                View Cart &rarr;
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            <AnimatePresence>
              {wishlist.map((item, i) => (
                <motion.div 
                  key={item.id || item.slug || i}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col justify-between group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                      src={item.image || 'https://placehold.co/400x400/2563eb/ffffff?text=Product'} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x400/2563eb/ffffff?text=Product'
                      }}
                    />
                    <button 
                      onClick={() => setItemToRemove(item)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all shadow-md hover:scale-110 active:scale-95"
                      title="Remove from Wishlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {item.shop_name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium truncate">
                          {item.shop_name}
                        </p>
                      )}
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Link to={`/product/${item.slug || item.id}`}>
                          {item.name}
                        </Link>
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-600/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary-50 dark:bg-primary-900/30 text-4xl mb-6 shadow-xs">
              ❤️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Explore products from thousands of verified Nigerian stores and save your favorite items here for easy access.
            </p>
            <Link 
              to="/explore/products" 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-95 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-primary-600/25"
            >
              <span>Explore Products</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {itemToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-gray-900 p-6 rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-error-50 dark:bg-error-900/30 text-error-600 flex items-center justify-center text-xl mb-4">
                🗑️
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Remove from Wishlist?</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                Are you sure you want to remove <span className="font-semibold text-gray-800 dark:text-gray-200">"{itemToRemove.name}"</span> from your wishlist?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setItemToRemove(null)} 
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRemove} 
                  className="px-5 py-2 text-sm font-semibold bg-error-600 hover:bg-error-700 text-white rounded-xl shadow-md shadow-error-600/20 transition-all"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

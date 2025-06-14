import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function ShopCard({ shop }) {
  return (
    <Link to={`/shop/${shop.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="overflow-hidden rounded-xl shadow-md bg-white h-full"
      >
        <div className="h-48 overflow-hidden">
          <img 
            src={shop.banner} 
            alt={shop.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="relative px-6 pt-8 pb-6">
          <div className="absolute -top-8 left-6">
            <div className="h-16 w-16 rounded-full border-4 border-white overflow-hidden">
              <img 
                src={shop.logo} 
                alt={`${shop.name} logo`} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">{shop.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{shop.description}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-700">{shop.rating}</span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(shop.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short'
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default ShopCard
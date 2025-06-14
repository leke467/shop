import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function CategoryCard({ category }) {
  return (
    <Link to={`/explore/products?category=${category.name}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="overflow-hidden rounded-xl shadow-md bg-white"
      >
        <div className="relative h-32 overflow-hidden">
          <img 
            src={category.image} 
            alt={category.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-3 w-full">
              <h3 className="text-white font-semibold text-center">{category.name}</h3>
              <p className="text-white/70 text-xs text-center">{category.count} items</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default CategoryCard
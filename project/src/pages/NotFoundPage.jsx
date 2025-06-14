import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function NotFoundPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center">
      <div className="container-custom">
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-9xl font-bold text-primary-300">404</h1>
            <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
            <p className="text-xl text-gray-600 mb-8">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/" className="btn-primary">
                Return Home
              </Link>
              <Link to="/explore/products" className="btn-outline">
                Explore Products
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
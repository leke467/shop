import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
      <motion.div className="text-center px-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-8xl font-bold bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all">
            Go Home
          </Link>
          <Link to="/explore/products" className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Explore
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
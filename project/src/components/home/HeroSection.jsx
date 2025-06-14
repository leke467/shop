import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function HeroSection() {
  return (
    <div className="relative h-screen max-h-[800px] min-h-[600px] overflow-hidden bg-gray-900">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
          alt="Shopping experience" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50" />
      </div>

      <div className="container-custom relative z-10 h-full flex items-center">
        <div className="max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Discover a New <span className="gradient-text">Shopping Experience</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-300 mb-8"
          >
            Explore unique shops, each with their own identity and products, or browse everything in one place. 
            The future of shopping is here.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link 
              to="/explore/products" 
              className="btn-primary text-center py-3 px-8 text-lg"
            >
              Explore Products
            </Link>
            <Link 
              to="/create-shop" 
              className="btn-outline bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-center py-3 px-8 text-lg"
            >
              Create Your Shop
            </Link>
          </motion.div>

          {/* Animated statistic counters */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="flex flex-wrap gap-8 mt-12"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-white">100+</p>
              <p className="text-gray-400">Shops</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">5000+</p>
              <p className="text-gray-400">Products</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">20k+</p>
              <p className="text-gray-400">Customers</p>
            </div>
          </motion.div>
        </div>

        {/* Animated floating cards */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="hidden lg:block absolute right-[10%] top-1/2 transform -translate-y-1/2"
        >
          <div className="relative">
            {/* Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute top-0 right-0 bg-white rounded-lg shadow-2xl p-4 w-64 transform -rotate-6 z-20"
            >
              <div className="rounded-md overflow-hidden mb-3">
                <img src="https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Fashion" className="w-full h-32 object-cover" />
              </div>
              <h3 className="font-semibold text-gray-800">Fashion Forward</h3>
              <p className="text-sm text-gray-600">Trending styles for the season</p>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-20 right-20 bg-white rounded-lg shadow-2xl p-4 w-64 transform rotate-3 z-10"
            >
              <div className="rounded-md overflow-hidden mb-3">
                <img src="https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Tech" className="w-full h-32 object-cover" />
              </div>
              <h3 className="font-semibold text-gray-800">Tech Gadgets</h3>
              <p className="text-sm text-gray-600">Latest innovations for your lifestyle</p>
            </motion.div>
            
            {/* Card 3 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute top-48 right-5 bg-white rounded-lg shadow-2xl p-4 w-64 transform -rotate-2 z-0"
            >
              <div className="rounded-md overflow-hidden mb-3">
                <img src="https://images.pexels.com/photos/3715086/pexels-photo-3715086.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Home" className="w-full h-32 object-cover" />
              </div>
              <h3 className="font-semibold text-gray-800">Home Essentials</h3>
              <p className="text-sm text-gray-600">Beautiful items for your space</p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center"
      >
        <p className="text-sm mb-2">Scroll to explore</p>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default HeroSection
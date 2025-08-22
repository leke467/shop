import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mockCategories, mockShops, mockProducts } from '../data/mockData'
import CategoryCard from '../components/home/CategoryCard'
import ShopCard from '../components/home/ShopCard'
import FeaturedProductCard from '../components/products/ProductCard'
import HeroSection from '../components/home/HeroSection'
import { useUser } from '../context/UserContext'
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage'

function HomePage() {
  const [featured, setFeatured] = useState({
    categories: [],
    shops: [],
    products: []
  })
  const { login } = useUser()

  useEffect(() => {
    // Set a test user as admin for demo purposes
    // login({ id: 'user-1', name: 'Test User' }, true)
    
    // Simulate API fetch for featured items
    setFeatured({
      categories: mockCategories.slice(0, 6),
      shops: mockShops.slice(0, 3),
      products: mockProducts.filter(product => product.rating >= 4.7).slice(0, 4)
    })
  }, [login])

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className="min-h-screen pb-20">
      <HeroSection />

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <Link to="/explore/products" className="text-primary-600 hover:text-primary-700 font-semibold">
              View All
            </Link>
          </div>
          
          <motion.div 
            variants={containerAnimation}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"
          >
            {featured.categories.map(category => (
              <motion.div key={category.id} variants={itemAnimation}>
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Shops */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">Featured Shops</h2>
            <Link to="/explore/shops" className="text-primary-600 hover:text-primary-700 font-semibold">
              View All Shops
            </Link>
          </div>
          
          <motion.div 
            variants={containerAnimation}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featured.shops.map(shop => (
              <motion.div key={shop.id} variants={itemAnimation}>
                <ShopCard shop={shop} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link to="/explore/products" className="text-primary-600 hover:text-primary-700 font-semibold">
              View All Products
            </Link>
          </div>
          
          <motion.div 
            variants={containerAnimation}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featured.products.map(product => (
              <motion.div key={product.id} variants={itemAnimation}>
                <FeaturedProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="text-white mb-8 lg:mb-0 lg:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Start Your Own Shop Today</h2>
              <p className="text-white/80 text-lg mb-6">
                Join our community of sellers and start showcasing your products to thousands of potential customers.
              </p>
              <Link to="/create-shop" className="inline-block px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-md">
                Create Your Shop
              </Link>
            </div>
            <div className="lg:w-2/5">
              <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src="https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Start your shop" 
                className="rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
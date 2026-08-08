import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export default function BlogListPage() {
  const posts = [
    {
      slug: 'how-to-start-selling-online-in-nigeria',
      title: 'How to Start Selling Online in Nigeria in 2026',
      excerpt: 'A comprehensive guide to setting up your first e-commerce store, sourcing products, and handling logistics nationwide.',
      image: 'https://placehold.co/800x400/3b82f6/ffffff?text=E-commerce+Nigeria',
      date: 'Aug 5, 2026',
      author: 'Jane Doe',
      tags: ['Guide', 'E-commerce']
    },
    {
      slug: 'top-10-marketing-strategies',
      title: 'Top 10 Marketing Strategies for Small Businesses',
      excerpt: 'Discover cost-effective ways to drive traffic to your store using social media, SEO, and community engagement.',
      image: 'https://placehold.co/800x400/8b5cf6/ffffff?text=Marketing',
      date: 'Aug 1, 2026',
      author: 'John Smith',
      tags: ['Marketing', 'Tips']
    },
    {
      slug: 'understanding-shipping-zones',
      title: 'Understanding Shipping Zones and Pricing',
      excerpt: 'Learn how to configure your delivery zones to maximize profit while keeping customers happy with affordable rates.',
      image: 'https://placehold.co/800x400/10b981/ffffff?text=Shipping',
      date: 'Jul 28, 2026',
      author: 'Logistics Team',
      tags: ['Shipping']
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16"
    >
      <SEOHead title="Blog | Marketplace" description="Latest news, tips, and guides for sellers and buyers." />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Marketplace Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Insights, guides, and stories from our community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.div 
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-800 flex flex-col"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 flex space-x-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                  <span>{post.date}</span>
                  <span>{post.author}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                  <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <Link to={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center hover:underline">
                  Read Article
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Pagination placeholder */}
        <div className="mt-16 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm space-x-2">
            <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Previous</button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">1</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">2</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
          </nav>
        </div>
      </div>
    </motion.div>
  )
}

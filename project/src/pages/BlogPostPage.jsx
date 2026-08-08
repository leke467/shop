import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'

export default function BlogPostPage() {
  const { slug } = useParams()
  
  // Mock post data based on slug
  const post = {
    title: 'How to Start Selling Online in Nigeria in 2026',
    image: 'https://placehold.co/1200x600/3b82f6/ffffff?text=E-commerce+Nigeria',
    date: 'Aug 5, 2026',
    author: 'Jane Doe',
    content: `
      <p class="mb-4">Starting an online business in Nigeria has never been more accessible. With internet penetration at an all-time high and a growing middle class, the opportunity for e-commerce entrepreneurs is massive.</p>
      <h2 class="text-2xl font-bold mt-8 mb-4">1. Finding Your Niche</h2>
      <p class="mb-4">The first step is identifying what to sell. Look for products that have high demand but are perhaps underserved in your local area or online. Fashion, beauty products, electronics accessories, and niche groceries are always popular.</p>
      <h2 class="text-2xl font-bold mt-8 mb-4">2. Setting Up Your Store</h2>
      <p class="mb-4">Using our marketplace platform, you can set up a professional storefront in minutes. Focus on high-quality product images and detailed descriptions that answer potential customer questions before they even ask.</p>
      <blockquote class="border-l-4 border-blue-500 pl-4 italic my-6 text-xl text-gray-700 dark:text-gray-300">"The secret to e-commerce success is not just what you sell, but how you present it and how you treat your customers."</blockquote>
      <h2 class="text-2xl font-bold mt-8 mb-4">3. Logistics and Delivery</h2>
      <p class="mb-4">Logistics can be challenging, but partnering with established delivery companies like GIG Logistics or Topship can streamline the process. Be transparent about delivery times and costs with your customers to build trust.</p>
    `
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16"
    >
      <SEOHead title={`${post.title} | Blog`} />
      
      {/* Hero Section */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-4xl mx-auto w-full">
          <Link to="/blog" className="text-gray-300 hover:text-white flex items-center mb-6 w-fit transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blog
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">{post.title}</h1>
          <div className="flex items-center text-gray-300 space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">{post.author[0]}</div>
              <span>{post.author}</span>
            </div>
            <span>•</span>
            <span>{post.date}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Social Share Sidebar (Desktop) */}
        <div className="hidden md:flex flex-col space-y-4 md:col-span-1 pt-2">
          <button className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-11 bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 pl-0 md:pl-24">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Discussion (2)</h3>
        
        <div className="space-y-6 mb-12">
          {/* Comment 1 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-4">M</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Mike Ogundele</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Great article! I've been thinking about setting up my own store. Do you have any specific recommendations for sourcing locally made fashion items?</p>
          </div>
          
          {/* Comment 2 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 ml-8 md:ml-12 border-l-4 border-l-blue-500">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-4">J</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Jane Doe <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full ml-2">Author</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">Hi Mike! Absolutely. Check out local trade fairs and artisan markets in Lagos and Aba. Building direct relationships with local tailors is usually the best approach to start.</p>
          </div>
        </div>

        {/* Add Comment */}
        <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl p-6 md:p-8">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Leave a Reply</h4>
          <textarea 
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-32 mb-4" 
            placeholder="What are your thoughts?"
          ></textarea>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
            Post Comment
          </button>
        </div>
      </div>
    </motion.div>
  )
}

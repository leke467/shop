import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export const BLOG_POSTS = [
  {
    slug: 'how-to-start-selling-online-in-nigeria',
    title: 'How to Start Selling Online in Nigeria in 2026: The Ultimate Guide',
    excerpt: 'A comprehensive step-by-step roadmap to establishing a high-converting digital storefront, securing inventory, and mastering logistics across all 36 Nigerian states.',
    image: 'https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=800&auto=format&fit=crop&q=80',
    date: 'Aug 15, 2026',
    readTime: '6 min read',
    author: 'Adebayo Ogunlesi',
    authorRole: 'Head of Merchant Growth',
    tags: ['E-commerce', 'Guide', 'Growth'],
    content: `
      <p class="text-lg leading-relaxed mb-6">Starting an online business in Nigeria has evolved drastically. With nationwide internet penetration reaching unprecedented levels and digital payment adoption surging across Lagos, Abuja, Port Harcourt, and beyond, e-commerce is the new frontline of Nigerian commerce.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Identifying Your High-Demand Niche</h2>
      <p class="leading-relaxed mb-6">Before setting up your shop, analyze consumer demand. Top-performing categories in Nigeria include ready-to-wear African fashion, organic skincare, phone and computing accessories, artisan homeware, and packaged foods. Focus on product categories with repeat purchase cycles and healthy margins.</p>
      
      <div class="my-8 p-6 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500">
        <p class="font-semibold text-primary-900 dark:text-primary-200">💡 Pro Tip for Nigerian Sellers:</p>
        <p class="text-sm text-primary-800 dark:text-primary-300 mt-1">Bundle complementary products together (e.g., Shea butter + black soap) to increase your Average Order Value (AOV) and offset shipping costs.</p>
      </div>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Building Trust with Escrow Payments</h2>
      <p class="leading-relaxed mb-6">The biggest historical roadblock to Nigerian e-commerce has been trust between strangers. Our marketplace integrates automated Escrow and verified payment gateways (Moniepoint, Monnify, Cards, and Bank Transfers). The buyer pays into escrow, and funds are disbursed once the delivery code is confirmed.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Configuring Nationwide Shipping Zones</h2>
      <p class="leading-relaxed mb-6">Logistics can make or break your store. Leverage zone-based shipping rules: set instant intrastate rates for intra-city couriers and tiered interstate rates for dispatch to major hubs. Always provide accurate delivery timeframes to delight your customers.</p>
    `
  },
  {
    slug: 'top-10-marketing-strategies',
    title: 'Top 10 Guerrilla Marketing Strategies for Small Businesses in Nigeria',
    excerpt: 'Discover cost-effective tactics to drive targeted traffic to your storefront using Instagram Reels, WhatsApp Business broadcasts, SEO, and micro-influencer partnerships.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    date: 'Aug 10, 2026',
    readTime: '5 min read',
    author: 'Ngozi Eze',
    authorRole: 'Digital Marketing Strategist',
    tags: ['Marketing', 'Growth', 'Social Media'],
    content: `
      <p class="text-lg leading-relaxed mb-6">Marketing on a budget requires creativity over capital. Here is how top Nigerian merchants generate consistent sales without burning cash on billboard ads.</p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Harnessing WhatsApp Catalogues and Broadcast Lists</h2>
      <p class="leading-relaxed mb-6">WhatsApp is Nigeria's default commerce OS. Use broadcast lists for VIP customers, announcing new drops and flash coupons 2 hours before general release.</p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Micro-Influencer Gifting</h2>
      <p class="leading-relaxed mb-6">Instead of paying millions to mega celebrities, partner with 10 micro-influencers (5k-25k engaged followers) in your specific niche. Send them PR packages with customized promo codes.</p>
    `
  },
  {
    slug: 'understanding-shipping-zones',
    title: 'Mastering Nigerian Shipping Zones, Logistics & Delivery Economics',
    excerpt: 'Learn how to configure your delivery zones to maximize profit while keeping customers happy with transparent, affordable delivery rates across all 37 states and territories.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    date: 'Jul 28, 2026',
    readTime: '4 min read',
    author: 'Chinedu Okonkwo',
    authorRole: 'Logistics Director',
    tags: ['Logistics', 'Guide', 'E-commerce'],
    content: `
      <p class="text-lg leading-relaxed mb-6">Delivering physical goods across Nigeria's diverse geographic terrain requires a structured logistics matrix. Here is how to configure zone pricing accurately.</p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">The 3-Tier State Clustering Model</h2>
      <p class="leading-relaxed mb-6">Cluster your delivery states into Tier 1 (Lagos & Ogun), Tier 2 (Abuja, Rivers, Oyo, Kano, Anambra, Edo), and Tier 3 (Regional & Far Northern states) to balance speed and margin.</p>
    `
  },
  {
    slug: 'secure-escrow-payments-explained',
    title: 'Why Escrow Is Transforming Buyer Confidence in Nigerian Digital Commerce',
    excerpt: 'An inside look at how buyer protection, instant fraud prevention, and seller assurance work together seamlessly to eliminate payment friction.',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    date: 'Jul 20, 2026',
    readTime: '5 min read',
    author: 'Dr. Fatima Bello',
    authorRole: 'Fintech & Security Lead',
    tags: ['Fintech', 'Security', 'E-commerce'],
    content: `
      <p class="text-lg leading-relaxed mb-6">Confidence is the currency of the digital economy. Discover how our escrow engine secures every transaction from checkout to doorstep confirmation.</p>
    `
  },
]

const ALL_TAGS = ['All', 'E-commerce', 'Guide', 'Marketing', 'Logistics', 'Growth', 'Fintech', 'Social Media']

export default function BlogListPage() {
  const [selectedTag, setSelectedTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesTag = selectedTag === 'All' || post.tags.includes(selectedTag)
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesTag && matchesSearch
    })
  }, [selectedTag, searchQuery])

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 md:py-16 transition-colors duration-300"
    >
      <SEOHead title="Marketplace Blog | Insights, Guides & Seller Tips" description="Actionable articles, growth guides, e-commerce tips, and industry updates for Nigerian merchants and buyers." />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Knowledge Hub
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Marketplace Blog & Resources
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Practical growth guides, marketing tips, and logistics playbooks designed for Nigerian businesses.
          </p>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="mb-10 space-y-4">
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles by title or keyword…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tag Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  selectedTag === tag
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25 scale-105'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Post Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredPosts.map((post, i) => (
                <motion.article 
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {post.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.preventDefault()
                              setSelectedTag(tag)
                            }}
                            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs text-gray-900 dark:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs hover:bg-primary-600 hover:text-white transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center justify-between">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2.5 line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 pt-4">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center">
                        {post.author[0]}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[130px]">{post.author}</span>
                    </div>

                    <Link 
                      to={`/blog/${post.slug}`} 
                      className="pt-4 text-primary-600 dark:text-primary-400 font-bold text-xs inline-flex items-center hover:underline gap-1"
                    >
                      Read Story &rarr;
                    </Link>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">No blog posts match your current search query or filter.</p>
            <button 
              onClick={() => { setSelectedTag('All'); setSearchQuery('') }}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm shadow-md"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { useUser } from '../context/UserContext'
import { BLOG_POSTS } from './BlogListPage'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { user } = useUser()

  const post = BLOG_POSTS.find(p => p.slug === slug) || {
    slug: slug || 'how-to-start-selling-online-in-nigeria',
    title: slug ? slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'How to Start Selling Online in Nigeria in 2026',
    excerpt: 'Comprehensive insights into digital storefront operations and modern marketplace tactics in Nigeria.',
    image: 'https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=1200&auto=format&fit=crop&q=80',
    date: 'Aug 15, 2026',
    readTime: '5 min read',
    author: 'Adebayo Ogunlesi',
    authorRole: 'Marketplace Strategist',
    tags: ['E-commerce', 'Guide', 'Growth'],
    content: `
      <p class="text-lg leading-relaxed mb-6">Starting an online business in Nigeria has evolved drastically. With nationwide internet penetration reaching unprecedented levels and digital payment adoption surging across Lagos, Abuja, Port Harcourt, and beyond, e-commerce is the new frontline of Nigerian commerce.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Identifying Your High-Demand Niche</h2>
      <p class="leading-relaxed mb-6">Before setting up your shop, analyze consumer demand. Top-performing categories in Nigeria include ready-to-wear African fashion, organic skincare, phone and computing accessories, artisan homeware, and packaged foods. Focus on product categories with repeat purchase cycles and healthy margins.</p>
      
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Building Trust with Escrow Payments</h2>
      <p class="leading-relaxed mb-6">The biggest historical roadblock to Nigerian e-commerce has been trust between strangers. Our marketplace integrates automated Escrow and verified payment gateways (Moniepoint, Monnify, Cards, and Bank Transfers). The buyer pays into escrow, and funds are disbursed once the delivery code is confirmed.</p>
    `
  }

  // Comments State
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Mike Ogundele',
      avatar: 'M',
      time: '2 days ago',
      content: "Great article! I've been thinking about setting up my own store on this platform. Do you have any specific recommendations for sourcing locally made fashion items in Lagos?",
      isAuthor: false,
    },
    {
      id: 2,
      author: 'Adebayo Ogunlesi',
      avatar: 'A',
      time: '1 day ago',
      content: 'Hi Mike! Absolutely. Check out local artisan hubs and fashion clusters in Lagos (Tejuosho & Balogun) and Aba. Building direct relationships with local tailors gives you unique designs and higher margin control.',
      isAuthor: true,
    }
  ])

  const [commentName, setCommentName] = useState(user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '')
  const [commentText, setCommentText] = useState('')
  const [copyToast, setCopyToast] = useState(false)
  const [commentSubmitted, setCommentSubmitted] = useState(false)

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://multishopng.com/blog/${post.slug}`

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Read "${post.title}" on MultiShopNG:`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer')
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this article: "${post.title}" - ${currentUrl}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2500)
    }
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const authorName = commentName.trim() || user?.first_name || 'Guest Reader'
    const newComment = {
      id: Date.now(),
      author: authorName,
      avatar: authorName[0]?.toUpperCase() || 'G',
      time: 'Just now',
      content: commentText.trim(),
      isAuthor: false,
    }

    setComments(prev => [...prev, newComment])
    setCommentText('')
    setCommentSubmitted(true)
    setTimeout(() => setCommentSubmitted(false), 3000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors duration-300"
    >
      <SEOHead title={`${post.title} | Blog`} description={post.excerpt} />
      
      {/* Hero Section */}
      <div className="w-full h-[45vh] md:h-[55vh] relative overflow-hidden bg-gray-900">
        <img 
          src={post.image} 
          alt={post.title} 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-4xl mx-auto w-full">
          <Link 
            to="/blog" 
            className="text-gray-300 hover:text-white flex items-center mb-4 w-fit transition-colors text-sm font-semibold bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blog
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags?.map(t => (
              <span key={t} className="bg-primary-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center text-gray-300 text-xs sm:text-sm gap-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold mr-2.5 text-sm shadow-sm">
                {post.author[0]}
              </div>
              <span className="font-semibold text-white">{post.author}</span>
            </div>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime || '5 min read'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Social Share Floating Sidebar (Desktop) */}
        <div className="hidden md:flex flex-col space-y-3 md:col-span-1 pt-4 sticky top-28 self-start">
          <button 
            onClick={handleShareTwitter}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-sky-500 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all hover:scale-110"
            title="Share on X / Twitter"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
          
          <button 
            onClick={handleShareWhatsApp}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-emerald-500 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all hover:scale-110"
            title="Share on WhatsApp"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
          
          <button 
            onClick={handleShareFacebook}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-blue-600 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all hover:scale-110"
            title="Share on Facebook"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
          </button>

          <button 
            onClick={handleCopyLink}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all hover:scale-110"
            title="Copy link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>

        {/* Article Body */}
        <div className="md:col-span-11 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200">
          
          {/* Mobile Share Bar */}
          <div className="flex md:hidden items-center justify-between py-3 px-4 mb-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Share article:</span>
            <div className="flex gap-2">
              <button onClick={handleShareTwitter} className="p-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-lg text-xs font-bold">X</button>
              <button onClick={handleShareWhatsApp} className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg text-xs font-bold">WA</button>
              <button onClick={handleShareFacebook} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg text-xs font-bold">FB</button>
              <button onClick={handleCopyLink} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold">Copy</button>
            </div>
          </div>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          {/* Author Box */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {post.author[0]}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{post.author}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{post.authorRole || 'Contributing Author'} • MultiShopNG Research & Growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold shadow-2xl flex items-center gap-2"
          >
            <span>✓</span> Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discussion & Comments Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 md:pl-24">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Discussion ({comments.length})
          </h3>
          
          <div className="space-y-4 mb-8">
            {comments.map(c => (
              <div 
                key={c.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  c.isAuthor 
                    ? 'bg-primary-50/40 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 ml-4 sm:ml-8' 
                    : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold text-xs flex items-center justify-center">
                      {c.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        {c.author}
                        {c.isAuthor && (
                          <span className="bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Author
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400">{c.time}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-11">
                  {c.content}
                </p>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3">Leave a Comment</h4>
            
            {commentSubmitted && (
              <div className="mb-4 p-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-xs font-semibold">
                ✓ Your comment has been posted to the discussion!
              </div>
            )}

            <div className="space-y-3">
              <div>
                <input 
                  type="text" 
                  placeholder="Your Name (e.g. Tunde Adeyemi)"
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <textarea 
                  required
                  rows={3}
                  placeholder="Share your thoughts or ask a question…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-600/20 disabled:opacity-50 transition-all"
              >
                Post Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

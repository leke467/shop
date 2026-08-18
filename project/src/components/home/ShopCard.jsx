import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../services/api'

function getShopTemplateMeta(shop) {
  const tid = (shop?.template_id || shop?.template || '').toLowerCase()
  const isHoney = tid === 'honeyspicy' || tid === 'honey' || shop?.name?.toLowerCase().includes('honey')

  if (isHoney) {
    return {
      isPremium: true,
      gradient: 'from-amber-400 via-orange-400 to-amber-600',
      cardStyle: 'border-2 border-amber-400 shadow-md shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/25 hover:border-amber-500 bg-gradient-to-b from-amber-50/40 via-white to-white',
      premiumBadge: '👑 PREMIUM STORE',
    }
  }

  // Standard/Normal stores: clean, minimal card
  return {
    isPremium: false,
    gradient: 'from-primary-400 to-secondary-500',
    cardStyle: 'border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 bg-white',
  }
}

function ShopCard({ shop }) {
  const meta = getShopTemplateMeta(shop)
  const bannerUrl = shop.banner ? getImageUrl(shop.banner) : null
  const logoUrl = shop.logo ? getImageUrl(shop.logo) : null

  return (
    <Link to={`/${shop.slug || shop.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className={`overflow-hidden rounded-2xl ${meta.cardStyle} transition-all duration-300 flex flex-col h-full relative`}
      >
        <div className={`h-36 relative overflow-hidden bg-gradient-to-r ${meta.gradient}`}>
          {bannerUrl && (
            <img 
              src={bannerUrl} 
              alt={shop.name} 
              className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
            />
          )}

          {meta.isPremium && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-black/75 text-amber-300 border border-amber-400/60 backdrop-blur-md shadow-xs">
                👑 PREMIUM STORE
              </span>
            </div>
          )}

          {logoUrl && (
            <div className="absolute -bottom-4 left-5 h-14 w-14 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md">
              <img 
                src={logoUrl} 
                alt={`${shop.name} logo`} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className={`p-5 ${logoUrl ? 'pt-6' : 'pt-5'} flex-1 flex flex-col justify-between`}>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1 truncate hover:text-amber-600 transition-colors">{shop.name}</h3>
            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{shop.tagline || shop.description || ''}</p>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center text-amber-500 font-bold">
              <span>⭐</span>
              <span className="ml-1">{Number(shop.rating_average || shop.rating || 0).toFixed(1)}</span>
            </div>
            <span className="text-gray-400 font-medium">
              {shop.product_count || 0} products
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default ShopCard
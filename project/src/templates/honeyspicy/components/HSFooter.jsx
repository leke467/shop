import { Link } from 'react-router-dom'
import { getImageUrl } from '../../../services/api'

export default function HSFooter({ shop, shopSlug }) {
  const base = shopSlug || shop?.slug || ''
  const basePath = base ? `/shop/${base}` : '/'
  const socialLinks = shop?.social_links || {}

  return (
    <footer className="hs-footer">
      <div className="hs-container">
        <div className="hs-footer-grid">
          <div className="hs-footer-brand">
            <div className="hs-footer-logo">
              {shop?.logo ? (
                <img src={getImageUrl(shop.logo)} alt={shop?.name} />
              ) : (
                <span className="hs-footer-logo-text">{shop?.name?.[0] || '🍯'}</span>
              )}
              <span>{shop?.name || 'Shop'}</span>
            </div>
            <p>{shop?.tagline || shop?.description || 'Quality products crafted with love.'}</p>
          </div>

          <div className="hs-footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to={basePath}>Home</Link></li>
              <li><Link to={`${basePath}/menu`}>Menu</Link></li>
              <li><Link to={`${basePath}/reviews`}>Reviews</Link></li>
              <li><Link to={`${basePath}/about`}>About Us</Link></li>
              <li><Link to={`${basePath}/contact`}>Contact</Link></li>
            </ul>
          </div>

          <div className="hs-footer-contact">
            <h4>Contact</h4>
            <ul>
              {shop?.email && <li>📧 {shop.email}</li>}
              {shop?.phone && <li>📞 {shop.phone}</li>}
              {shop?.address && <li>📍 {shop.address}</li>}
            </ul>
          </div>

          <div className="hs-footer-social">
            <h4>Follow Us</h4>
            <div className="hs-social-links">
              {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
              {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>}
              {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">Website</a>}
            </div>
          </div>
        </div>

        <div className="hs-footer-bottom">
          <p>© {new Date().getFullYear()} {shop?.name || 'Shop'}. All rights reserved.</p>
          <p>
            Powered by <Link to="/">MultiShop</Link>
            <br/><a href="https://apexlabs.it.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Powered by ApexLabs</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

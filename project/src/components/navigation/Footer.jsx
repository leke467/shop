import { Link } from 'react-router-dom'
import Logo from '../Logo'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        {/* Brand & Social Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-gray-800">
          <div className="space-y-1 max-w-md">
            <Link to="/" className="inline-block">
              <Logo size="md" isDarkBg={true} />
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              The ultimate multi-vendor marketplace with customizable shops and seamless escrow shopping.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-white transition p-1" title="Facebook">
              <span className="sr-only">Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" className="hover:text-white transition p-1" title="Instagram">
              <span className="sr-only">Instagram</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
            <a href="#" className="hover:text-white transition p-1" title="Twitter">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </a>
          </div>
        </div>

        {/* Links Grid: Hidden on mobile, 3 columns on desktop */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 py-6 text-sm">
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-2.5 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/explore/products" className="hover:text-white transition">Explore</Link></li>
              <li><Link to="/create-shop" className="hover:text-white transition">Create Shop</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Cart</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-white mb-2.5 text-sm uppercase tracking-wider">Popular</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li><Link to="/explore/products?category=electronics" className="hover:text-white transition">Electronics</Link></li>
              <li><Link to="/explore/products?category=fashion" className="hover:text-white transition">Fashion</Link></li>
              <li><Link to="/explore/products?category=home" className="hover:text-white transition">Home & Living</Link></li>
              <li><Link to="/explore/products?category=beauty" className="hover:text-white transition">Beauty</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-bold text-white mb-2.5 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-1.5 text-gray-400 text-xs sm:text-sm">
              <li>📍 Tech City, Country</li>
              <li>✉️ support@multishop.com</li>
              <li>📞 +1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal links */}
        <div className="pt-4 md:pt-2 flex flex-col sm:flex-row justify-between items-center text-[11px] sm:text-xs text-gray-400 gap-2">
          <p>&copy; {currentYear} MultiShop Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <Link to="/privacy" className="hover:text-gray-200 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-200 transition">Terms</Link>
            <Link to="/refund" className="hover:text-gray-200 transition">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
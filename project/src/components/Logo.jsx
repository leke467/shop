import { Link } from 'react-router-dom'

export default function Logo({ size = 'md', isDarkBg = false, className = '' }) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Icon Badge */}
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-1.5 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-500/30 group-hover:scale-105 transition-all duration-300 relative overflow-hidden flex-shrink-0`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-pink-500/20 opacity-80" />
        
        {/* 3 Distinct Shops inside Shopping Cart SVG */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          className="w-full h-full relative z-10 drop-shadow"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shop 1: Left Storefront (Cyan) */}
          <path d="M7 20V13.5L10 10.5L13 13.5V20H7Z" fill="#38bdf8" />
          <path d="M6.5 13.5L10 10L13.5 13.5" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="8.8" y="16" width="2.4" height="4" fill="#0f172a" rx="0.4" />

          {/* Shop 2: Center Storefront (Taller / Hero Indigo) */}
          <path d="M12 20V11L16 7L20 11V20H12Z" fill="#818cf8" />
          <path d="M11.5 11L16 6.5L20.5 11" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
          {/* Yellow Awning */}
          <path d="M12.5 12.5H19.5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="14.2" y="15" width="3.6" height="5" fill="#ffffff" rx="0.5" />

          {/* Shop 3: Right Storefront (Pink / Rose) */}
          <path d="M19 20V13.5L22 10.5L25 13.5V20H19Z" fill="#f43f5e" />
          <path d="M18.5 13.5L22 10L25.5 13.5" stroke="#fca5a5" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="20.8" y="16" width="2.4" height="4" fill="#0f172a" rx="0.4" />

          {/* Bold White Shopping Cart Base & Wheels */}
          <path 
            d="M3 5h3.5l2.2 15h16.3" 
            stroke="#ffffff" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="10" cy="24.5" r="2.2" fill="#ffffff" />
          <circle cx="22" cy="24.5" r="2.2" fill="#ffffff" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-extrabold ${textSizes[size]} tracking-tight transition-colors ${
          isDarkBg ? 'text-white' : 'text-gray-900'
        }`}>
          Multi<span className={
            isDarkBg
              ? 'bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent drop-shadow-sm'
              : 'bg-gradient-to-r from-primary-600 via-indigo-600 to-secondary-600 bg-clip-text text-transparent'
          }>Shop</span>
        </span>
      </div>
    </div>
  )
}

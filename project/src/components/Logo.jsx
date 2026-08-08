import { Link } from 'react-router-dom'

/**
 * Modern Isometric Apex-style 3D Polygon Logo Component
 * 
 * Inspired by Apex-nexus with premium custom color variants:
 * - 'emerald': Nigerian Emerald Green + Gold & Deep Teal (default for MultiShop)
 * - 'vibrant': Electric Cyan + Vivid Purple & Magenta
 * - 'cyber': Neon Blue + Cyber Teal & Midnight Navy
 * - 'gold': Rich Gold + Warm Bronze & Obsidian
 */
export default function Logo({ 
  size = 'md', 
  isDarkBg = false, 
  variant = 'emerald',
  className = '' 
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  // Color schemes for the 3D isometric facets (Top, Left, Right)
  const colorSchemes = {
    emerald: {
      top: { start: '#10b981', stop: '#059669' },     // Emerald Green
      left: { start: '#34d399', stop: '#10b981' },    // Teal Mint
      right: { start: '#f59e0b', stop: '#d97706' },   // Rich Gold
      badgeBorder: 'border-emerald-500/30',
      badgeShadow: 'shadow-emerald-500/20',
      textGradient: 'from-emerald-500 via-teal-400 to-amber-500',
    },
    vibrant: {
      top: { start: '#38bdf8', stop: '#0284c7' },     // Electric Cyan
      left: { start: '#818cf8', stop: '#4f46e5' },    // Vivid Indigo
      right: { start: '#f43f5e', stop: '#e11d48' },   // Hot Pink
      badgeBorder: 'border-indigo-500/30',
      badgeShadow: 'shadow-indigo-500/20',
      textGradient: 'from-sky-400 via-indigo-500 to-pink-500',
    },
    cyber: {
      top: { start: '#1A82FC', stop: '#0252b3' },     // Royal Blue (Apex original)
      left: { start: '#5BC0BE', stop: '#3a9290' },    // Cyber Cyan
      right: { start: '#1e293b', stop: '#0f172a' },   // Deep Slate Navy
      badgeBorder: 'border-cyan-500/30',
      badgeShadow: 'shadow-cyan-500/20',
      textGradient: 'from-blue-400 via-cyan-400 to-teal-300',
    },
    gold: {
      top: { start: '#fbbf24', stop: '#d97706' },     // Bright Gold
      left: { start: '#f59e0b', stop: '#b45309' },    // Bronze
      right: { start: '#1f2937', stop: '#111827' },   // Obsidian
      badgeBorder: 'border-amber-500/30',
      badgeShadow: 'shadow-amber-500/20',
      textGradient: 'from-amber-400 via-yellow-300 to-amber-600',
    },
  }

  const scheme = colorSchemes[variant] || colorSchemes.emerald

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* 3D Isometric Logo Badge */}
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-1.5 flex items-center justify-center shadow-lg ${scheme.badgeShadow} border ${scheme.badgeBorder} group-hover:scale-105 transition-all duration-300 relative overflow-hidden flex-shrink-0`}>
        
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 opacity-70" />
        
        {/* 3D Faceted Isometric Polygon SVG (Adapted from Apex-nexus) */}
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          className="w-full h-full relative z-10 drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`topGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.top.start} />
              <stop offset="100%" stopColor={scheme.top.stop} />
            </linearGradient>
            <linearGradient id={`leftGrad-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={scheme.left.start} />
              <stop offset="100%" stopColor={scheme.left.stop} />
            </linearGradient>
            <linearGradient id={`rightGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scheme.right.start} />
              <stop offset="100%" stopColor={scheme.right.stop} />
            </linearGradient>
          </defs>

          {/* Top Facet (Roof Prism) */}
          <path 
            d="M16 2L2 9L16 16L30 9L16 2Z" 
            fill={`url(#topGrad-${variant})`} 
          />
          
          {/* Left Facet (Shaded Wall) */}
          <path 
            d="M2 9V23L16 30V16L2 9Z" 
            fill={`url(#leftGrad-${variant})`} 
          />
          
          {/* Right Facet (Contrast Wall) */}
          <path 
            d="M30 9V23L16 30V16L30 9Z" 
            fill={`url(#rightGrad-${variant})`} 
          />

          {/* Subtle Inner Highlight Lines for 3D Luster */}
          <path 
            d="M16 2L16 16M16 16L2 9M16 16L30 9" 
            stroke="rgba(255, 255, 255, 0.25)" 
            strokeWidth="0.8" 
          />
        </svg>
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col">
        <span className={`font-extrabold ${textSizes[size]} tracking-tight transition-colors ${
          isDarkBg ? 'text-white' : 'text-gray-900'
        }`}>
          Multi<span className={
            isDarkBg
              ? `bg-gradient-to-r ${scheme.textGradient} bg-clip-text text-transparent drop-shadow-sm`
              : `bg-gradient-to-r ${scheme.textGradient} bg-clip-text text-transparent`
          }>Shop</span>
        </span>
      </div>
    </div>
  )
}

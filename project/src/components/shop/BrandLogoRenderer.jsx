import { getImageUrl } from '../../services/api'

/**
 * Universal Brand Logo & Store Name Renderer.
 * Renders the shop logo at the Beginning ('left'), Middle ('middle' - between words), or End ('right')
 * based on shop.theme.extra_tokens.logo_position.
 */
export default function BrandLogoRenderer({
  shop,
  customLogo = null,
  customName = null,
  positionOverride = null,
  className = '',
  logoClassName = '',
  textClassName = '',
  accentColor = null,
  style = {},
  textStyle = {},
  fallbackIcon = null,
}) {
  const extra = shop?.theme?.extra_tokens || {}
  const logoSrc = customLogo || extra.logo_url || shop?.logo
  const position = positionOverride || extra.logo_position || 'left' // 'left' | 'middle' | 'right'
  const name = (customName || extra.hero_headline || shop?.name || 'Store').trim()

  const words = name.split(/\s+/)
  let firstPart = name
  let secondPart = ''

  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2)
    firstPart = words.slice(0, mid).join(' ')
    secondPart = words.slice(mid).join(' ')
  } else if (name.length >= 6) {
    // For a single long word (e.g., HoneySpicy), split in half
    const mid = Math.ceil(name.length / 2)
    firstPart = name.slice(0, mid)
    secondPart = name.slice(mid)
  }

  const logoNode = logoSrc ? (
    <img
      src={getImageUrl(logoSrc)}
      alt={name}
      className={`object-cover shrink-0 ${logoClassName || 'w-9 h-9 rounded-xl'}`}
    />
  ) : (
    fallbackIcon || (
      <div
        className={`shrink-0 flex items-center justify-center font-bold text-white shadow-xs ${logoClassName || 'w-9 h-9 rounded-xl text-base'}`}
        style={{ backgroundColor: accentColor || extra.primary_color || '#2563EB' }}
      >
        {name.charAt(0) || '??'}
      </div>
    )
  )

  if (position === 'middle') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`} style={style}>
        <span className={textClassName} style={textStyle}>{firstPart}</span>
        {logoNode}
        {secondPart && (
          <span
            className={textClassName}
            style={{
              ...textStyle,
              color: accentColor || undefined,
            }}
          >
            {secondPart}
          </span>
        )}
      </div>
    )
  }

  if (position === 'right') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
        <span className={textClassName} style={textStyle}>{name}</span>
        {logoNode}
      </div>
    )
  }

  // Default: 'left' (Beginning)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={style}>
      {logoNode}
      <span className={textClassName} style={textStyle}>{name}</span>
    </div>
  )
}

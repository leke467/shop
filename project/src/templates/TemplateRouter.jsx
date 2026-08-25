/**
 * TemplateRouter
 *
 * Renders a premium template storefront when the shop has a template_id set,
 * otherwise returns null so the default ShopPage content renders.
 */
import { Suspense, lazy, useMemo } from 'react'
import { getTemplate } from './registry'

function TemplateLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Poppins, sans-serif',
      color: '#666',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #f9a826',
          borderRadius: '50%',
          animation: 'hs-spin 1s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p>Loading storefront…</p>
        <style>{`@keyframes hs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport()
    } catch (error) {
      console.warn('Failed to load template chunk, reloading latest version...', error)
      const lastReload = sessionStorage.getItem('chunk_reload_' + window.location.pathname)
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('chunk_reload_' + window.location.pathname, String(now))
        window.location.reload()
      }
      throw error
    }
  })
}

export default function TemplateRouter({ shop, products, reviews, shopSlug }) {
  const templateId = shop?.template_id

  // Lazy-load the template component with retry on stale hashes
  const TemplateComponent = useMemo(() => {
    if (!templateId) return null
    const tpl = getTemplate(templateId)
    if (!tpl) return null
    return lazyWithRetry(tpl.component)
  }, [templateId])

  if (!TemplateComponent) return null

  return (
    <Suspense fallback={<TemplateLoading />}>
      <TemplateComponent
        shop={shop}
        products={products}
        reviews={reviews}
        shopSlug={shopSlug}
      />
    </Suspense>
  )
}

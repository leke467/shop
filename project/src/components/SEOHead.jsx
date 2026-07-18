import { useEffect } from 'react'

export default function SEOHead({ title, description }) {
  useEffect(() => {
    // Update title
    document.title = title ? `${title} | Marketplace` : 'Marketplace'

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.name = 'description'
        document.head.appendChild(metaDescription)
      }
      metaDescription.content = description
    }
  }, [title, description])

  return null // This component doesn't render anything visible
}

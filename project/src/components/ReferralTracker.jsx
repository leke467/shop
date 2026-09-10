import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { referralAPI } from '../services/api'

/**
 * Headless component that listens to URL search parameters across the entire site.
 * Automatically captures ?ref=CODE or ?referral=CODE, persists to localStorage,
 * and records a click with the backend once per user session.
 */
export default function ReferralTracker() {
  const location = useLocation()

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search)
      const refParam = searchParams.get('ref') || searchParams.get('referral')

      if (refParam) {
        const cleanCode = refParam.trim().toUpperCase()
        if (cleanCode.length >= 3) {
          // Persist so subsequent signups auto-attribute to this referrer
          localStorage.setItem('pending_referral_code', cleanCode)

          // Track click once per session to avoid duplicate count on page reloads
          const sessionKey = `tracked_ref_${cleanCode}`
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1')
            referralAPI.trackClick(cleanCode).catch(() => {
              // Silently ignore if code doesn't exist
            })
          }
        }
      }
    } catch {
      // Ignore browser security errors in restricted iframe environments
    }
  }, [location.search])

  return null
}

import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'

export default function GoogleLoginButton({ onSuccess, onError, text = "Continue with Google" }) {
  const { googleLogin } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Production Google OAuth Client ID with fallback
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "30437147425-26pfi92foivnj20he2v528vt962l1rjj.apps.googleusercontent.com"

  useEffect(() => {
    if (!googleClientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        // Render official native Google Sign-In button
        const btnContainer = document.getElementById('google-signin-btn-div')
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: '100%', shape: 'pill', text: 'continue_with' }
          )
        }

        // Trigger Google One-Tap Account Selector sheet
        window.google.accounts.id.prompt()
      }
    }
    document.body.appendChild(script)

    return () => {
      try { document.body.removeChild(script) } catch { /* ignore */ }
    }
  }, [googleClientId])

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return
    setLoading(true)
    setError('')
    try {
      await googleLogin(response.credential)
      if (onSuccess) onSuccess()
      else navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Google sign in failed. Please try again.'
      setError(msg)
      if (onError) onError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="text-xs text-error-600 font-medium text-center bg-error-50 p-2 rounded-lg border border-error-200">
          {error}
        </div>
      )}

      {/* Official Native Google Sign-In Button Container */}
      <div id="google-signin-btn-div" className="w-full flex justify-center min-h-[44px]"></div>
    </div>
  )
}

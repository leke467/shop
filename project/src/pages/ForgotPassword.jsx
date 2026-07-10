import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../services/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [uid, setUid] = useState(null)
  const [token, setToken] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const handleRequest = async (e) => {
    e.preventDefault()
    setStatus('')
    try {
      const res = await forgotPassword(email)
      setUid(res.uid)
      setToken(res.token)
      setStatus('reset_ready')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!newPassword) return alert('Enter a new password')
    try {
      await resetPassword({ uid, token, new_password: newPassword })
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
            <h2 className="text-xl font-bold mb-4">Forgot password</h2>
            {status === 'done' ? (
              <div>
                <p className="mb-4">Your password has been reset. You can now <Link to="/login" className="text-primary-600">sign in</Link>.</p>
              </div>
            ) : (
              <>
                {!uid && (
                  <form onSubmit={handleRequest} className="space-y-4">
                    <p className="text-sm text-gray-600">Enter your email and we'll provide a reset token (development only).</p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input"
                    />
                    <button className="btn-primary w-full">Request Reset</button>
                  </form>
                )}

                {uid && status !== 'done' && (
                  <form onSubmit={handleReset} className="space-y-4">
                    <p className="text-sm text-gray-600">Enter a new password for your account.</p>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      required
                      className="input"
                    />
                    <div className="text-xs text-gray-500">Token (for debugging): {token}</div>
                    <button className="btn-primary w-full">Set New Password</button>
                  </form>
                )}
              </>
            )}
            {status === 'error' && <p className="text-error-700 mt-3">Something went wrong. Try again.</p>}
            <div className="mt-4 text-sm">
              <Link to="/login" className="text-primary-600">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

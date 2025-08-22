import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser } from '../context/UserContext'
import { signupUser } from '../services/api'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants'


function SignUpPage() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    return newErrors
  }

  
const handleSubmit = async (e) => {
  e.preventDefault()
  const newErrors = validateForm()
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  setIsLoading(true)
  setErrors({})

  try {
    // Call backend signup API
    const result = await signupUser({
      username: formData.username,      // Add this field to your form
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
    })

    // Save tokens to localStorage
    localStorage.setItem(ACCESS_TOKEN, result.access)
    localStorage.setItem(REFRESH_TOKEN, result.refresh)

    // Optionally, fetch user profile here and call login()
    login({ name: `${formData.firstName} ${formData.lastName}`, email: formData.email }, false)
    navigate('/')
  } catch (err) {
    setErrors({ general: err.response?.data?.detail || 'Signup failed. Please try again.' })
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-secondary-50 to-accent-50">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="px-6 py-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
                <p className="text-gray-600">Join our marketplace community</p>
              </div>

              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md"
                >
                  <p className="text-error-700 text-sm">{errors.general}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`input ${errors.firstName ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-error-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`input ${errors.lastName ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-error-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`input ${errors.username ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Username"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.username}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input ${errors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input ${errors.password ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Create a strong password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input ${errors.confirmPassword ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className={`form-checkbox h-4 w-4 text-primary-600 rounded mt-1 ${errors.agreeToTerms ? 'border-error-300' : ''}`}
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 text-sm text-error-600">{errors.agreeToTerms}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full relative"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className="btn-outline flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button className="btn-outline flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
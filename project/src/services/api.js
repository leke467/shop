/**
 * API client with HttpOnly cookie auth + automatic token refresh.
 *
 * All auth tokens live in HttpOnly cookies (set by the backend), so we
 * never touch localStorage for tokens. The interceptor handles 401s by
 * calling /token/refresh/ (which reads the refresh cookie) then retrying.
 */
import axios from 'axios'

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000' : 'https://shop-production-8258.up.railway.app')

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // Send HttpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach Bearer token if present & auto-set multipart/form-data for FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data'
  }
  return config
})

// Track refresh state to avoid infinite loops
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      // Don't attempt refresh loop if the failed endpoint was login, register, refresh, or silent profile check without token
      if (
        original.url?.includes('/users/login/') ||
        original.url?.includes('/users/register/') ||
        original.url?.includes('/users/token/refresh/') ||
        (original.url?.includes('/users/profile/') && !localStorage.getItem('access_token'))
      ) {
        return Promise.reject(error)
      }

      // For public GET read endpoints (search, products listing, public shop page),
      // if 401 occurs due to an expired Bearer token, retry unauthenticated so public data still loads cleanly.
      // NEVER strip token or retry unauthenticated for POST/PUT/DELETE creation endpoints (e.g. /shops/create/).
      const method = (original.method || '').toLowerCase()
      const url = original.url || ''
      const isGet = method === 'get'

      const isPublicReadEndpoint = isGet && (
        url.includes('/search/') || 
        (url.includes('/products/') && !url.includes('/create/')) || 
        (url.includes('/shops/') && !url.includes('/create/') && !url.includes('/mine/') && !url.includes('/theme/') && !url.includes('/update/')) ||
        url.includes('/categories/')
      )

      if (isPublicReadEndpoint && original.headers?.Authorization) {
        original._retry = true
        localStorage.removeItem('access_token')
        delete original.headers.Authorization
        return api(original)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/users/token/refresh/')
        if (res.data?.access) localStorage.setItem('access_token', res.data.access)
        processQueue(null)
        return api(original)
      } catch (err) {
        processQueue(err)
        localStorage.removeItem('access_token')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          const currentPath = window.location.pathname
          const isProtectedRoute = currentPath.startsWith('/dashboard') ||
                                   currentPath.startsWith('/checkout') ||
                                   currentPath.startsWith('/profile') ||
                                   currentPath.startsWith('/settings') ||
                                   currentPath.startsWith('/admin') ||
                                   currentPath.startsWith('/orders')
          if (isProtectedRoute) {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
          }
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/users/login/', { email, password }).then(r => {
      if (r.data?.access) localStorage.setItem('access_token', r.data.access)
      return r.data
    }),
  register: (data) =>
    api.post('/users/register/', data).then(r => {
      if (r.data?.access) localStorage.setItem('access_token', r.data.access)
      return r.data
    }),
  logout: () => {
    localStorage.removeItem('access_token')
    return api.post('/users/logout/').then(r => r.data).catch(() => ({}))
  },
  profile: () =>
    api.get('/users/profile/').then(r => r.data),
  updateProfile: (data) =>
    api.patch('/users/profile/', data).then(r => r.data),
  forgotPassword: (email) =>
    api.post('/users/forgot-password/', { email }).then(r => r.data),
  resetPassword: (data) =>
    api.post('/users/reset-password/', data).then(r => r.data),
  googleLogin: (token) =>
    api.post('/users/google/', { token }).then(r => {
      if (r.data?.access) localStorage.setItem('access_token', r.data.access)
      return r.data
    }),
}

// ── Shops ────────────────────────────────────────────────────
export const shopAPI = {
  list: (params) =>
    api.get('/shops/', { params }).then(r => r.data),
  detail: (slug) =>
    api.get(`/shops/${slug}/`).then(r => r.data),
  mine: () =>
    api.get('/shops/mine/').then(r => r.data),
  myShops: () =>
    api.get('/shops/mine/').then(r => r.data),
  create: (data) => {
    const config = (typeof FormData !== 'undefined' && data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.post('/shops/create/', data, config).then(r => r.data)
  },
  update: (slug, data) => {
    const config = (typeof FormData !== 'undefined' && data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.patch(`/shops/${slug}/update/`, data, config).then(r => r.data)
  },
  delete: (slug) =>
    api.delete(`/shops/${slug}/delete/`).then(r => r.data),

  // Theme
  getTheme: (slug) =>
    api.get(`/shops/${slug}/theme/`).then(r => r.data),
  updateTheme: (slug, data) =>
    api.patch(`/shops/${slug}/theme/`, data).then(r => r.data),
  resetTheme: (slug) =>
    api.post(`/shops/${slug}/theme/reset/`).then(r => r.data),

  // Branding
  uploadBranding: (slug, formData) =>
    api.post(`/shops/${slug}/branding/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
  removeBranding: (slug, target = 'all') =>
    api.delete(`/shops/${slug}/branding/`, { params: { target } }).then(r => r.data),

  // Custom domain (feature-gated by the subscription plan)
  getCustomDomain: (slug) =>
    api.get(`/shops/${slug}/domain/`).then(r => r.data),
  setCustomDomain: (slug, domain) =>
    api.post(`/shops/${slug}/domain/`, { domain }).then(r => r.data),
  verifyCustomDomain: (slug) =>
    api.post(`/shops/${slug}/domain/verify/`).then(r => r.data),
  removeCustomDomain: (slug) =>
    api.delete(`/shops/${slug}/domain/`).then(r => r.data),
  getByDomain: (domain) =>
    api.get(`/shops/by-domain/`, { params: { domain } }).then(r => r.data),


  // Layouts
  layouts: (slug) =>
    api.get(`/shops/${slug}/layouts/`).then(r => r.data),

  // Reviews
  reviews: (slug) =>
    api.get(`/shops/${slug}/reviews/`).then(r => r.data),
  addReview: (slug, data) =>
    api.post(`/shops/${slug}/reviews/`, data).then(r => r.data),

  // Delivery zones
  deliveryZones: (slug) =>
    api.get(`/shops/${slug}/delivery-zones/`).then(r => r.data),
  deliveryZoneForState: (slug, state) =>
    api.get(`/shops/${slug}/delivery-zones/`, { params: { state } }).then(r => r.data),
  saveDeliveryZonesBulk: (slug, zones) =>
    api.post(`/shops/${slug}/delivery-zones/bulk/`, { zones }).then(r => r.data),
  createDeliveryZone: (slug, data) =>
    api.post(`/shops/${slug}/delivery-zones/`, data).then(r => r.data),
  updateDeliveryZone: (slug, id, data) =>
    api.patch(`/shops/${slug}/delivery-zones/${id}/`, data).then(r => r.data),
  deleteDeliveryZone: (slug, id) =>
    api.delete(`/shops/${slug}/delivery-zones/${id}/`).then(r => r.data),

  // Delivery notes
  deliveryNotes: (slug) =>
    api.get(`/shops/${slug}/delivery-notes/`).then(r => r.data),
  sendDeliveryNote: (slug, data) =>
    api.post(`/shops/${slug}/delivery-notes/send/`, data).then(r => r.data),
  markNoteRead: (slug, id) =>
    api.post(`/shops/${slug}/delivery-notes/${id}/read/`).then(r => r.data),

  // Nigerian states
  nigerianStates: () =>
    api.get('/shops/nigerian-states/').then(r => r.data),

  // Report shop
  reportShop: (slug, data) =>
    api.post(`/shops/${slug}/report/`, data).then(r => r.data),

  // Seller verification (KYC)
  getVerification: (slug) =>
    api.get(`/shops/${slug}/`).then(r => r.data),
  submitVerification: (slug, formData) =>
    api.post(`/shops/${slug}/kyc/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  // Premium templates
  setTemplate: (slug, templateId) =>
    api.patch(`/shops/${slug}/template/`, { template_id: templateId }).then(r => r.data),
  clearTemplate: (slug) =>
    api.patch(`/shops/${slug}/template/`, { template_id: '' }).then(r => r.data),
}

// ── Products ─────────────────────────────────────────────────
export const productAPI = {
  list: (params) =>
    api.get('/products/', { params }).then(r => r.data),
  detail: (slug) =>
    api.get(`/products/${slug}/`).then(r => r.data),
  create: (shopSlug, data) => {
    const config = (typeof FormData !== 'undefined' && data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.post(`/products/shop/${shopSlug}/`, data, config).then(r => r.data)
  },
  update: (slug, data) => {
    const config = (typeof FormData !== 'undefined' && data instanceof FormData)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.patch(`/products/${slug}/`, data, config).then(r => r.data)
  },
  restock: (slug, data) =>
    api.post(`/products/${slug}/restock/`, data).then(r => r.data),
  delete: (slug) =>
    api.delete(`/products/${slug}/`).then(r => r.data),
  reviews: (slug) =>
    api.get(`/products/${slug}/reviews/`).then(r => r.data),
  uploadImage: (slug, file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post(`/products/${slug}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  }
}

// ── Search ───────────────────────────────────────────────────
export const searchAPI = {
  search: (params) =>
    api.get('/search/', { params }).then(r => r.data),
  categories: () =>
    api.get('/search/categories/').then(r => r.data),
}

// ── Personalization ──────────────────────────────────────────
export const personalAPI = {
  feed: () =>
    api.get('/personalization/feed/').then(r => r.data),
  trackEvent: (data) =>
    api.post('/personalization/events/', data).then(r => r.data),
  favourites: () =>
    api.get('/personalization/favourites/').then(r => r.data),
  addFavourite: (data) =>
    api.post('/personalization/favourites/', data).then(r => r.data),
  removeFavourite: (id) =>
    api.delete(`/personalization/favourites/${id}/`).then(r => r.data),
}

// ── Subscriptions ────────────────────────────────────────────
export const subscriptionAPI = {
  plans: () =>
    api.get('/subscription/plans/').then(r => r.data),
  current: () =>
    api.get('/subscription/current/').then(r => r.data),
  mine: () =>
    api.get('/subscription/mine/').then(r => r.data),
  upgrade: (data) =>
    api.post('/subscription/upgrade/', data).then(r => r.data),
  verifyPayment: (params) =>
    api.get('/subscription/verify-payment/', { params }).then(r => r.data),
  validateCoupon: (data) =>
    api.post('/subscription/validate-coupon/', data).then(r => r.data),

  // Admin
  admin: {
    listPlans: () =>
      api.get('/subscription/admin/plans/').then(r => r.data),
    createPlan: (data) =>
      api.post('/subscription/admin/plans/', data).then(r => r.data),
    updatePlan: (code, data) =>
      api.patch(`/subscription/admin/plans/${code}/`, data).then(r => r.data),
    deletePlan: (code) =>
      api.delete(`/subscription/admin/plans/${code}/`).then(r => r.data),
    subscriptions: (params) =>
      api.get('/subscription/admin/subscriptions/', { params }).then(r => r.data),
    changePlan: (data) =>
      api.post('/subscription/admin/change-plan/', data).then(r => r.data),
    stats: () =>
      api.get('/subscription/admin/stats/').then(r => r.data),
    listCoupons: (params) =>
      api.get('/subscription/admin/coupons/', { params }).then(r => r.data),
    createCoupon: (data) =>
      api.post('/subscription/admin/coupons/', data).then(r => r.data),
    updateCoupon: (id, data) =>
      api.patch(`/subscription/admin/coupons/${id}/`, data).then(r => r.data),
    deleteCoupon: (id) =>
      api.delete(`/subscription/admin/coupons/${id}/`).then(r => r.data),
    listRedemptions: (params) =>
      api.get('/subscription/admin/coupon-redemptions/', { params }).then(r => r.data),
  },
}

// ── Orders & Checkout ────────────────────────────────────────
export const orderAPI = {
  list: () =>
    api.get('/orders/').then(r => r.data),
  detail: (id) =>
    api.get(`/orders/${id}/`).then(r => r.data),
  cart: () =>
    api.get('/orders/cart/').then(r => r.data),
  addToCart: (data) =>
    api.post('/orders/cart/', data).then(r => r.data),
  updateCartItem: (id, data) =>
    api.patch(`/orders/cart/items/${id}/`, data).then(r => r.data),
  removeCartItem: (id) =>
    api.delete(`/orders/cart/items/${id}/`).then(r => r.data),
  checkout: (data) =>
    api.post('/payments/checkout/', data).then(r => r.data),

  // Bank transfer (manual NGN transfer)
  bankTransferAccounts: () =>
    api.get('/payments/bank-transfer/accounts/').then(r => r.data),
  bankTransferStatus: (orderId) =>
    api.get(`/payments/bank-transfer/status/${orderId}/`).then(r => r.data),

  bankTransferConfirm: (paymentId) =>
    api.post('/payments/bank-transfer/confirm/', { payment: paymentId }).then(r => r.data),

  // Paystack Verify
  verifyPaystack: (reference) =>
    api.get(`/payments/paystack/verify/${reference}/`).then(r => r.data),

  // Monnify Verify
  verifyMonnify: (reference) =>
    api.get(`/payments/monnify/verify/${reference}/`).then(r => r.data),

  // Buyer Refund Requests
  refundRequests: () =>
    api.get('/payments/refund-requests/').then(r => r.data),
  requestRefund: (data) =>
    api.post('/payments/refund-requests/', data).then(r => r.data),

  // Escrow & Delivery Code
  deliveryCodes: (orderId) =>
    api.get(`/orders/${orderId}/delivery-codes/`).then(r => r.data),
  confirmDelivery: (groupId, code) =>
    api.post(`/orders/groups/${groupId}/confirm-delivery/`, { code }).then(r => r.data),
  disputeOrder: (groupId, reason) =>
    api.post(`/orders/groups/${groupId}/dispute/`, { reason }).then(r => r.data),
  cancel: (publicId) =>
    api.post(`/orders/${publicId}/cancel/`).then(r => r.data),
  withdrawDispute: (groupId) =>
    api.delete(`/orders/groups/${groupId}/dispute/`).then(r => r.data),

  // Seller Wallet
  wallet: (shopSlug) =>
    api.get(`/orders/wallet/${shopSlug}/`).then(r => r.data),

  // Shop Orders (for seller dashboard)
  shopOrders: (shopSlug) =>
    api.get(`/orders/shop-orders/${shopSlug}/`).then(r => r.data),
  updateFulfillmentStatus: (groupId, status) =>
    api.patch(`/orders/groups/${groupId}/status/`, { status }).then(r => r.data),
}

// ── Payment Gateway Settings ─────────────────────────────────
export const paymentSettingsAPI = {
  getSettings: () =>
    api.get('/payments/settings/').then(r => r.data),
  admin: {
    getSettings: () =>
      api.get('/payments/admin/settings/').then(r => r.data),
    updateSettings: (data) =>
      api.patch('/payments/admin/settings/', data).then(r => r.data),
  },
}

// ── Addresses ────────────────────────────────────────────────
export const addressAPI = {
  list: () => api.get('/users/addresses/').then(r => r.data),
  create: (data) => api.post('/users/addresses/', data).then(r => r.data),
  update: (id, data) => api.patch(`/users/addresses/${id}/`, data).then(r => r.data),
  delete: (id) => api.delete(`/users/addresses/${id}/`).then(r => r.data),
}

// ── Blog ─────────────────────────────────────────────────────
export const blogAPI = {
  list: (params) => api.get('/blog/', { params: typeof params === 'string' ? { shop: params } : params }).then(r => r.data),
  myPosts: () => api.get('/blog/manage/').then(r => r.data),
  detail: (slug) => api.get(`/blog/${slug}/`).then(r => r.data),
  create: (dataOrSlug, maybeData) => {
    const data = maybeData || dataOrSlug;
    return api.post('/blog/manage/', data).then(r => r.data);
  },
  update: (slug, data) => api.patch(`/blog/manage/${slug}/`, data).then(r => r.data),
  delete: (slug) => api.delete(`/blog/manage/${slug}/`).then(r => r.data),
  comments: (postId) => api.get(`/blog/${postId}/comments/`).then(r => r.data),
  addComment: (postId, data) => api.post(`/blog/${postId}/comments/`, data).then(r => r.data),
}

// ── Messaging ────────────────────────────────────────────────
export const messagingAPI = {
  list: (shopSlug) => api.get('/messaging/', { params: shopSlug ? { shop: shopSlug } : {} }).then(r => r.data),
  conversations: (params) => api.get('/messaging/', { params }).then(r => r.data),
  conversationDetail: (id) => api.get(`/messaging/${id}/`).then(r => r.data),
  createConversation: (data) => api.post('/messaging/create/', data).then(r => r.data),
  sendMessage: (conversationId, data) => api.post(`/messaging/${conversationId}/messages/`, data).then(r => r.data),
  reply: (conversationId, data) => api.post(`/messaging/${conversationId}/messages/`, { content: data.message || data.content }).then(r => r.data),
  markAsRead: (messageId) => api.post(`/messaging/messages/${messageId}/mark-read/`).then(r => r.data),
  unreadCount: () => api.get('/messaging/unread-count/').then(r => r.data),
  sendContactInquiry: (data) => api.post('/messaging/contact/', data).then(r => r.data),
}

// ── Analytics (seller dashboard) ─────────────────────────────
export const analyticsAPI = {
  get: (shopSlug) => api.get(`/shops/${shopSlug}/analytics/overview/`).then(r => r.data),
  overview: (shopSlug) => api.get(`/shops/${shopSlug}/analytics/overview/`).then(r => r.data),
  revenue: (shopSlug, params) => api.get(`/shops/${shopSlug}/analytics/revenue/`, { params }).then(r => r.data),
  products: (shopSlug) => api.get(`/shops/${shopSlug}/analytics/products/`).then(r => r.data),
  customers: (shopSlug) => api.get(`/shops/${shopSlug}/analytics/customers/`).then(r => r.data),
}

// ── Coupons (seller management) ──────────────────────────────
export const couponAPI = {
  list: (shopSlug) => api.get(`/orders/coupons/${shopSlug}/`).then(r => r.data),
  create: (shopSlug, data) => api.post(`/orders/coupons/${shopSlug}/`, data).then(r => r.data),
  update: (shopSlugOrId, idOrData, maybeData) => {
    if (maybeData !== undefined) {
      return api.patch(`/orders/coupons/${shopSlugOrId}/${idOrData}/`, maybeData).then(r => r.data);
    }
    return api.patch(`/orders/coupons/${shopSlugOrId}/${idOrData.id || idOrData.pk}/`, idOrData).then(r => r.data);
  },
  delete: (shopSlugOrId, maybeId) => {
    if (maybeId !== undefined) {
      return api.delete(`/orders/coupons/${shopSlugOrId}/${maybeId}/`).then(r => r.data);
    }
    return api.delete(`/orders/coupons/${shopSlugOrId}/`).then(r => r.data);
  },
  apply: (data) => api.post('/orders/coupon/apply/', data).then(r => r.data),
}

// ── Payouts ──────────────────────────────────────────────────
export const payoutAPI = {
  bankAccounts: (shopSlug) => api.get(`/orders/bank-accounts/`, { params: { shop: shopSlug } }).then(r => r.data),
  listBanks: (shopSlug) => api.get(`/orders/bank-accounts/`, { params: { shop: shopSlug } }).then(r => r.data),
  addBankAccount: (data) => api.post('/orders/bank-accounts/', data).then(r => r.data),
  addBank: (slugOrData, maybeData) => {
    const payload = maybeData ? { ...maybeData, shop: slugOrData } : slugOrData;
    return api.post('/orders/bank-accounts/', payload).then(r => r.data);
  },
  updateBankAccount: (id, data) => api.patch(`/orders/bank-accounts/${id}/`, data).then(r => r.data),
  deleteBankAccount: (id) => api.delete(`/orders/bank-accounts/${id}/`).then(r => r.data),
  deleteBank: (id) => api.delete(`/orders/bank-accounts/${id}/`).then(r => r.data),
  requestPayout: (slugOrData, maybeData) => {
    const payload = maybeData || slugOrData;
    return api.post('/orders/payouts/request/', payload).then(r => r.data);
  },
  payoutHistory: (shopSlug) => api.get('/orders/payouts/', { params: { shop: shopSlug } }).then(r => r.data),
  listPayouts: (shopSlug) => api.get('/orders/payouts/', { params: { shop: shopSlug } }).then(r => r.data),
}

// ── Flash Sales ──────────────────────────────────────────────
export const flashSaleAPI = {
  active: () => api.get('/products/flash-sales/').then(r => r.data),
  detail: (id) => api.get(`/products/flash-sales/${id}/`).then(r => r.data),
  create: (shopSlug, data) => api.post(`/products/flash-sales/shop/${shopSlug}/`, data).then(r => r.data),
  update: (id, data) => api.patch(`/products/flash-sales/${id}/`, data).then(r => r.data),
  delete: (id) => api.delete(`/products/flash-sales/${id}/`).then(r => r.data),
}

// ── Notifications ────────────────────────────────────────────
export const notificationAPI = {
  preferences: () => api.get('/notifications/preferences/').then(r => r.data),
  updatePreferences: (data) => api.patch('/notifications/preferences/', data).then(r => r.data),
}

// ── 2FA ──────────────────────────────────────────────────────
export const twoFactorAPI = {
  setup: () => api.post('/users/2fa/setup/').then(r => r.data),
  verify: (code) => api.post('/users/2fa/verify/', { code }).then(r => r.data),
  disable: (code) => api.post('/users/2fa/disable/', { code }).then(r => r.data),
}

// ── Bulk Import/Export ───────────────────────────────────────
export const bulkAPI = {
  importProducts: (shopSlug, fileOrFormData) => {
    let formData = fileOrFormData;
    if (!(fileOrFormData instanceof FormData)) {
      formData = new FormData();
      formData.append('file', fileOrFormData);
    }
    return api.post(`/products/shop/${shopSlug}/import/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  },
  exportProducts: (shopSlug) => api.get(`/products/shop/${shopSlug}/export/`, { responseType: 'blob' }).then(r => r.data),
  downloadTemplate: () => api.get('/products/import-template/', { responseType: 'blob' }).then(r => r.data),
}

// ── Product Reviews ──────────────────────────────────────────
export const productReviewAPI = {
  list: (slug) => api.get(`/products/${slug}/reviews/`).then(r => r.data),
  create: (slug, data) => api.post(`/products/${slug}/reviews/`, data).then(r => r.data),
}

// ── Referral System ──────────────────────────────────────────
export const referralAPI = {
  myStats: () => api.get('/referrals/me/').then(r => r.data),
  trackClick: (code) => api.post('/referrals/click/', { code }).then(r => r.data),
  setCustomCode: (custom_code) => api.post('/referrals/custom-code/', { custom_code }).then(r => r.data),
}

// ── Superadmin Dashboard ─────────────────────────────────────
export const adminDashboardAPI = {
  overview: () => api.get('/admin/overview/').then(r => r.data),
  orders: (params) => api.get('/admin/orders/', { params }).then(r => r.data),
  updateOrder: (id, data) => api.patch(`/admin/orders/${id}/`, data).then(r => r.data),
  products: (params) => api.get('/admin/products/', { params }).then(r => r.data),
  updateProduct: (id, data) => api.patch(`/admin/products/${id}/`, data).then(r => r.data),
  users: (params) => api.get('/admin/users/', { params }).then(r => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data).then(r => r.data),
  payments: () => api.get('/admin/payments/').then(r => r.data),
  disputes: () => api.get('/admin/disputes/').then(r => r.data),
  resolveDispute: (id, data) => api.patch(`/admin/disputes/${id}/`, data).then(r => r.data),
  referrals: () => api.get('/admin/referrals/').then(r => r.data),
}

// ── Image helper ─────────────────────────────────────────────
const DEFAULT_PRODUCT_PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
const DEFAULT_LOGO_PLACEHOLDER = 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80'
const DEFAULT_AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'

export function getProductPlaceholderUrl(name = 'Product') {
  const text = (name || 'Product').trim()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F8FAFC"/>
        <stop offset="100%" stop-color="#E2E8F0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="24" y="24" width="552" height="552" rx="28" fill="none" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="10 10"/>
    <g transform="translate(300, 260)">
      <rect x="-45" y="-55" width="90" height="90" rx="20" fill="#94A3B8" opacity="0.2"/>
      <path d="M-18 -10 L18 -10 L22 18 L-22 18 Z" fill="none" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="0" cy="-22" r="10" fill="none" stroke="#475569" stroke-width="4"/>
    </g>
    <text x="50%" y="380" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="700" font-size="36" fill="#1E293B" text-anchor="middle">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const getImageUrl = (path, productName = '') => {
  const fallback = productName ? getProductPlaceholderUrl(productName) : DEFAULT_PRODUCT_PLACEHOLDER
  if (!path) return fallback
  if (typeof path !== 'string') {
    path = path?.url || path?.image || path?.medium || path?.large || path?.thumbnail || ''
  }
  if (!path) return fallback

  if (path.startsWith('data:') || path.startsWith('blob:')) return path

  // When running locally on dev server, prevent attempting to fetch from Backblaze
  if (isLocalhost && path.includes('backblazeb2.com')) {
    const cleanPath = path.replace(/^https?:\/\/[^\/]+\/(multishopng\/)?/, '')
    const normalizedPath = cleanPath.startsWith('media/') ? cleanPath : `media/${cleanPath}`
    return `${BASE_URL}/${normalizedPath}`
  }

  // If path is an absolute URL (e.g. Unsplash, Pexels, external CDN)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('localhost') || path.includes('127.0.0.1')) {
      const cleanPath = path.replace(/^https?:\/\/[^\/]+/, '')
      return `${BASE_URL}${cleanPath}`
    }
    return path
  }

  // Relative path (e.g. /media/products/item.jpg)
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${cleanPath}`
}

export const handleImageError = (e, fallbackType = 'product', productName = '') => {
  if (e?.target) {
    e.target.onerror = null // Prevent infinite loop if fallback fails
    const placeholder = fallbackType === 'avatar' 
      ? DEFAULT_AVATAR_PLACEHOLDER
      : fallbackType === 'logo'
      ? DEFAULT_LOGO_PLACEHOLDER
      : (productName ? getProductPlaceholderUrl(productName) : DEFAULT_PRODUCT_PLACEHOLDER)
    e.target.src = placeholder
  }
}

export default api

// ── Backward-compatible exports (used by pages not yet rewritten) ────
export const fetchAllShops = () => shopAPI.list()
export const fetchShopDetails = (slug) => shopAPI.detail(slug)
export const fetchShopProducts = (slug) => productAPI.list({ shop: slug })
export const fetchProducts = () => productAPI.list()
export const fetchProductDetails = (slug) => productAPI.detail(slug)
export const fetchMyShop = () => shopAPI.mine()
export const createShop = (data) => shopAPI.create(data)
export const updateShop = (slug, data) => shopAPI.update(slug, data)
export const createProduct = (data) => productAPI.create(data)
export const forgotPassword = (email) => authAPI.forgotPassword(email)
export const resetPassword = (data) => authAPI.resetPassword(data)
export const adminChangePassword = (userId, pw) =>
  api.post(`/users/${userId}/change-password/`, { new_password: pw }).then(r => r.data)
export const loginUser = (data) => authAPI.login(data.email, data.password)
export const signupUser = (data) => authAPI.register(data)

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { useUser } from '../context/UserContext'
import { authAPI } from '../services/api'
import { Link } from 'react-router-dom'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const DEFAULT_ADDRESSES = [
  {
    id: 'addr-1',
    fullName: 'Adewale Johnson',
    phone: '+234 803 123 4567',
    line1: '14 Admiralty Way, Lekki Phase 1',
    line2: 'Suite 4B',
    city: 'Lagos',
    state: 'Lagos',
    postalCode: '105102',
    isDefault: true
  },
  {
    id: 'addr-2',
    fullName: 'Adewale Johnson',
    phone: '+234 803 123 4567',
    line1: '28 Gana Street, Maitama',
    line2: '',
    city: 'Abuja',
    state: 'FCT (Abuja)',
    postalCode: '900271',
    isDefault: false
  }
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useUser()

  const tabs = [
    { id: 'profile', label: 'Profile & Info', icon: '👤' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'security', label: 'Security & 2FA', icon: '🔒' },
    { id: 'orders', label: 'Order History', icon: '🛍️' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      <SEOHead title="My Profile | Marketplace" description="Manage your account, addresses, and security settings." />
      
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar */}
          <div className="w-full md:w-72 bg-gray-50/70 dark:bg-gray-800/40 p-6 md:p-8 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'My Account'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'Logged in user'}</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-medium ${
                      activeTab === tab.id 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 font-semibold' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-gray-200/60 dark:border-gray-800 mt-6 text-xs text-gray-400">
              Account Status: <span className="text-success-600 font-semibold">Active ✓</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-10">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileTab key="profile" />}
              {activeTab === 'addresses' && <AddressesTab key="addresses" />}
              {activeTab === 'security' && <SecurityTab key="security" />}
              {activeTab === 'orders' && <OrdersTab key="orders" />}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

function ProfileTab() {
  const { user, refreshProfile } = useUser()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  })
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    orderUpdates: true,
    promoOffers: false
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || user.phone_number || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      if (authAPI.updateProfile) {
        await authAPI.updateProfile({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          bio: formData.bio
        })
      }
      if (refreshProfile) await refreshProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal Information</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your basic profile details and contact information.</p>
        
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium flex items-center gap-2">
            ✓ Your profile has been updated successfully!
          </div>
        )}
        {saveError && (
          <div className="mb-6 p-4 rounded-2xl bg-error-50 border border-error-200 text-error-700 text-sm font-medium">
            ⚠️ {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">First Name</label>
              <input 
                type="text" 
                value={formData.firstName} 
                onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
                placeholder="First Name" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName} 
                onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
                placeholder="Last Name" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                disabled
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm" 
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Email is linked to your primary account authentication.</span>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={notifications.email} 
                  onChange={e => setNotifications(p => ({ ...p, email: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500" 
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive order receipts and activity summaries.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={notifications.sms} 
                  onChange={e => setNotifications(p => ({ ...p, sms: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500" 
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">SMS Alerts</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Get real-time delivery SMS to your phone.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={notifications.orderUpdates} 
                  onChange={e => setNotifications(p => ({ ...p, orderUpdates: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500" 
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Order Updates</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when order status changes.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={notifications.promoOffers} 
                  onChange={e => setNotifications(p => ({ ...p, promoOffers: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500" 
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Promotions & Deals</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Exclusive flash sales and coupon codes.</p>
                </div>
              </label>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-600/20 disabled:opacity-50"
          >
            {saving ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

function AddressesTab() {
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('user_addresses')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_ADDRESSES
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const initialForm = {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Lagos',
    postalCode: '',
    isDefault: false
  }

  const [addressForm, setAddressForm] = useState(initialForm)

  useEffect(() => {
    try {
      localStorage.setItem('user_addresses', JSON.stringify(addresses))
    } catch {}
  }, [addresses])

  const openAdd = () => {
    setEditingId(null)
    setAddressForm(initialForm)
    setShowForm(true)
  }

  const openEdit = (addr) => {
    setEditingId(addr.id)
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault || false
    })
    setShowForm(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!addressForm.fullName || !addressForm.line1 || !addressForm.city || !addressForm.state) return

    if (editingId) {
      setAddresses(prev => prev.map(a => {
        if (a.id === editingId) {
          return { ...a, ...addressForm }
        }
        if (addressForm.isDefault) {
          return { ...a, isDefault: false }
        }
        return a
      }))
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm
      }
      setAddresses(prev => {
        if (newAddr.isDefault || prev.length === 0) {
          return [newAddr, ...prev.map(a => ({ ...a, isDefault: false }))]
        }
        return [newAddr, ...prev]
      })
    }

    setShowForm(false)
    setEditingId(null)
    setAddressForm(initialForm)
  }

  const handleDelete = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id))
    setDeleteConfirmId(null)
  }

  const handleSetDefault = (id) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })))
  }

  return (
    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage shipping addresses for faster checkouts nationwide.</p>
        </div>
        {!showForm && (
          <button 
            onClick={openAdd}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all font-semibold text-sm shadow-md shadow-primary-600/20 inline-flex items-center gap-2"
          >
            <span>+</span> Add New Address
          </button>
        )}
      </div>

      {/* Address Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="p-6 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h4>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">✕ Cancel</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Recipient's Name" 
                    value={addressForm.fullName}
                    onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+234 800 000 0000" 
                    value={addressForm.phone}
                    onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Street Address Line 1 *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="House number, street name" 
                    value={addressForm.line1}
                    onChange={e => setAddressForm(p => ({ ...p, line1: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Address Line 2 (Apartment, Suite, etc.)</label>
                  <input 
                    type="text" 
                    placeholder="Suite, apartment, landmark (optional)" 
                    value={addressForm.line2}
                    onChange={e => setAddressForm(p => ({ ...p, line2: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">City / Town *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ikeja, Lekki, Wuse" 
                    value={addressForm.city}
                    onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nigerian State *</label>
                  <select 
                    value={addressForm.state}
                    onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                  >
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Postal / Zip Code</label>
                  <input 
                    type="text" 
                    placeholder="Postal Code" 
                    value={addressForm.postalCode}
                    onChange={e => setAddressForm(p => ({ ...p, postalCode: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={addressForm.isDefault}
                      onChange={e => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))}
                      className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4" 
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Set as default delivery address</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-md"
                >
                  {editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="sm:col-span-2 text-center py-12 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No addresses saved yet.</p>
            <button onClick={openAdd} className="px-5 py-2 bg-primary-600 text-white rounded-xl font-medium text-sm">Add Your First Address</button>
          </div>
        ) : (
          addresses.map(item => (
            <div key={item.id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800/70 shadow-sm relative group hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900 dark:text-white text-base">{item.fullName}</p>
                  {item.isDefault && (
                    <span className="bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.line1}{item.line2 ? `, ${item.line2}` : ''}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{item.city}, {item.state} {item.postalCode ? `(${item.postalCode})` : ''}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-mono mb-4">{item.phone}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 text-xs font-medium">
                <div className="flex space-x-3">
                  <button onClick={() => openEdit(item)} className="text-primary-600 dark:text-primary-400 hover:underline">Edit</button>
                  <button onClick={() => setDeleteConfirmId(item.id)} className="text-error-600 dark:text-error-400 hover:underline">Delete</button>
                </div>
                {!item.isDefault && (
                  <button onClick={() => handleSetDefault(item.id)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Address?</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to remove this address? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2 text-sm font-semibold bg-error-600 hover:bg-error-700 text-white rounded-xl">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFASuccess, setTwoFASuccess] = useState(false)

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    setUpdating(true)
    setPwError('')
    setPwSuccess(false)
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 800))
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch {
      setPwError('Failed to update password. Please check your current password.')
    } finally {
      setUpdating(false)
    }
  }

  const handleVerify2FA = (e) => {
    e.preventDefault()
    if (twoFACode.length === 6) {
      setIs2FAEnabled(true)
      setShow2FAModal(false)
      setTwoFACode('')
      setTwoFASuccess(true)
      setTimeout(() => setTwoFASuccess(false), 4000)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Change Password</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ensure your account is using a long, random password to stay secure.</p>

        {pwSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium flex items-center gap-2">
            ✓ Your password has been changed successfully!
          </div>
        )}
        {pwError && (
          <div className="mb-6 p-4 rounded-2xl bg-error-50 border border-error-200 text-error-700 text-sm font-medium">
            ⚠️ {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input 
              type={showPw ? 'text' : 'password'} 
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input 
              type={showPw ? 'text' : 'password'} 
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <input 
              type={showPw ? 'text' : 'password'} 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white text-sm" 
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer pt-1">
            <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="rounded text-primary-600" />
            <span>Show passwords</span>
          </label>

          <button 
            type="submit" 
            disabled={updating}
            className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 text-sm"
          >
            {updating ? 'Updating Password…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Two-Factor Authentication (2FA)</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl text-sm">Add an extra layer of security to your account by requiring an authenticator code on login.</p>
        
        {twoFASuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-success-50 border border-success-200 text-success-700 text-sm font-medium">
            ✓ Two-Factor Authentication (2FA) is now active on your account!
          </div>
        )}

        <div className="p-6 border border-primary-200 dark:border-primary-900 bg-primary-50/40 dark:bg-primary-900/10 rounded-2xl max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-bold text-gray-900 dark:text-white block text-sm">Authenticator App (TOTP)</span>
              <span className="text-xs text-gray-500">Google Authenticator, Authy, etc.</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              is2FAEnabled ? 'bg-success-100 text-success-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {is2FAEnabled ? 'Active ✓' : 'Disabled'}
            </span>
          </div>

          {is2FAEnabled ? (
            <button 
              onClick={() => setIs2FAEnabled(false)}
              className="w-full py-2.5 bg-error-50 hover:bg-error-100 text-error-600 rounded-xl transition-colors font-semibold text-xs border border-error-200"
            >
              Disable 2FA
            </button>
          ) : (
            <button 
              onClick={() => setShow2FAModal(true)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-semibold text-sm shadow-md"
            >
              Setup 2FA
            </button>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Setup Authenticator App</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Scan the QR code in Google Authenticator or enter the secret code manually.</p>

              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-6">
                <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-gray-200 flex items-center justify-center mb-3">
                  <div className="text-6xl">📱</div>
                </div>
                <p className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">KEY: SHOP-SECURE-2FA-2026</p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Enter 6-digit code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    placeholder="123456" 
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl font-mono px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShow2FAModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                  <button type="submit" disabled={twoFACode.length !== 6} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-md disabled:opacity-50">Verify & Enable</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function OrdersTab() {
  return (
    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="text-center py-12">
      <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
        🛍️
      </div>
      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Order History & Tracking</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
        Track your placed orders, download invoices, verify delivery codes, and view receipts.
      </p>
      <Link 
        to="/orders" 
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-95 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-primary-600/25"
      >
        <span>View My Orders</span>
        <span>&rarr;</span>
      </Link>
    </motion.div>
  )
}

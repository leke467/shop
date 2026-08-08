import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'
// import { useUser } from '../context/UserContext'
// import { useNotification } from '../context/NotificationContext'
import { Link } from 'react-router-dom'

const NIGERIAN_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nassarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara']

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  // const { user } = useUser()
  // const { showNotification } = useNotification()

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'security', label: 'Security' },
    { id: 'orders', label: 'Order History' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    >
      <SEOHead title="My Profile | Marketplace" description="Manage your account, addresses, and security settings." />
      
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
        <div className="flex flex-col md:flex-row">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-100/50 dark:bg-gray-800/50 p-6 border-r border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Account</h2>
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 md:p-12">
            <AnimateTabContent tab={activeTab}>
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'addresses' && <AddressesTab />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'orders' && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order History</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">View and track all your recent orders.</p>
                  <Link to="/orders" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
                    Go to Orders
                  </Link>
                </div>
              )}
            </AnimateTabContent>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

function AnimateTabContent({ children, tab }) {
  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function ProfileTab() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h3>
        <div className="flex items-center space-x-6 mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1 shadow-lg">
            <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-900 overflow-hidden">
              <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">JD</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium">
            Change Avatar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" defaultValue="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" defaultValue="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
            <input type="tel" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" defaultValue="+234 800 000 0000" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500" defaultChecked />
            <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">SMS Notifications</span>
          </label>
        </div>
      </div>
      
      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors w-full md:w-auto shadow-md">
        Save Changes
      </button>
    </div>
  )
}

function AddressesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
        <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors font-medium">
          + Add New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm relative group hover:shadow-md transition-shadow">
            {i === 1 && <span className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">Default</span>}
            <p className="font-bold text-gray-900 dark:text-white mb-1">John Doe</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">123 Example Street, Line 2</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Lagos, Lagos State 100001</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">+234 800 000 0000</p>
            <div className="flex space-x-3 text-sm">
              <button className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
              <button className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sample form for adding address, initially hidden in real app */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
        <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          <input type="text" placeholder="Phone Number" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          <input type="text" placeholder="Address Line 1" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2 dark:text-white" />
          <input type="text" placeholder="Address Line 2 (Optional)" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2 dark:text-white" />
          <input type="text" placeholder="City" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          <select className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
            <option value="">Select State</option>
            {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
          <input type="text" placeholder="Postal Code" className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Save Address</button>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
          </div>
          <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium rounded-xl transition-colors shadow-md">
            Update Password
          </button>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Two-Factor Authentication (2FA)</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">Add an extra layer of security to your account by requiring a code from your authenticator app when you log in.</p>
        
        <div className="p-6 border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl max-w-md">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900 dark:text-white">Authenticator App</span>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">Not Configured</span>
          </div>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
            Setup 2FA
          </button>
        </div>
      </div>
    </div>
  )
}

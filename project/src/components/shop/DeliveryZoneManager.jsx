import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI } from '../../services/api'

const NIGERIAN_STATES = [
  { value: 'abia', label: 'Abia' },
  { value: 'adamawa', label: 'Adamawa' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'fct', label: 'FCT (Abuja)' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' },
]

export default function DeliveryZoneManager({ slug, onToast }) {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaultFee, setDefaultFee] = useState('')
  const [notes, setNotes] = useState([])
  const [showNotes, setShowNotes] = useState(false)

  // Build a map of state -> { fee, is_active, id } from API
  const [stateMap, setStateMap] = useState({})

  const loadZones = () => {
    setLoading(true)
    shopAPI.deliveryZones(slug)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || [])
        setZones(list)
        const map = {}
        list.forEach(z => {
          map[z.state] = { fee: z.fee, is_active: z.is_active, id: z.id }
        })
        setStateMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const loadNotes = () => {
    shopAPI.deliveryNotes(slug)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.results || [])
        setNotes(list)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (slug) {
      loadZones()
      loadNotes()
    }
  }, [slug])

  const toggleState = (stateVal) => {
    setStateMap(prev => {
      const current = prev[stateVal]
      if (current) {
        // Toggle active
        return { ...prev, [stateVal]: { ...current, is_active: !current.is_active } }
      } else {
        // Enable with default fee
        return { ...prev, [stateVal]: { fee: defaultFee || '0', is_active: true, id: null } }
      }
    })
  }

  const updateFee = (stateVal, fee) => {
    setStateMap(prev => ({
      ...prev,
      [stateVal]: { ...(prev[stateVal] || { is_active: true, id: null }), fee }
    }))
  }

  const enableAll = () => {
    const fee = defaultFee || '0'
    const newMap = {}
    NIGERIAN_STATES.forEach(s => {
      newMap[s.value] = stateMap[s.value]
        ? { ...stateMap[s.value], is_active: true, fee: stateMap[s.value].fee || fee }
        : { fee, is_active: true, id: null }
    })
    setStateMap(newMap)
  }

  const disableAll = () => {
    const newMap = {}
    Object.entries(stateMap).forEach(([key, val]) => {
      newMap[key] = { ...val, is_active: false }
    })
    setStateMap(newMap)
  }

  const handleSave = async () => {
    setSaving(true)
    const zonesToSave = Object.entries(stateMap)
      .filter(([_, val]) => val.fee !== '' && val.fee !== undefined)
      .map(([state, val]) => ({
        state,
        fee: parseFloat(val.fee) || 0,
        is_active: val.is_active,
      }))

    try {
      await shopAPI.saveDeliveryZonesBulk(slug, zonesToSave)
      loadZones()
      onToast?.('Delivery zones saved successfully!')
    } catch {
      onToast?.('Failed to save delivery zones.')
    } finally {
      setSaving(false)
    }
  }

  const markNoteRead = async (noteId) => {
    try {
      await shopAPI.markNoteRead(slug, noteId)
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_read: true } : n))
    } catch {}
  }

  const activeCount = Object.values(stateMap).filter(v => v.is_active).length
  const unreadNotes = notes.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-gray-200 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              🚚 Delivery Zones
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                {activeCount} / 37 states
              </span>
            </h4>
            <p className="text-sm text-gray-500 mt-1">Set delivery fees per Nigerian state. States not listed won't be available at checkout.</p>
          </div>
          {unreadNotes > 0 && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1.5 rounded-lg bg-accent-50 text-accent-700 text-sm font-medium border border-accent-200 hover:bg-accent-100 transition-colors"
            >
              📬 {unreadNotes} new {unreadNotes === 1 ? 'note' : 'notes'}
            </button>
          )}
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Default fee (₦):</label>
            <input
              type="number"
              min="0"
              value={defaultFee}
              onChange={e => setDefaultFee(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              placeholder="e.g. 2000"
            />
          </div>
          <button onClick={enableAll} className="px-3 py-1.5 rounded-lg bg-success-50 text-success-700 text-sm font-medium border border-success-200 hover:bg-success-100 transition-colors">
            Enable All States
          </button>
          <button onClick={disableAll} className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-100 transition-colors">
            Disable All
          </button>
        </div>

        {/* State grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
          {NIGERIAN_STATES.map(s => {
            const zone = stateMap[s.value]
            const isActive = zone?.is_active || false

            return (
              <div
                key={s.value}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                  isActive
                    ? 'border-primary-200 bg-primary-50/50'
                    : 'border-gray-100 bg-gray-50/50 opacity-60'
                }`}
              >
                <button
                  onClick={() => toggleState(s.value)}
                  className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isActive && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm font-medium text-gray-800 flex-1 leading-tight">{s.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    value={zone?.fee || ''}
                    onChange={e => updateFee(s.value, e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-gray-200 bg-white text-gray-900 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500"
                    placeholder="0"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Save button */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors shadow-sm"
            whileTap={{ scale: 0.97 }}
          >
            {saving ? 'Saving…' : 'Save Delivery Zones'}
          </motion.button>
        </div>
      </div>

      {/* Delivery Notes */}
      <AnimatePresence>
        {showNotes && notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-xl border border-accent-200 bg-accent-50/30"
          >
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📬 Delivery Requests from Buyers
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    note.is_read
                      ? 'border-gray-200 bg-white'
                      : 'border-accent-300 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{note.sender_name}</span>
                        <span className="text-xs text-gray-400">{note.sender_email}</span>
                        {!note.is_read && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-500 text-white">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Wants delivery to <strong>{note.state_display}</strong>
                      </p>
                      {note.message && (
                        <p className="text-sm text-gray-500 mt-1 italic">"{note.message}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!note.is_read && (
                      <button
                        onClick={() => markNoteRead(note.id)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

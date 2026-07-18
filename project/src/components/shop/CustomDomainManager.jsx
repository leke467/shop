import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { shopAPI } from '../../services/api'
import { extractLimitError } from '../subscription/LimitReachedModal'
import { useNotification } from '../../context/NotificationContext'

/**
 * Custom domain management for the shop settings tab.
 *
 * Connecting a custom domain is a subscription feature. If the user's plan
 * lacks `custom_domain_enabled`, attaching returns a 403 with a structured
 * upgrade payload — we surface that through `onLimit` so the parent can show
 * the shared upgrade modal, keeping enforcement consistent app-wide.
 *
 * Flow shown to the owner:
 *   1. Enter a domain → we save it (status "pending") and reveal the DNS
 *      records to create (a CNAME + a TXT verification record).
 *   2. Owner adds those records at their DNS provider.
 *   3. Owner clicks "Verify" → backend resolves the TXT record and marks the
 *      domain verified once it matches.
 */
const STATUS_META = {
  none: { label: 'Not connected', cls: 'bg-gray-100 text-gray-500' },
  pending: { label: 'Pending verification', cls: 'bg-warning-100 text-warning-700' },
  verified: { label: 'Verified', cls: 'bg-success-100 text-success-700' },
  failed: { label: 'Verification failed', cls: 'bg-error-100 text-error-700' },
}

function DnsRecordRow({ record }) {
  const [copied, setCopied] = useState('')

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-900 text-white">{record.type}</span>
        <span className="text-xs text-gray-400">TTL {record.ttl}</span>
      </div>
      {['host', 'value'].map(field => (
        <div key={field} className="flex items-center gap-2">
          <span className="w-14 text-xs font-semibold text-gray-500 capitalize">{field}</span>
          <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 truncate">{record[field]}</code>
          <button
            type="button"
            onClick={() => copy(record[field], `${record.type}-${field}`)}
            className="text-xs text-primary-600 font-medium hover:text-primary-700 shrink-0"
          >
            {copied === `${record.type}-${field}` ? 'Copied' : 'Copy'}
          </button>
        </div>
      ))}
      <p className="text-xs text-gray-400">{record.purpose}</p>
    </div>
  )
}

export default function CustomDomainManager({ slug, onLimit }) {
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState(null) // { domain, status, verified_at, records }
  const [domainInput, setDomainInput] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast, confirm } = useNotification()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    shopAPI.getCustomDomain(slug)
      .then(data => {
        setInfo(data)
        setDomainInput(data?.domain || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const status = info?.status || 'none'
  const meta = STATUS_META[status] || STATUS_META.none
  const hasDomain = Boolean(info?.domain)

  const handleSave = async () => {
    setBusy(true)
    try {
      const data = await shopAPI.setCustomDomain(slug, domainInput.trim())
      setInfo(data)
      toast('Domain saved successfully.')
    } catch (err) {
      const limit = extractLimitError(err)
      if (limit) {
        onLimit?.(limit)
      } else {
        toast('Could not save domain.', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async () => {
    setBusy(true)
    try {
      const data = await shopAPI.verifyCustomDomain(slug)
      setInfo(data)
      if (data?.status === 'verified') {
        toast('Domain verified!')
      } else {
        toast('Domain not yet verified. Please ensure DNS records are correct.', 'warning')
      }
    } catch (err) {
      toast('Verification check failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    if (!(await confirm('Disconnect this custom domain?'))) return
    setBusy(true)
    try {
      await shopAPI.removeCustomDomain(slug)
      setInfo({ domain: '', status: 'none', records: [] })
      setDomainInput('')
      toast('Domain disconnected.')
    } catch (err) {
      toast('Could not remove domain.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="h-24 rounded-xl bg-gray-50 animate-pulse" />
  }

  return (
    <div className="p-5 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-gray-900">🌐 Custom Domain</h4>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Connect your own domain (like shop.yourbrand.com) to your storefront.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={domainInput}
          onChange={e => setDomainInput(e.target.value)}
          placeholder="shop.yourbrand.com"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm"
        />
        <motion.button
          type="button"
          onClick={handleSave}
          disabled={busy || !domainInput.trim()}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm disabled:opacity-60"
        >
          {hasDomain ? 'Update' : 'Connect'}
        </motion.button>
      </div>


      {hasDomain && info?.records?.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Add these records at your DNS provider
          </p>
          {info.records.map((r, i) => <DnsRecordRow key={i} record={r} />)}

          <div className="flex gap-2 pt-1">
            <motion.button
              type="button"
              onClick={handleVerify}
              disabled={busy || status === 'verified'}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold text-sm disabled:opacity-60"
            >
              {status === 'verified' ? 'Verified' : busy ? 'Checking…' : 'Verify domain'}
            </motion.button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

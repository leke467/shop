import { useState, useEffect } from 'react'
import { messagingAPI, shopAPI } from '../../services/api'
import { useUser } from '../../context/UserContext'

export default function MessagesTab({ shop }) {
  const { user } = useUser()
  const [conversations, setConversations] = useState([])
  const [deliveryNotes, setDeliveryNotes] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all' | 'chats' | 'delivery_notes'
  const [activeConv, setActiveConv] = useState(null)
  const [loadingConv, setLoadingConv] = useState(false)
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (shop) loadConversations()
  }, [shop])

  const loadConversations = async () => {
    try {
      const slug = shop?.slug
      const [msgData, notesData] = await Promise.allSettled([
        messagingAPI.list(slug),
        shopAPI.deliveryNotes ? shopAPI.deliveryNotes(slug) : Promise.resolve([])
      ])

      const rawMsgs = msgData.status === 'fulfilled' ? (Array.isArray(msgData.value) ? msgData.value : (msgData.value?.results || [])) : []
      const rawNotes = notesData.status === 'fulfilled' ? (Array.isArray(notesData.value) ? notesData.value : (notesData.value?.results || [])) : []

      // Normalize delivery notes into conversation-like items
      const formattedNotes = rawNotes.map(n => ({
        id: `note_${n.id}`,
        rawNoteId: n.id,
        is_delivery_note: true,
        customer_name: n.sender_name,
        customer_email: n.sender_email,
        subject: `📍 Delivery Request to ${n.state_requested || 'Location'}`,
        last_message: n.message || `Customer requested delivery to ${n.state_requested}.`,
        updated_at: n.created_at,
        is_read: n.is_read,
        messages: [
          {
            id: `msg_note_${n.id}`,
            sender_name: n.sender_name,
            sender_email: n.sender_email,
            is_seller: false,
            content: `Hello! I would like to order from your store but my state (${n.state_requested}) is not currently listed for delivery.\n\n${n.message || 'Please let me know if you can deliver to my location!'}`
          }
        ]
      }))

      setDeliveryNotes(formattedNotes)
      const merged = [...formattedNotes, ...rawMsgs].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      setConversations(merged)

      if (merged.length > 0 && !activeConv) {
        selectConversation(merged[0])
      }
    } catch (e) {
      console.error('Failed to load conversations:', e)
      setConversations([])
    }
  }

  const selectConversation = async (conv) => {
    if (!conv?.id) return
    if (conv.is_delivery_note) {
      setActiveConv(conv)
      if (conv.rawNoteId && shopAPI.markNoteRead && !conv.is_read) {
        shopAPI.markNoteRead(shop.slug, conv.rawNoteId).catch(() => {})
      }
      return
    }

    setLoadingConv(true)
    try {
      const detail = await messagingAPI.conversationDetail(conv.id)
      setActiveConv(detail)
    } catch (e) {
      console.error('Failed to load conversation detail:', e)
      setActiveConv(conv)
    } finally {
      setLoadingConv(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !activeConv) return
    const textToSend = reply
    setReply('')
    try {
      await messagingAPI.reply(activeConv.id, { message: textToSend })
      const updatedDetail = await messagingAPI.conversationDetail(activeConv.id)
      setActiveConv(updatedDetail)
      loadConversations()
    } catch (e) {
      console.error('Failed to send reply:', e)
      setReply(textToSend)
    }
  }

  const safeConversations = Array.isArray(conversations) ? conversations : []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col h-1/2 md:h-full">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Conversations</h3>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">{safeConversations.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {safeConversations.length === 0 ? (
            <div className="p-8 text-xs sm:text-sm text-gray-500 text-center">
              <span className="text-2xl block mb-2">💬</span>
              No messages yet from storefront visitors.
            </div>
          ) : (
            safeConversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => selectConversation(c)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-amber-50/40 transition-colors ${activeConv?.id === c.id ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{c.customer_name || c.subject || 'Customer'}</h4>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-1">{new Date(c.updated_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.last_message || 'New message...'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Messages View */}
      <div className="w-full md:w-2/3 flex flex-col bg-gray-50/40 h-1/2 md:h-full">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900">{activeConv.customer_name || 'Customer'}</h3>
                <p className="text-xs text-gray-500">{activeConv.subject || 'Storefront Inquiry'}</p>
              </div>
              {activeConv.customer_email && (
                <a href={`mailto:${activeConv.customer_email}`} className="text-xs font-semibold text-amber-600 hover:underline">
                  ✉️ {activeConv.customer_email}
                </a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingConv ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading messages...</div>
              ) : (
                (activeConv.messages || []).map((m, idx) => {
                  const isSeller = m.sender === user?.id || m.sender_email === user?.email || m.is_seller
                  return (
                    <div key={m.id || idx} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap ${
                        isSeller 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-xs shadow-xs' 
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-xs shadow-xs'
                      }`}>
                        <div className="text-[10px] font-bold opacity-75 mb-1">{m.sender_name || (isSeller ? 'You (Shop)' : 'Customer')}</div>
                        {m.content}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3.5 bg-white border-t border-gray-100">
              {activeConv.is_delivery_note ? (
                <div className="flex items-center justify-between gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 font-medium">This is an undelivered location inquiry. Respond directly to the customer's email address:</span>
                  <a
                    href={`mailto:${activeConv.customer_email}?subject=Re: Delivery Inquiry for ${shop?.name}&body=Hello ${activeConv.customer_name},%0D%0A%0D%0AThank you for reaching out regarding delivery to your location!`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shrink-0 transition-all shadow-xs"
                  >
                    ✉️ Reply to {activeConv.customer_email}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input 
                    type="text" 
                    value={reply} 
                    onChange={e => setReply(e.target.value)} 
                    placeholder="Type your reply to customer..." 
                    className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500/30 outline-none text-xs sm:text-sm font-medium"
                  />
                  <button type="submit" disabled={!reply.trim()} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all shrink-0">
                    Send
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs sm:text-sm p-6 text-center">
            <span className="text-3xl mb-2">💬</span>
            Select a conversation to view and reply to messages
          </div>
        )}
      </div>
    </div>
  )
}

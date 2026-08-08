import { useState, useEffect } from 'react';
import { messagingAPI } from '../../services/api';

export default function MessagesTab({ shop }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (shop) loadConversations();
  }, [shop]);

  const loadConversations = async () => {
    try {
      const data = await messagingAPI.list(shop.slug);
      setConversations(data || []);
    } catch (e) {
      console.error(e);
      setConversations([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeConv) return;
    try {
      await messagingAPI.reply(activeConv.id, { message: reply });
      setReply('');
      // Optimistically add message or reload
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[600px]">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Conversations</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No messages yet.</div>
          ) : (
            conversations.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveConv(c)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeConv?.id === c.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{c.customer_name || 'Customer'}</h4>
                  <span className="text-xs text-gray-400">{new Date(c.updated_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main View */}
      <div className="w-2/3 flex flex-col bg-gray-50/30">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900">{activeConv.customer_name || 'Customer'}</h3>
              <p className="text-xs text-gray-500">Subject: {activeConv.subject || 'General Inquiry'}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(activeConv.messages || []).map((m, idx) => (
                <div key={idx} className={`flex ${m.is_seller ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${m.is_seller ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={reply} 
                  onChange={e => setReply(e.target.value)} 
                  placeholder="Type your reply..." 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none text-sm"
                />
                <button type="submit" disabled={!reply.trim()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">Send</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}

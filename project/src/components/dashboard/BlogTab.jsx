import { useState, useEffect } from 'react';
import { blogAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function BlogTab({ shop }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const { toast, confirm } = useNotification();

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'published',
    tags: '',
  });

  useEffect(() => {
    if (shop?.slug) loadPosts();
  }, [shop?.slug]);

  const loadPosts = async () => {
    if (!shop?.slug) return;
    setLoading(true);
    try {
      // First try to fetch seller's posts, or fallback to list
      const data = await blogAPI.myPosts().catch(() => blogAPI.list(shop.slug));
      const list = Array.isArray(data) ? data : (data?.results || []);
      setPosts(list);
    } catch (e) {
      console.error('Failed to load blog posts:', e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      excerpt: '',
      status: 'published',
      tags: '',
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const tagsArray = form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || form.content.trim().slice(0, 150),
        status: form.status,
        tags: tagsArray,
      };

      if (editingPost?.slug || editingPost?.id) {
        const identifier = editingPost.slug || editingPost.id;
        await blogAPI.update(identifier, payload);
        toast(`Post "${payload.title}" updated successfully!`);
      } else {
        await blogAPI.create(payload);
        toast(`Post "${payload.title}" published successfully!`);
      }
      resetForm();
      loadPosts();
    } catch (e) {
      console.error(e);
      const detail = e.response?.data?.detail || e.response?.data?.title?.[0] || 'Failed to save blog post';
      toast(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!(await confirm(`Are you sure you want to delete "${post.title}"?`))) return;
    try {
      const identifier = post.slug || post.id;
      await blogAPI.delete(identifier);
      setPosts(prev => prev.filter(p => (p.slug || p.id) !== identifier));
      toast('Blog post deleted successfully');
    } catch (e) {
      console.error(e);
      toast('Failed to delete blog post', 'error');
    }
  };

  const handleEdit = (p) => {
    setEditingPost(p);
    setForm({
      title: p.title || '',
      content: p.content || '',
      excerpt: p.excerpt || '',
      status: p.status || 'published',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
    });
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Store Blog & Stories</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Share store updates, guides, recipe stories, and announcements</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all text-sm self-start sm:self-auto shadow-xs"
        >
          {showForm ? '✕ Close Form' : '+ New Blog Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-6 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
            <h4 className="font-bold text-gray-900 text-sm">{editingPost ? `Edit Post: ${editingPost.title}` : 'Write New Blog Post'}</h4>
            <span className="text-xs text-gray-400 font-medium">* Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Post Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-bold text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
                placeholder="e.g. 5 Ways to Style Our Handcrafted Bags"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Publication Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
              >
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Short Excerpt (Optional)</label>
            <input
              type="text"
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
              placeholder="Brief summary to entice readers on social and cards..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Article Content *</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900 resize-y"
              placeholder="Write your story, announcement, or product guide here..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tags (Comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-mono focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
              placeholder="e.g. style, summer, tutorial, handmade"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200/80">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : (editingPost ? 'Update Post' : 'Publish Post')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <span className="text-4xl block mb-2">📝</span>
          <h4 className="font-bold text-gray-900 text-base">No blog posts published yet</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Publish news, announcements, and guides to engage your audience.</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl transition-all"
          >
            + Write First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.slug || p.id} className="p-4 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{p.title}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'published' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status || 'published'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{p.excerpt || p.content}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                  <span>📅 {new Date(p.created_at || Date.now()).toLocaleDateString()}</span>
                  {p.view_count !== undefined && <span>👁️ {p.view_count} views</span>}
                  {p.slug && <span className="font-mono text-[10px]">/{p.slug}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleEdit(p)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="text-xs font-bold text-error-600 hover:text-error-800 transition-colors px-3 py-1.5 rounded-lg bg-error-50 hover:bg-error-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

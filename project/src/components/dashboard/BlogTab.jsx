import { useState, useEffect } from 'react';
import { blogAPI } from '../../services/api';

export default function BlogTab({ shop }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    if (shop) loadPosts();
  }, [shop]);

  const loadPosts = async () => {
    try {
      const data = await blogAPI.list(shop.slug);
      setPosts(data || []);
    } catch (e) {
      console.error(e);
      setPosts([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await blogAPI.update(form.id, form);
      } else {
        await blogAPI.create(shop.slug, form);
      }
      loadPosts();
      setShowForm(false);
      setForm({ title: '', content: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await blogAPI.delete(id);
      loadPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (p) => {
    setForm(p);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Blog Posts</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all">
          {showForm ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none" placeholder="Enter post title..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
            <textarea required rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none resize-none" placeholder="Write your post content here..."></textarea>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-success-600 hover:bg-success-700 text-white font-semibold rounded-lg transition-all">Save Post</button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No blog posts found. Share some news with your customers!</div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <div key={p.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-start hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900">{p.title}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                <span className="text-xs text-gray-400 mt-2 block">{new Date(p.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-3 ml-4">
                <button onClick={() => handleEdit(p)} className="text-sm font-medium text-primary-600 hover:text-primary-700">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-sm font-medium text-error-600 hover:text-error-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

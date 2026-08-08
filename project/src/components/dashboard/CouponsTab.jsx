import { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';

export default function CouponsTab({ shop }) {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percentage: '', valid_until: '' });

  useEffect(() => {
    if (shop) loadCoupons();
  }, [shop]);

  const loadCoupons = async () => {
    try {
      const data = await couponAPI.list(shop.slug);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setCoupons(list);
    } catch (e) {
      console.error(e);
      setCoupons([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await couponAPI.update(form.id, form);
      } else {
        await couponAPI.create(shop.slug, form);
      }
      loadCoupons();
      setShowForm(false);
      setForm({ code: '', discount_percentage: '', valid_until: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await couponAPI.delete(id);
      loadCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (c) => {
    setForm(c);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Coupons</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all">
          {showForm ? 'Cancel' : 'Add Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
              <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none" placeholder="e.g. SUMMER20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Discount %</label>
              <input required type="number" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none" placeholder="20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valid Until</label>
              <input required type="date" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 outline-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-success-600 hover:bg-success-700 text-white font-semibold rounded-lg transition-all">Save Coupon</button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No coupons found. Create one to get started!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valid Until</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-gray-600">{c.discount_percentage}%</td>
                  <td className="px-4 py-3 text-gray-600">{c.valid_until}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => handleEdit(c)} className="text-sm font-medium text-primary-600 hover:text-primary-700">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-sm font-medium text-error-600 hover:text-error-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

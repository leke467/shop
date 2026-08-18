import { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function CouponsTab({ shop }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const { toast, confirm } = useNotification();

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    value: '',
    minimum_order_value: '0',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    if (shop?.slug) loadCoupons();
  }, [shop?.slug]);

  const loadCoupons = async () => {
    if (!shop?.slug) return;
    setLoading(true);
    try {
      const data = await couponAPI.list(shop.slug);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setCoupons(list);
    } catch (e) {
      console.error('Failed to load coupons:', e);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      value: '',
      minimum_order_value: '0',
      valid_until: '',
      is_active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop?.slug) return;
    if (!form.code.trim() || !form.value) {
      toast('Please enter a valid coupon code and discount value', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        value: Number(form.value),
        minimum_order_value: Number(form.minimum_order_value || 0),
        is_active: form.is_active,
        ...(form.valid_until ? { valid_until: form.valid_until } : {}),
      };

      if (editingCoupon?.id) {
        await couponAPI.update(shop.slug, editingCoupon.id, payload);
        toast(`Coupon "${payload.code}" updated successfully!`);
      } else {
        await couponAPI.create(shop.slug, payload);
        toast(`Coupon "${payload.code}" created successfully!`);
      }
      resetForm();
      loadCoupons();
    } catch (e) {
      console.error(e);
      const detail = e.response?.data?.detail || e.response?.data?.code?.[0] || e.response?.data?.value?.[0] || 'Failed to save coupon';
      toast(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    if (!shop?.slug) return;
    const newStatus = !coupon.is_active;
    try {
      await couponAPI.update(shop.slug, coupon.id, { is_active: newStatus });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: newStatus } : c));
      toast(`Coupon ${coupon.code} ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast('Failed to update coupon status', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    if (!shop?.slug) return;
    if (!(await confirm(`Are you sure you want to delete coupon "${coupon.code}"?`))) return;
    try {
      await couponAPI.delete(shop.slug, coupon.id);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      toast('Coupon deleted successfully');
    } catch (e) {
      console.error(e);
      toast('Failed to delete coupon', 'error');
    }
  };

  const handleEdit = (c) => {
    setEditingCoupon(c);
    setForm({
      code: c.code || '',
      discount_type: c.discount_type || 'percentage',
      value: c.value || '',
      minimum_order_value: c.minimum_order_value || '0',
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : '',
      is_active: c.is_active !== undefined ? c.is_active : true,
    });
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Discount Coupons</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Create promotional codes and discount campaigns for your customers</p>
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
          {showForm ? '✕ Close Form' : '+ Add Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-6 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
            <h4 className="font-bold text-gray-900 text-sm">{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}</h4>
            <span className="text-xs text-gray-400 font-medium">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Coupon Code *</label>
              <input
                required
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900 uppercase"
                placeholder="e.g. FLASH20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {form.discount_type === 'percentage' ? 'Discount Value (%) *' : 'Discount Amount (₦) *'}
              </label>
              <input
                required
                type="number"
                min="0.1"
                step={form.discount_type === 'percentage' ? '0.1' : '1'}
                max={form.discount_type === 'percentage' ? '100' : undefined}
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
                placeholder={form.discount_type === 'percentage' ? '20' : '2000'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Min. Order Value (₦)</label>
              <input
                type="number"
                min="0"
                value={form.minimum_order_value}
                onChange={e => setForm({ ...form, minimum_order_value: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
                placeholder="0 for no minimum"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Valid Until (Optional)</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-gray-900"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
              </label>
              <span className="text-xs font-bold text-gray-700">Coupon Active</span>
            </div>
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
              {saving ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm animate-pulse">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <span className="text-4xl block mb-2">🎟️</span>
          <h4 className="font-bold text-gray-900 text-base">No coupons created yet</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Create discount coupons to boost storefront conversion and reward loyal shoppers.</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl transition-all"
          >
            + Create First Coupon
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Min. Order</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {coupons.map(c => (
                <tr key={c.id || c.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200/80 text-xs">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {c.discount_type === 'percentage' ? `${c.value}% OFF` : `₦${Number(c.value).toLocaleString()} OFF`}
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs font-medium">
                    {Number(c.minimum_order_value) > 0 ? `₦${Number(c.minimum_order_value).toLocaleString()}` : 'None'}
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                        c.is_active 
                          ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-success-600' : 'bg-gray-400'}`} />
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right space-x-3">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-xs font-bold text-error-600 hover:text-error-800 transition-colors"
                    >
                      Delete
                    </button>
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

import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';

export default function AnalyticsTab({ shop }) {
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customersData, setCustomersData] = useState(null);

  useEffect(() => {
    if (shop?.slug) {
      loadAllAnalytics();
    }
  }, [shop?.slug, periodDays]);

  const loadAllAnalytics = async () => {
    if (!shop?.slug) return;
    setLoading(true);
    try {
      const [overviewRes, revenueRes, productsRes, customersRes] = await Promise.allSettled([
        analyticsAPI.overview(shop.slug),
        analyticsAPI.revenue(shop.slug, { days: periodDays }),
        analyticsAPI.products(shop.slug),
        analyticsAPI.customers(shop.slug),
      ]);

      const ov = overviewRes.status === 'fulfilled' ? overviewRes.value : {};
      const rev = revenueRes.status === 'fulfilled' && Array.isArray(revenueRes.value) ? revenueRes.value : [];
      const prod = productsRes.status === 'fulfilled' && Array.isArray(productsRes.value) ? productsRes.value : [];
      const cust = customersRes.status === 'fulfilled' ? customersRes.value : {};

      setOverview(ov);
      setRevenueData(rev);
      setTopProducts(prod);
      setCustomersData(cust);
    } catch (e) {
      console.error('Failed to load shop analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  // Derive metric stats
  const totalRevenue = Number(overview?.total_revenue || 0);
  const totalOrders = Number(overview?.total_orders || 0);
  const avgOrderValue = Number(overview?.average_value || 0);
  const totalCustomers = Number(customersData?.total_customers || 0);
  const returningCustomers = Number(customersData?.returning_customers || 0);
  const newCustomers = Number(customersData?.new_customers || 0);

  // Derive max revenue for chart scaling
  const maxRevenue = Math.max(...revenueData.map(d => Number(d.revenue || 0)), 1);

  // Format states breakdown
  const rawStates = customersData?.by_state || [];
  const stateTotal = rawStates.reduce((acc, s) => acc + (s.count || 0), 0) || 1;
  const statesWithPercent = rawStates.map(s => ({
    state: s.state || 'Other',
    count: s.count || 0,
    percentage: Math.round(((s.count || 0) / stateTotal) * 100),
  }));

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 h-72 animate-pulse" />
          <div className="bg-white p-6 rounded-2xl border border-gray-100 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📈</span> Store Analytics & Performance
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Real-time revenue, order statistics, and customer metrics for {shop?.name}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[
            { label: '7 Days', days: 7 },
            { label: '30 Days', days: 30 },
            { label: '90 Days', days: 90 },
          ].map(p => (
            <button
              key={p.days}
              onClick={() => setPeriodDays(p.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                periodDays === p.days ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            <span className="text-lg">💰</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">₦{totalRevenue.toLocaleString()}</h4>
          <p className="text-[11px] text-gray-400 mt-1">Lifetime completed orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <span className="text-lg">📦</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">{totalOrders}</h4>
          <p className="text-[11px] text-gray-400 mt-1">Order groups placed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</span>
            <span className="text-lg">🎯</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">₦{Math.round(avgOrderValue).toLocaleString()}</h4>
          <p className="text-[11px] text-gray-400 mt-1">Average per customer order</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customers</span>
            <span className="text-lg">👥</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">{totalCustomers}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md">
              {newCustomers} new
            </span>
            <span className="text-[10px] font-bold text-secondary-600 bg-secondary-50 px-1.5 py-0.5 rounded-md">
              {returningCustomers} repeat
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Timeseries Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-xs text-gray-400">Daily sales over the last {periodDays} days</p>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
              {revenueData.length} data points
            </span>
          </div>

          {revenueData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <span className="text-3xl mb-1">📊</span>
              <p className="text-xs font-medium">No sales recorded during this period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-52 flex items-end gap-1.5 pt-6 pb-2 px-2 bg-gray-50/50 rounded-xl border border-gray-100 overflow-x-auto">
                {revenueData.map((d, idx) => {
                  const revVal = Number(d.revenue || 0);
                  const barHeight = Math.max((revVal / maxRevenue) * 100, 6);
                  const dateStr = d.date ? new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`;
                  return (
                    <div key={idx} className="flex-1 min-w-[20px] max-w-[40px] flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap transition-opacity shadow-lg z-20">
                        {dateStr}: ₦{revVal.toLocaleString()} ({d.orders || 0} orders)
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500 rounded-t-md transition-all cursor-pointer shadow-2xs"
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 px-1 font-mono">
                <span>{revenueData[0]?.date ? new Date(revenueData[0].date).toLocaleDateString() : 'Start'}</span>
                <span>{revenueData[revenueData.length - 1]?.date ? new Date(revenueData[revenueData.length - 1].date).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Top Selling Products</h3>
              <p className="text-xs text-gray-400">Ranked by units sold and revenue</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Top {topProducts.length}
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <span className="text-3xl mb-1">📦</span>
              <p className="text-xs font-medium">No product sales yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-56 space-y-2.5 divide-y divide-gray-100">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between pt-2.5 first:pt-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold flex items-center justify-center text-gray-700 shrink-0">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{p.product_name}</h4>
                      <p className="text-[11px] text-gray-500">{p.purchase_count} units sold</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-primary-600 shrink-0 ml-2">
                    ₦{Number(p.revenue || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Geographical Breakdown by State */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Customer Breakdown by Nigerian State</h3>
            <p className="text-xs text-gray-400">Geographic distribution of buyer shipping locations</p>
          </div>
          <span className="text-xs font-bold text-secondary-600 bg-secondary-50 px-2.5 py-1 rounded-full">
            {statesWithPercent.length} States Active
          </span>
        </div>

        {statesWithPercent.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs">
            <span className="text-2xl block mb-1">🗺️</span>
            No geographical shipping data available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statesWithPercent.map((s, idx) => (
              <div key={idx} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-gray-800">{s.state}</span>
                  <span className="font-mono font-bold text-gray-900">{s.count} buyers ({s.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-secondary-500 to-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// dis_analytics.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/utils/supabaseClient';
import { format } from 'date-fns';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const ChartSection = ({
  title,
  children,
  filters,
  setFilters,
  products = [],
  productFilter = false,
  statusFilter = false,
  dateFilter = false,
}) => {
  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 mb-10 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-indigo-500/50 to-blue-500/50"></div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          {productFilter && (
            <select
              className="bg-gray-800/70 text-white rounded px-3 py-1 border border-indigo-500/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, productId: e.target.value }))
              }
              value={filters.productId}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {statusFilter && (
            <select
              className="bg-gray-800 text-white rounded px-3 py-1"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              value={filters.status}
            >
              <option value="">All Status</option>
              <option value="Accepted">Accepted</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          )}

          {dateFilter && (
            <>
              <input
                type="date"
                className="bg-gray-800 text-white rounded px-2 py-1"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, from: e.target.value }))
                }
                value={filters.from}
              />
              <input
                type="date"
                className="bg-gray-800 text-white rounded px-2 py-1"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, to: e.target.value }))
                }
                value={filters.to}
              />
            </>
          )}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"></div>
    </div>
  );
};

import { useMemo } from 'react';

const DisAnalytics = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', status: '', productId: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;
      if (!session) return router.push("/login");

      const userId = session.user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profileData || profileData.role !== "Distributor") {
        return router.push("/login");
      }

      setProfile(profileData);

      const { data: orderData } = await supabase
        .from("orders")
        .select("*, product_id(id, name)")
        .eq("distributor_id", userId);

      const { data: productList } = await supabase
        .from("products")
        .select("id, name");

      setOrders(orderData || []);
      setProducts(productList || []);
    };

    fetchData();
  }, [router]);

  const aggregate = () => {
    const totalOrdersCount = orders.length;
    let totalRevenue = 0;
    let quantitySum = 0;

    const revenueByProduct = {};
    const quantityByProduct = {};
    const revenueOverTime = {};
    const quantityOverTime = {};
    const statusCount = {};
    const revenueByPackaging = {};
    const weekdayHourGrid = {};
    const dailyRevenueMap = {};

    const hourBucket = (hour) => {
      if (hour < 4) return '0-3';
      if (hour < 8) return '4-7';
      if (hour < 12) return '8-11';
      if (hour < 16) return '12-15';
      if (hour < 20) return '16-19';
      return '20-23';
    };

    const weekdayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const o of orders) {
      const dateObj = new Date(o.created_at);
      const date = format(dateObj, 'yyyy-MM-dd');
      const day = weekdayMap[dateObj.getDay()];
      const hour = dateObj.getHours();
      const hBucket = hourBucket(hour);

      const product = o.product_id?.name || 'Unknown';
      const packaging = o.packaging || 'N/A';
      const revenue = o.price || 0;
      const qty = o.quantity || 0;
      const status = o.status || 'Unknown';

      totalRevenue += revenue;
      quantitySum += qty;

      revenueByProduct[product] = (revenueByProduct[product] || 0) + revenue;
      quantityByProduct[product] = (quantityByProduct[product] || 0) + qty;
      revenueOverTime[date] = (revenueOverTime[date] || 0) + revenue;
      quantityOverTime[date] = (quantityOverTime[date] || 0) + qty;
      revenueByPackaging[packaging] = (revenueByPackaging[packaging] || 0) + revenue;
      statusCount[status] = (statusCount[status] || 0) + 1;
      dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + revenue;

      if (!weekdayHourGrid[day]) weekdayHourGrid[day] = {};
      weekdayHourGrid[day][hBucket] = (weekdayHourGrid[day][hBucket] || 0) + 1;
    }

    const avgOrderValue = quantitySum ? totalRevenue / quantitySum : 0;
    const mostOrderedProduct = Object.entries(quantityByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topRevenueProduct = Object.entries(revenueByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const mostActiveDay = Object.entries(dailyRevenueMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const accepted = statusCount["Accepted"] || 0;
    const rejected = statusCount["Rejected"] || 0;
    const acceptanceRate = totalOrdersCount ? (accepted / totalOrdersCount) * 100 : 0;
    const rejectionRate = totalOrdersCount ? (rejected / totalOrdersCount) * 100 : 0;

    const avgDailyRevenue = Object.values(dailyRevenueMap).length
      ? totalRevenue / Object.values(dailyRevenueMap).length
      : 0;

    return {
      totalOrdersCount,
      totalRevenue,
      avgOrderValue,
      quantitySum,
      revenueByProduct,
      quantityByProduct,
      revenueOverTime,
      quantityOverTime,
      statusCount,
      revenueByPackaging,
      mostOrderedProduct,
      topRevenueProduct,
      mostActiveDay,
      acceptanceRate,
      rejectionRate,
      avgDailyRevenue,
      weekdayHourGrid,
    };
  };

  // dis_analytics.js

// [rest of the file remains unchanged above this line]

// Ensure 'orders' is defined and safe
const safeOrders = Array.isArray(orders) ? orders : [];

// Repeat Product Orders
const repeatLabels = [...new Set(safeOrders.map(o => o?.product_id?.name).filter(Boolean))];
const repeatData = repeatLabels.map(label =>
  safeOrders.reduce((count, o) => (o?.product_id?.name === label ? count + 1 : count), 0)
);

// Month-on-Month Growth
const monthlyGrowthMap = {};
safeOrders.forEach((o) => {
  if (o?.created_at) {
    const month = format(new Date(o.created_at), 'yyyy-MM');
    monthlyGrowthMap[month] = (monthlyGrowthMap[month] || 0) + 1;
  }
});
const months = Object.keys(monthlyGrowthMap).sort();
const monthlyData = months.map(month => monthlyGrowthMap[month]);

  const aggregated = orders.length > 0 ? aggregate() : null;

  const sevenDayMovingAvgData = useMemo(() => {
    const dailyCounts = {};
    orders.forEach((o) => {
      const day = format(new Date(o.created_at), 'yyyy-MM-dd');
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const sortedDays = Object.keys(dailyCounts).sort();
    const movingAvg = [];

    sortedDays.forEach((day, i) => {
      const slice = sortedDays.slice(Math.max(i - 6, 0), i + 1);
      const sum = slice.reduce((acc, d) => acc + dailyCounts[d], 0);
      movingAvg.push(sum / slice.length);
    });

    return {
      labels: sortedDays,
      datasets: [
        {
          label: '7-Day Avg Orders',
          data: movingAvg,
          borderColor: '#A78BFA',
          backgroundColor: 'rgba(167, 139, 250, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [orders]);

  if (!profile || !aggregated) return <div className="text-white p-6">Loading...</div>;

  const {
    totalOrdersCount,
    totalRevenue,
    avgOrderValue,
    quantitySum,
    revenueByProduct,
    quantityByProduct,
    revenueOverTime,
    quantityOverTime,
    statusCount,
    revenueByPackaging,
    mostOrderedProduct,
    topRevenueProduct,
    mostActiveDay,
    acceptanceRate,
    rejectionRate,
    avgDailyRevenue,
    weekdayHourGrid,
  } = aggregated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] animate-pulse-slow"></div>
        <div className="absolute top-3/4 left-2/3 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[60px] animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-[70px] animate-pulse-slow animation-delay-4000"></div>
      </div>
      <h1 className="text-4xl font-extrabold mb-10 text-center tracking-tight relative z-10">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient-x">📊 Distributor Insights</span>
        <div className="w-64 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 mx-auto mt-2"></div>
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 relative z-10">
        {[
          {
            label: "Total Orders",
            value: totalOrdersCount,
            icon: "📦",
            color: "bg-gradient-to-tr from-green-400 to-green-600",
          },
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toFixed(2)}`,
            icon: "💰",
            color: "bg-gradient-to-tr from-yellow-400 to-yellow-600",
          },
          {
            label: "Avg Order Value",
            value: `$${avgOrderValue.toFixed(2)}`,
            icon: "📈",
            color: "bg-gradient-to-tr from-blue-400 to-blue-600",
          },
          {
            label: "Most Ordered Product",
            value: mostOrderedProduct,
            icon: "🔥",
            color: "bg-gradient-to-tr from-purple-400 to-purple-600",
          },
          {
            label: "Top Revenue Product",
            value: topRevenueProduct,
            icon: "🏆",
            color: "bg-gradient-to-tr from-pink-400 to-pink-600",
          },
          {
            label: "Most Active Day",
            value: mostActiveDay,
            icon: "📅",
            color: "bg-gradient-to-tr from-indigo-400 to-indigo-600",
          },
          {
            label: "Acceptance Rate",
            value: `${acceptanceRate.toFixed(1)}%`,
            icon: "✅",
            color: "bg-gradient-to-tr from-emerald-400 to-emerald-600",
          },
          {
            label: "Rejection Rate",
            value: `${rejectionRate.toFixed(1)}%`,
            icon: "❌",
            color: "bg-gradient-to-tr from-red-400 to-red-600",
          },
          {
            label: "Avg Daily Revenue",
            value: `$${avgDailyRevenue.toFixed(2)}`,
            icon: "📊",
            color: "bg-gradient-to-tr from-cyan-400 to-cyan-600",
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className={`${metric.color} bg-opacity-20 backdrop-blur-md rounded-xl p-4 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] w-full flex flex-col items-center text-center space-y-1 border border-white/10 group`}
          >
            <div className="text-xl mb-1 group-hover:scale-110 transition-transform duration-300">{metric.icon}</div>
            <div className="text-sm uppercase tracking-wide font-semibold text-gray-300">{metric.label}</div>
            <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">{metric.value}</div>
          </div>
        ))}
      </div>

      <ChartSection
        title="📦 Orders by Product"
        filters={filters}
        setFilters={setFilters}
        products={products}
        productFilter
      >
        <Bar
          data={{
            labels: Object.keys(quantityByProduct),
            datasets: [
              {
                label: 'Quantity',
                data: Object.values(quantityByProduct),
                backgroundColor: 'rgba(255, 128, 66, 0.8)',
                borderColor: 'rgba(255, 128, 66, 0.3)',
                hoverBackgroundColor: 'rgba(255, 128, 66, 1)',
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
plugins: {
  tooltip: {
    enabled: true,
    mode: 'index',
    intersect: false,
  },
  legend: { display: false },
},
          }}
        />
      </ChartSection>

      <ChartSection
        title="📦 Orders Over Time"
        filters={filters}
        setFilters={setFilters}
        dateFilter
      >
        <Line
          data={{
            labels: Object.keys(quantityOverTime),
            datasets: [
              {
                label: 'Orders',
                data: Object.values(quantityOverTime),
                borderColor: 'rgba(255, 99, 132, 0.8)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.4,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
plugins: {
  tooltip: {
    enabled: true,
    mode: 'index',
    intersect: false,
  },
  legend: { display: false },
},
          }}
        />
      </ChartSection>

      <ChartSection
        title="📋 Order Status Distribution"
        filters={filters}
        setFilters={setFilters}
        statusFilter
      >
        <Pie
          data={{
            labels: Object.keys(statusCount),
            datasets: [
              {
                data: Object.values(statusCount),
                backgroundColor: ['rgba(132, 94, 194, 0.8)', 'rgba(255, 199, 95, 0.8)', 'rgba(255, 111, 145, 0.8)'],
              hoverBackgroundColor: ['rgba(132, 94, 194, 1)', 'rgba(255, 199, 95, 1)', 'rgba(255, 111, 145, 1)'],
                borderColor: '#111827',
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
          }}
        />
      </ChartSection>

      <ChartSection
        title="📦 Revenue by Packaging Type"
        filters={filters}
        setFilters={setFilters}
      >
        <Bar
          data={{
            labels: Object.keys(revenueByPackaging),
            datasets: [
              {
                label: 'Revenue',
                data: Object.values(revenueByPackaging),
                backgroundColor: 'rgba(255, 187, 40, 0.8)',
                borderColor: 'rgba(255, 187, 40, 0.3)',
                hoverBackgroundColor: 'rgba(255, 187, 40, 1)',
                borderRadius: 5,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
plugins: {
  tooltip: {
    enabled: true,
    mode: 'index',
    intersect: false,
  },
  legend: { display: false },
},
          }}
        />
      </ChartSection>

      <ChartSection title="⏰ Order Frequency Heatmap">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-6 gap-2 text-sm font-semibold text-center text-white mb-2">
              {['0–3', '4–7', '8–11', '12–15', '16–19', '20–23'].map((h, i) => (
                <div key={i} className="bg-gray-700 py-1 rounded">{h}</div>
              ))}
            </div>

            {Object.keys(weekdayHourGrid).map((day, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-6 gap-2 items-center mb-2">
                {['0-3', '4-7', '8-11', '12-15', '16-19', '20-23'].map((hour, colIdx) => {
                  const value = weekdayHourGrid[day]?.[hour] || 0;
                  return (
                    <div
                      key={colIdx}
                      className="text-center py-2 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${Math.min(0.15 + value * 0.1, 1)})`,
                        color: value > 5 ? 'white' : '#d1d5db',
                      }}
                    >
                      {value}
                    </div>
                  );
                })}
                <div className="text-sm ml-2 w-20 text-right text-gray-300 font-medium">{day}</div>
              </div>
            ))}
          </div>
        </div>
      </ChartSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <ChartSection title="📈 7-Day Moving Avg: Orders Over Time">
    <Line
      data={sevenDayMovingAvgData}
      options={{
        responsive: true,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          },
          legend: { display: false },
        },
      }}
    />
  </ChartSection>

  <ChartSection title="📊 Top 5 Products by Revenue">
    <Bar
      data={{
        labels: Object.entries(revenueByProduct)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k]) => k),
        datasets: [
          {
            label: 'Revenue',
            data: Object.entries(revenueByProduct)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([, v]) => v),
            backgroundColor: '#34D399',
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          },
          legend: { display: false },
        },
      }}
    />
  </ChartSection>
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ChartSection title="🔁 Repeat Product Orders">
      <Bar
        data={{
          labels: repeatLabels,
          datasets: [
            {
              label: 'Total Orders',
              data: repeatData,
              backgroundColor: '#6EE7B7',
              borderRadius: 4,
            },
          ],
        }}
        options={{
          responsive: true,
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            tooltip: { enabled: true, mode: 'index', intersect: false },
            legend: { display: false },
          },
        }}
      />
    </ChartSection>

    <ChartSection title="📆 Month-on-Month Growth">
      <Line
        data={{
          labels: months,
          datasets: [
            {
              label: 'Orders',
              data: monthlyData,
              borderColor: '#60A5FA',
              backgroundColor: 'rgba(96, 165, 250, 0.2)',
              fill: true,
              tension: 0.3,
            },
          ],
        }}
        options={{
          responsive: true,
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            tooltip: { enabled: true, mode: 'index', intersect: false },
            legend: { display: false },
          },
        }}
      />
    </ChartSection>

      <ChartSection title="🧾 All Orders (Filterable & Exportable)">
        <div className="mb-4 flex gap-2 flex-wrap">
          <select
            className="bg-gray-800 text-white rounded px-3 py-1"
            onChange={(e) => setFilters((prev) => ({ ...prev, productId: e.target.value }))}
          >
            <option value="">Filter: Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="bg-gray-800 text-white rounded px-3 py-1"
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Filter: Status</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>

          <button
            onClick={() => {
              const csv = [
                ['Date', 'Product', 'Quantity', 'Packaging', 'Price', 'Status'],
                ...orders.map((o) => [
                  new Date(o.created_at).toLocaleDateString(),
                  o.product_id?.name,
                  o.quantity,
                  o.packaging,
                  o.price,
                  o.status,
                ]),
              ]
                .map((r) => r.join(','))
                .join('');

              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'orders_export.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 px-4 py-1 rounded text-white text-sm shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 border border-indigo-700 hover:border-indigo-600 animate-pulse-slow"
          >
            ⬇️ Export CSV
          </button>
        </div>

        <div className="overflow-auto rounded border border-indigo-500/30 max-h-[400px] backdrop-blur-sm bg-gray-900/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <table className="min-w-full text-sm text-left text-white">
            <thead className="bg-gradient-to-r from-gray-800/90 to-indigo-900/90 text-xs uppercase text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Packaging</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o) => (filters.productId ? o.product_id?.id === filters.productId : true))
                .filter((o) => (filters.status ? o.status === filters.status : true))
                .map((o, i) => (
                  <tr key={i} className="border-t border-gray-700/50 hover:bg-indigo-900/20 transition-colors duration-150">
                    <td className="px-4 py-2">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{o.product_id?.name}</td>
                    <td className="px-4 py-2">{o.quantity}</td>
                    <td className="px-4 py-2">{o.packaging}</td>
                    <td className="px-4 py-2">${o.price}</td>
                    <td className="px-4 py-2">{o.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ChartSection>


    </div>
    </div>
  );
};


export default DisAnalytics;



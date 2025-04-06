// Full Warehouse Analytics Page with Enhanced UI and KPIs
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabaseClient';
import {
  Line,
  Bar,
  Pie,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const WarehouseAnalytics = () => {
  const [warehouseData, setWarehouseData] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [outgoingOrders, setOutgoingOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [distributorStats, setDistributorStats] = useState([]);
  const [filters, setFilters] = useState({ productId: '', category: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;
      if (!session) return;

      const userId = session.user.id;
      const { data: warehouseManager } = await supabase
        .from('warehouse_managers')
        .select('*')
        .eq('manager_id', userId)
        .single();

      const warehouseId = warehouseManager?.warehouse_id;
      if (!warehouseId) return;

      const { data: inventoryData } = await supabase
        .from('warehouse_inventory')
        .select('*, product_id(id, name, category)')
        .eq('warehouse_id', warehouseId);

      const { data: productList } = await supabase
        .from('products')
        .select('id, name, category');

      const { data: incoming } = await supabase
        .from('orders')
        .select('*, product_id(id, name), distributor_id')
        .eq('status', 'Accepted');

      const { data: outgoing } = await supabase
        .from('war_orders')
        .select('*, product_id(id, name)')
        .eq('warehouse_id', warehouseId);

      const { data: distributors } = await supabase
        .from('profiles')
        .select('id, company_name');

      const distributorMap = {};
      (incoming || []).forEach((order) => {
        const name = distributors.find((d) => d.id === order.distributor_id)?.company_name || 'Unknown';
        distributorMap[name] = distributorMap[name] || { totalValue: 0, totalOrders: 0 };
        distributorMap[name].totalValue += order.price || 0;
        distributorMap[name].totalOrders += 1;
      });

      setWarehouseData(inventoryData || []);
      setProducts(productList || []);
      setIncomingOrders(incoming || []);
      setOutgoingOrders(outgoing || []);
      setDistributorStats(distributorMap);
    };

    fetchData();

    const sub = supabase
      .channel('warehouse-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_inventory' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'war_orders' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const aggregate = useMemo(() => {
    const productStock = {}, categoryCount = {}, stockTrend = {}, reorderMap = {},
      inventoryValue = {}, thresholdMap = {}, incomingMap = {}, outgoingMap = {},
      dailyInbound = {}, dailyOutbound = {};
    let totalValue = 0;

    warehouseData.forEach((entry) => {
      if (!entry.product_id) return;

      const name = entry.product_id?.name || 'Unknown';
      const cat = entry.product_id?.category || 'Uncategorized';
      const qty = entry.quantity || 0;
      const val = entry.total_price ?? (entry.base_price || 0) * qty;
      const threshold = entry.threshold_units || 30;
      const createdMonth = entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 7) : 'unknown';

      if (filters.productId && filters.productId !== entry.product_id?.id) return;
      if (filters.category && filters.category !== cat) return;

      productStock[name] = (productStock[name] || 0) + qty;
      inventoryValue[name] = (inventoryValue[name] || 0) + val;
      categoryCount[cat] = (categoryCount[cat] || 0) + qty;
      stockTrend[createdMonth] = (stockTrend[createdMonth] || 0) + qty;
      thresholdMap[name] = threshold;
      if (qty < threshold) reorderMap[name] = (reorderMap[name] || 0) + 1;
      totalValue += val;
    });

    incomingOrders.forEach((o) => {
      const name = o.product_id?.name || 'Unknown';
      const qty = o.quantity || 0;
      const date = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : 'unknown';
      incomingMap[name] = (incomingMap[name] || 0) + qty;
      dailyInbound[date] = (dailyInbound[date] || 0) + qty;
    });

    outgoingOrders.forEach((o) => {
      const name = o.product_id?.name || 'Unknown';
      const qty = o.quantity || 0;
      const date = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : 'unknown';
      outgoingMap[name] = (outgoingMap[name] || 0) + qty;
      dailyOutbound[date] = (dailyOutbound[date] || 0) + qty;
    });

    const mostStocked = Object.entries(productStock).sort((a, b) => b[1] - a[1])[0]?.[0];
    const leastStocked = Object.entries(productStock).sort((a, b) => a[1] - b[1])[0]?.[0];
    const avgValue = Object.values(inventoryValue).length ? totalValue / Object.values(inventoryValue).length : 0;

    return {
      productStock,
      categoryCount,
      stockTrend,
      reorderMap,
      inventoryValue,
      thresholdMap,
      incomingMap,
      outgoingMap,
      dailyInbound,
      dailyOutbound,
      mostStocked,
      leastStocked,
      avgValue,
      categoryMap: categoryCount
    };
  }, [warehouseData, incomingOrders, outgoingOrders, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090d1f] via-[#0e112a] to-[#0d1021] text-white px-8 py-12">
      <h1 className="text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse mb-12">
        🚀 Warehouse Analytics
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 justify-evenly mb-16">
        {[
          { title: 'Product with highest inevntory value', value: Object.entries(aggregate.inventoryValue).sort((a, b) => b[1] - a[1])[0]?.[0] },
          { title: 'Total Categories', value: Object.keys(aggregate.categoryCount).length, color: 'from-green-400 to-emerald-500' },
          { title: 'Total Inventory Value', value: `$${Object.values(aggregate.inventoryValue).reduce((a,b)=>a+b,0).toFixed(2)}`, color: 'from-yellow-400 to-yellow-500' },
          { title: 'Avg Product Value', value: `$${aggregate.avgValue.toFixed(2)}`, color: 'from-purple-400 to-indigo-500' },
          { title: 'Total Incoming', value: Object.values(aggregate.incomingMap).reduce((a,b)=>a+b,0), color: 'from-pink-400 to-rose-500' },
          { title: 'Total Outgoing', value: Object.values(aggregate.outgoingMap).reduce((a,b)=>a+b,0), color: 'from-red-400 to-red-600' },
          
          { title: 'Most Stocked Product', value: aggregate.mostStocked, color: 'from-sky-400 to-blue-600' },
          { title: 'Least Stocked Product', value: aggregate.leastStocked, color: 'from-orange-400 to-amber-500' },
          
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${kpi.color} text-white p-5 rounded-2xl text-center shadow-xl hover:shadow-cyan-500/50 hover:scale-105 transition duration-300 backdrop-blur-xl ring-1 ring-cyan-400/20`}
          >
            <div className="text-sm font-semibold opacity-90 mb-1 uppercase tracking-wide">{kpi.title}</div>
            <div className="text-2xl font-bold tracking-tight text-white drop-shadow-md">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 justify-center mb-10">
        <select
          onChange={(e) => setFilters((f) => ({ ...f, productId: e.target.value }))}
          className="bg-[#1e2235] text-white px-4 py-2 rounded shadow shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <option value="">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          className="bg-[#1e2235] text-white px-4 py-2 rounded shadow shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All Categories</option>
          {[...new Set(products.map(p => p.category))].map((c, i) => (
            <option key={i}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* All your existing cards from earlier go here: */}
        {/* You can copy in the full set from canvas if needed, or let me know and I’ll paste them all in again here. */}
  
        {/* Example KPI cards */}
        {/* <Card><CardHeader><CardTitle>💵 Avg Inventory Value</CardTitle></CardHeader>
        <CardContent><p className="text-xl font-bold">${aggregate.avgValue.toFixed(2)}</p></CardContent></Card> */}
          
        

        <Card>
  <CardHeader><CardTitle>🧠 Average Product Quantity per Category</CardTitle></CardHeader>
  <CardContent>
    {aggregate.categoryMap && products.length > 0 ? (
      <Bar
        data={{
          labels: Object.keys(aggregate.categoryMap),
          datasets: [
            {
              label: 'Average Quantity',
              data: Object.keys(aggregate.categoryMap).map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return count > 0 ? aggregate.categoryMap[cat] / count : 0;
              }),
              backgroundColor: '#facc15',
            },
          ],
        }}
      />
    ) : <p>No data available.</p>}
  </CardContent>
</Card>

<Card>
  <CardHeader><CardTitle>📊 Combined Inventory Overview</CardTitle></CardHeader>
  <CardContent>
    {Object.keys(aggregate.productStock || {}).length > 0 || Object.keys(aggregate.reorderMap || {}).length > 0 ? (
      <Pie
        data={{
          labels: ['Stocked Products', 'Reordered Products'],
          datasets: [
            {
              data: [
                Object.keys(aggregate.productStock).length,
                Object.keys(aggregate.reorderMap).length,
              ],
              backgroundColor: ['#60a5fa', '#f87171'],
            },
          ],
        }}
      />
    ) : <p>No data available.</p>}
  </CardContent>
</Card>

{/* <Card>
  <CardHeader><CardTitle>📦 High Stock vs Low Stock Products</CardTitle></CardHeader>
  <CardContent>
    {Object.values(aggregate.productStock || {}).length > 0 ? (
      <Bar
        data={{
          labels: ['High Stock', 'Low Stock'],
          datasets: [
            {
              label: 'Count',
              data: [
                Object.values(aggregate.productStock).filter((q) => q >= 50).length,
                Object.values(aggregate.productStock).filter((q) => q < 50).length,
              ],
              backgroundColor: ['#10b981', '#ef4444'],
            },
          ],
        }}
      />
    ) : <p>No data available.</p>}
  </CardContent>
</Card> */}

{/* <Card>
  <CardHeader><CardTitle>🧾 Product with Highest Inventory Value</CardTitle></CardHeader>
  <CardContent>
    <p className="text-xl font-bold">
      {Object.entries(aggregate.inventoryValue || {}).length > 0
        ? 
        : 'N/A'}
    </p>
  </CardContent>
</Card> */}
<Card>
  <CardHeader><CardTitle>📦 Product Stock Levels</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(aggregate.productStock),
        datasets: [
          {
            label: 'Quantity',
            data: Object.values(aggregate.productStock),
            backgroundColor: '#3b82f6',
          },
        ],
      }}
    />
  </CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>💰 Inventory Value by Product</CardTitle></CardHeader>
  <CardContent>
    <Pie
      data={{
        labels: Object.keys(aggregate.inventoryValue),
        datasets: [
          {
            data: Object.values(aggregate.inventoryValue),
            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
          },
        ],
      }}
    />
  </CardContent>
</Card>
{/* <Card>
  <CardHeader><CardTitle>🔁 Reorder Frequency</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(aggregate.reorderMap),
        datasets: [
          {
            label: 'Reorders',
            data: Object.values(aggregate.reorderMap),
            backgroundColor: '#ef4444',
          },
        ],
      }}
    />
  </CardContent>
</Card> */}
<Card>
  <CardHeader><CardTitle>📥 Incoming Orders</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(aggregate.incomingMap),
        datasets: [
          {
            label: 'Received Quantity',
            data: Object.values(aggregate.incomingMap),
            backgroundColor: '#34d399',
          },
        ],
      }}
    />
  </CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>📤 Outgoing Orders</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(aggregate.outgoingMap),
        datasets: [
          {
            label: 'Dispatched Quantity',
            data: Object.values(aggregate.outgoingMap),
            backgroundColor: '#8b5cf6',
          },
        ],
      }}
    />
  </CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>🏢 Top Distributors (Value)</CardTitle></CardHeader>
  <CardContent>
    <Pie
      data={{
        labels: Object.keys(distributorStats),
        datasets: [
          {
            data: Object.values(distributorStats).map(d => d.totalValue),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
          },
        ],
      }}
    />
  </CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>📦 Distributor Volume</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(distributorStats),
        datasets: [
          {
            label: 'Orders',
            data: Object.values(distributorStats).map(d => d.totalOrders),
            backgroundColor: '#fbbf24',
          },
        ],
      }}
    />
  </CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>📉 Stock Threshold Monitor</CardTitle></CardHeader>
  <CardContent>
    <Bar
      data={{
        labels: Object.keys(aggregate.thresholdMap),
        datasets: [
          {
            label: 'Threshold',
            data: Object.values(aggregate.thresholdMap),
            backgroundColor: '#f59e0b',
          },
        ],
      }}
    />
  </CardContent>
</Card>
{/* <Card>
  <CardHeader><CardTitle>📈 Inventory Trend</CardTitle></CardHeader>
  <CardContent>
    <Line
      data={{
        labels: Object.keys(aggregate.stockTrend),
        datasets: [
          {
            label: 'Inventory Level',
            data: Object.values(aggregate.stockTrend),
            borderColor: '#6366f1',
            fill: true,
          },
        ],
      }}
    />
  </CardContent>
</Card> */}
<Card>
  <CardHeader><CardTitle>🔁 Inbound vs Outbound</CardTitle></CardHeader>
  <CardContent>
    <Line
      data={{
        labels: Object.keys({
          ...aggregate.dailyInbound,
          ...aggregate.dailyOutbound,
        }),
        datasets: [
          {
            label: 'Inbound',
            data: Object.keys({
              ...aggregate.dailyInbound,
              ...aggregate.dailyOutbound,
            }).map(date => aggregate.dailyInbound[date] || 0),
            borderColor: '#10b981',
            fill: false,
          },
          {
            label: 'Outbound',
            data: Object.keys({
              ...aggregate.dailyInbound,
              ...aggregate.dailyOutbound,
            }).map(date => aggregate.dailyOutbound[date] || 0),
            borderColor: '#ef4444',
            fill: false,
          },
        ],
      }}
    />
  </CardContent>
</Card>

  
        {/* Your dynamic chart cards were inserted here based on aggregate data */}
        {/* You’ve got: Stock levels, Inventory value, Category breakdown, Reorder freq, Incoming/Outgoing, Distributors, Thresholds, Trends, etc. */}
      </div>
    </div>
  );
} 
 export default WarehouseAnalytics;     
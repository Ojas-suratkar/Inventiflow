import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { currency, number } from "@/lib/format";

const PALETTE = ["#2556eb", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee", "#fb923c"];

export default function Analytics() {
  const { profile, loading } = useProfile("Distributor");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("orders")
      .select("id, quantity, price, status, created_at, products(name, category)")
      .eq("distributor_id", profile.id)
      .then(({ data }) => setOrders(data || []));
  }, [profile]);

  const byMonth = useMemo(() => {
    const buckets = {};
    orders.forEach((o) => {
      const key = new Date(o.created_at).toLocaleDateString("en-US", { month: "short" });
      buckets[key] = buckets[key] || { month: key, spend: 0, orders: 0 };
      buckets[key].spend += Number(o.price || 0);
      buckets[key].orders += 1;
    });
    return Object.values(buckets);
  }, [orders]);

  const byProduct = useMemo(() => {
    const buckets = {};
    orders.forEach((o) => {
      const key = o.products?.name || "Unknown";
      buckets[key] = (buckets[key] || 0) + Number(o.quantity || 0);
    });
    return Object.entries(buckets).map(([name, units]) => ({ name, units })).sort((a, b) => b.units - a.units);
  }, [orders]);

  const byStatus = useMemo(() => {
    const buckets = {};
    orders.forEach((o) => {
      buckets[o.status] = (buckets[o.status] || 0) + 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [orders]);

  if (loading) return null;

  const spend = orders.reduce((sum, o) => sum + Number(o.price || 0), 0);
  const units = orders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const average = orders.length ? spend / orders.length : 0;

  return (
    <AppShell role="Distributor" profile={profile} title="Analytics" description="How your ordering has run over the last quarter">
      <StatRow className="xl:grid-cols-3">
        <Stat label="Total spend" value={currency(spend)} sub={`${number(orders.length)} orders`} icon={<TrendingUp className="h-4 w-4" />} tone="brand" />
        <Stat label="Units ordered" value={number(units)} sub="Every product combined" icon={<BarChart3 className="h-4 w-4" />} />
        <Stat label="Average order" value={currency(average)} sub="Value per order" />
      </StatRow>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Spend by month" description="Order value, grouped by the month it was placed" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#f1f1f4" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="spend" stroke="#2556eb" strokeWidth={2.5} dot={{ r: 3, fill: "#2556eb" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Units by product" description="What you order most" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProduct} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#f1f1f4" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a" }} interval={0} angle={-12} textAnchor="end" height={54} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <Tooltip formatter={(v) => number(v) + " units"} contentStyle={tooltipStyle} />
                <Bar dataKey="units" radius={[6, 6, 0, 0]} fill="#2556eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Order status" description="Where your orders ended up" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>
                  {byStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {byStatus.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-[13px] text-zinc-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  {entry.name} · {entry.value}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e4e4e9",
  boxShadow: "0 8px 24px rgba(16,24,40,0.10)",
  fontSize: 13,
};

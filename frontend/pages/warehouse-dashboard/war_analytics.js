import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Boxes, TriangleAlert, DollarSign } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { currency, number } from "@/lib/format";

const tooltipStyle = { borderRadius: 10, border: "1px solid #e4e4e9", boxShadow: "0 8px 24px rgba(16,24,40,0.10)", fontSize: 13 };

export default function WarehouseAnalytics() {
  const { profile, loading } = useProfile("Warehouse Manager");
  const [stock, setStock] = useState([]);
  const [restocks, setRestocks] = useState([]);

  useEffect(() => {
    if (!profile?.warehouse_id) return;
    supabase
      .from("warehouse_inventory")
      .select("quantity, threshold, total_price, products(name)")
      .eq("warehouse_id", profile.warehouse_id)
      .then(({ data }) => setStock(data || []));
    supabase
      .from("war_orders")
      .select("quantity, total_price, created_at, products(name)")
      .eq("warehouse_id", profile.warehouse_id)
      .order("created_at")
      .then(({ data }) => setRestocks(data || []));
  }, [profile]);

  const byProduct = useMemo(
    () =>
      stock
        .map((r) => ({ name: r.products?.name || "—", onHand: Number(r.quantity || 0), threshold: Number(r.threshold || 0) }))
        .sort((a, b) => b.onHand - a.onHand),
    [stock]
  );

  const spendOverTime = useMemo(() => {
    const buckets = {};
    restocks.forEach((r) => {
      const key = new Date(r.created_at).toLocaleDateString("en-US", { month: "short" });
      buckets[key] = (buckets[key] || 0) + Number(r.total_price || 0);
    });
    return Object.entries(buckets).map(([month, spend]) => ({ month, spend }));
  }, [restocks]);

  if (loading) return null;

  const value = stock.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
  const low = stock.filter((r) => Number(r.quantity) < Number(r.threshold));
  const restockSpend = restocks.reduce((sum, r) => sum + Number(r.total_price || 0), 0);

  return (
    <AppShell role="Warehouse Manager" profile={profile} title="Analytics" description="Stock levels and what restocking has cost">
      <StatRow className="xl:grid-cols-3">
        <Stat label="Stock value" value={currency(value)} sub={`${number(stock.length)} product lines`} icon={<DollarSign className="h-4 w-4" />} tone="brand" />
        <Stat label="Lines below threshold" value={number(low.length)} sub={low.map((l) => l.products?.name).slice(0, 2).join(", ") || "None"} icon={<TriangleAlert className="h-4 w-4" />} tone={low.length ? "warn" : "good"} />
        <Stat label="Restock spend" value={currency(restockSpend)} sub={`${number(restocks.length)} requests`} icon={<Boxes className="h-4 w-4" />} />
      </StatRow>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader title="On hand against threshold" description="Anything under its threshold needs a restock" />
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProduct} margin={{ top: 6, right: 10, bottom: 10, left: -12 }}>
                <CartesianGrid stroke="#f1f1f4" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a" }} interval={0} angle={-14} textAnchor="end" height={64} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <Tooltip formatter={(v, key) => [number(v) + " units", key === "onHand" ? "On hand" : "Threshold"]} contentStyle={tooltipStyle} />
                <Bar dataKey="onHand" radius={[6, 6, 0, 0]} fill="#2556eb" />
                <Bar dataKey="threshold" radius={[6, 6, 0, 0]} fill="#e4e4e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Restock spend by month" description="What this site has committed to production" />
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendOverTime} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2556eb" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#2556eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f1f4" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="spend" stroke="#2556eb" strokeWidth={2.5} fill="url(#spendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

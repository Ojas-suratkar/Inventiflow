import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, TriangleAlert, Inbox, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, number } from "@/lib/format";

export default function WarehouseDashboard() {
  const { profile, loading } = useProfile("Warehouse Manager");
  const [stock, setStock] = useState([]);
  const [incoming, setIncoming] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile?.warehouse_id) return;

    const load = async () => {
      const { data: rows } = await supabase
        .from("warehouse_inventory")
        .select("id, quantity, threshold, price, total_price, products(name, category), packaging(type)")
        .eq("warehouse_id", profile.warehouse_id);

      const { data: distributors } = await supabase
        .from("profiles")
        .select("id")
        .eq("warehouse_id", profile.warehouse_id);

      const ids = (distributors || []).map((d) => d.id);
      let pending = 0;
      if (ids.length) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("distributor_id", ids)
          .eq("status", "Pending");
        pending = count || 0;
      }

      setStock(rows || []);
      setIncoming(pending);
      setBusy(false);
    };

    load();
  }, [profile]);

  if (loading) return null;

  const value = stock.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
  const units = stock.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const low = stock.filter((r) => Number(r.quantity) < Number(r.threshold));

  return (
    <AppShell
      role="Warehouse Manager"
      profile={profile}
      title="Warehouse overview"
      description={`${profile?.company_name} · site #${profile?.warehouse_id}`}
      actions={
        <Link href="/warehouse-dashboard/war_rec_orders">
          <Button size="sm"><Inbox className="h-4 w-4" /> Review orders</Button>
        </Link>
      }
    >
      <StatRow>
        <Stat label="Stock on hand" value={number(units)} sub={`${number(stock.length)} product lines`} icon={<Boxes className="h-4 w-4" />} tone="brand" />
        <Stat label="Stock value" value={currency(value)} sub="At current selling price" icon={<DollarSign className="h-4 w-4" />} />
        <Stat label="Below threshold" value={number(low.length)} sub={low.length ? "Restock these lines" : "Every line is healthy"} icon={<TriangleAlert className="h-4 w-4" />} tone={low.length ? "warn" : "good"} />
        <Stat label="Orders waiting" value={number(incoming)} sub="From your distributors" icon={<Inbox className="h-4 w-4" />} tone={incoming ? "warn" : "neutral"} />
      </StatRow>

      <Card className="mt-6">
        <CardHeader
          title="Inventory"
          description="Live quantities for this site"
          action={
            <Link href="/warehouse-dashboard/war_order_placement">
              <Button variant="secondary" size="sm">Restock <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          }
        />
        <Table
          loading={busy}
          empty="No stock recorded for this warehouse yet."
          rows={stock}
          rowKey={(r) => r.id}
          columns={[
            { key: "product", header: "Product", strong: true, render: (r) => r.products?.name || "—" },
            { key: "category", header: "Category", render: (r) => r.products?.category || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "On hand", align: "right", render: (r) => number(r.quantity) },
            { key: "threshold", header: "Threshold", align: "right", render: (r) => number(r.threshold) },
            { key: "value", header: "Value", align: "right", render: (r) => currency(r.total_price) },
            {
              key: "state",
              header: "State",
              render: (r) =>
                Number(r.quantity) < Number(r.threshold) ? <Badge tone="low">Low stock</Badge> : <Badge tone="ok">Healthy</Badge>,
            },
          ]}
        />
      </Card>
    </AppShell>
  );
}

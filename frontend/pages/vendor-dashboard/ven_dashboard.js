import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Clock, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, number, shortDate } from "@/lib/format";

export default function VendorDashboard() {
  const { profile, loading } = useProfile("Vendor");
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("raw_orders")
      .select("id, quantity, base_price, total_price, status_updated, deadline, created_at, raw_materials(name, unit), factories(name, location)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setBusy(false);
      });
  }, [profile]);

  if (loading) return null;

  const open = orders.filter((o) => o.status_updated === "Pending");
  const revenue = orders.filter((o) => o.status_updated !== "Rejected").reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return (
    <AppShell
      role="Vendor"
      profile={profile}
      title={`${profile?.company_name || "Vendor"}`}
      description="Raw material requests from the factories you supply"
      actions={
        <Link href="/vendor-dashboard/ven_orders">
          <Button size="sm"><Truck className="h-4 w-4" /> Supply requests</Button>
        </Link>
      }
    >
      <StatRow className="xl:grid-cols-3">
        <Stat label="Open requests" value={number(open.length)} sub="Waiting on you" icon={<Clock className="h-4 w-4" />} tone={open.length ? "warn" : "good"} />
        <Stat label="Requests in total" value={number(orders.length)} sub="Across every factory" icon={<Truck className="h-4 w-4" />} tone="brand" />
        <Stat label="Order value" value={currency(revenue)} sub="Rejected requests excluded" icon={<DollarSign className="h-4 w-4" />} />
      </StatRow>

      <Card className="mt-6">
        <CardHeader
          title="Latest requests"
          action={
            <Link href="/vendor-dashboard/ven_orders">
              <Button variant="secondary" size="sm">All requests <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          }
        />
        <Table
          loading={busy}
          empty="No factory has requested materials yet."
          rows={orders.slice(0, 6)}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            { key: "material", header: "Material", strong: true, render: (r) => r.raw_materials?.name || "—" },
            { key: "factory", header: "Factory", render: (r) => r.factories?.name || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => `${number(r.quantity)} ${r.raw_materials?.unit || ""}` },
            { key: "value", header: "Value", align: "right", render: (r) => currency(r.total_price) },
            { key: "deadline", header: "Needed by", render: (r) => shortDate(r.deadline) },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status_updated}</Badge> },
          ]}
        />
      </Card>
    </AppShell>
  );
}

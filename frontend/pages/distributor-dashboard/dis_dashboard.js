import { useEffect, useState } from "react";
import Link from "next/link";
import { PackagePlus, Clock, CheckCircle2, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, number, shortDate } from "@/lib/format";

export default function DistributorDashboard() {
  const { profile, loading } = useProfile("Distributor");
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("orders")
      .select("id, quantity, price, status, deadline, created_at, products(name), packaging(type)")
      .eq("distributor_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setBusy(false);
      });
  }, [profile]);

  if (loading) return null;

  const spend = orders.filter((o) => o.status !== "Rejected").reduce((sum, o) => sum + Number(o.price || 0), 0);
  const open = orders.filter((o) => o.status === "Pending" || o.status === "Accepted");
  const delivered = orders.filter((o) => o.status === "Delivered");
  const units = orders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);

  return (
    <AppShell
      role="Distributor"
      profile={profile}
      title={`Good to see you, ${(profile?.name || "").split(" ")[0]}`}
      description={`${profile?.company_name} · served by warehouse #${profile?.warehouse_id}`}
      actions={
        <Link href="/distributor-dashboard/dis_order_placement">
          <Button size="sm"><PackagePlus className="h-4 w-4" /> Place order</Button>
        </Link>
      }
    >
      <StatRow>
        <Stat label="Open orders" value={number(open.length)} sub={`${number(orders.length)} placed in total`} icon={<Clock className="h-4 w-4" />} tone="warn" />
        <Stat label="Delivered" value={number(delivered.length)} sub="Completed without issue" icon={<CheckCircle2 className="h-4 w-4" />} tone="good" />
        <Stat label="Units ordered" value={number(units)} sub="Across every order" icon={<PackagePlus className="h-4 w-4" />} tone="brand" />
        <Stat label="Spend" value={currency(spend)} sub="Rejected orders excluded" icon={<DollarSign className="h-4 w-4" />} />
      </StatRow>

      <Card className="mt-6">
        <CardHeader
          title="Recent orders"
          description="The five most recent orders you placed"
          action={
            <Link href="/distributor-dashboard/dis_order_history">
              <Button variant="secondary" size="sm">All orders <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          }
        />
        <Table
          loading={busy}
          empty="No orders yet. Place your first one to see it here."
          rows={orders.slice(0, 5)}
          rowKey={(r) => r.id}
          columns={[
            { key: "product", header: "Product", strong: true, render: (r) => r.products?.name || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
            { key: "price", header: "Value", align: "right", render: (r) => currency(r.price) },
            { key: "deadline", header: "Deadline", render: (r) => shortDate(r.deadline) },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          ]}
        />
      </Card>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import Link from "next/link";
import { Factory, Boxes, TriangleAlert, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, number, shortDate } from "@/lib/format";

export default function ProductionDashboard() {
  const { profile, loading } = useProfile("Production Manager");
  const [factory, setFactory] = useState(null);
  const [queue, setQueue] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      const { data: link } = await supabase
        .from("production_manager_factory")
        .select("factory_id, factories(id, name, location, product_id)")
        .eq("prod_manager_id", profile.id)
        .maybeSingle();

      const site = link?.factories || null;
      setFactory(site);

      const { data: orders } = await supabase
        .from("war_orders")
        .select("id, quantity, total_price, status, deadline, created_at, products(name), packaging(type)")
        .order("created_at", { ascending: false });

      if (site?.id) {
        const { data: stock } = await supabase
          .from("factory_inventory")
          .select("id, quantity, threshold_units, raw_materials(name, unit)")
          .eq("factory_id", site.id);
        setMaterials(stock || []);
      }

      setQueue(orders || []);
      setBusy(false);
    };

    load();
  }, [profile]);

  if (loading) return null;

  const waiting = queue.filter((o) => o.status === "Pending");
  const lowMaterials = materials.filter((m) => Number(m.quantity) < Number(m.threshold_units));
  const committed = queue.filter((o) => o.status !== "Rejected").reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return (
    <AppShell
      role="Production Manager"
      profile={profile}
      title={factory?.name || "Production"}
      description={factory ? `${factory.location} · run requests from the warehouses` : "No factory linked to this account yet"}
      actions={
        <Link href="/production-dashboard/pro_rec_orders">
          <Button size="sm"><Factory className="h-4 w-4" /> Production queue</Button>
        </Link>
      }
    >
      <StatRow>
        <Stat label="Runs waiting" value={number(waiting.length)} sub="Requests still to start" icon={<Factory className="h-4 w-4" />} tone={waiting.length ? "warn" : "good"} />
        <Stat label="Requests in total" value={number(queue.length)} sub="Across every warehouse" icon={<Boxes className="h-4 w-4" />} tone="brand" />
        <Stat label="Materials below threshold" value={number(lowMaterials.length)} sub={lowMaterials.map((m) => m.raw_materials?.name).slice(0, 2).join(", ") || "All healthy"} icon={<TriangleAlert className="h-4 w-4" />} tone={lowMaterials.length ? "warn" : "good"} />
        <Stat label="Committed value" value={currency(committed)} sub="Requests not rejected" />
      </StatRow>

      <Card className="mt-6">
        <CardHeader
          title="Latest requests"
          description="What the warehouses have asked for"
          action={
            <Link href="/production-dashboard/pro_rec_orders">
              <Button variant="secondary" size="sm">Open queue <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          }
        />
        <Table
          loading={busy}
          empty="No restock requests have come in yet."
          rows={queue.slice(0, 6)}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            { key: "product", header: "Product", strong: true, render: (r) => r.products?.name || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
            { key: "deadline", header: "Needed by", render: (r) => shortDate(r.deadline) },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          ]}
        />
      </Card>
    </AppShell>
  );
}

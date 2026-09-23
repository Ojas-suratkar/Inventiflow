import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency, number, shortDate, relativeDays } from "@/lib/format";

const STATUSES = [
  { value: "All", label: "Every status" },
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "Delivered", label: "Delivered" },
  { value: "Rejected", label: "Rejected" },
];

export default function OrderHistory() {
  const { profile, loading } = useProfile("Distributor");
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("orders")
      .select("id, quantity, price, status, deadline, created_at, products(name, category), packaging(type)")
      .eq("distributor_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setBusy(false);
      });
  }, [profile]);

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        const matchesStatus = status === "All" || o.status === status;
        const text = `${o.products?.name || ""} ${o.packaging?.type || ""}`.toLowerCase();
        return matchesStatus && text.includes(query.toLowerCase());
      }),
    [orders, query, status]
  );

  if (loading) return null;

  return (
    <AppShell role="Distributor" profile={profile} title="Orders" description={`${number(orders.length)} orders placed by ${profile?.company_name}`}>
      <Card>
        <CardHeader
          title="Order history"
          description="Every order, newest first"
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input className="h-9 w-48 pl-8" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select className="w-40" value={status} onChange={setStatus} options={STATUSES} />
            </div>
          }
        />
        <Table
          loading={busy}
          empty="No orders match that filter."
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Order", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            { key: "product", header: "Product", strong: true, render: (r) => r.products?.name || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
            { key: "price", header: "Value", align: "right", render: (r) => currency(r.price) },
            { key: "placed", header: "Placed", render: (r) => shortDate(r.created_at) },
            {
              key: "deadline",
              header: "Deadline",
              render: (r) => (
                <span className="flex flex-col">
                  <span>{shortDate(r.deadline)}</span>
                  <span className="text-xs text-zinc-400">{relativeDays(r.deadline)}</span>
                </span>
              ),
            },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          ]}
        />
      </Card>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { currency, number, shortDate, relativeDays } from "@/lib/format";

const FILTERS = [
  { value: "Pending", label: "Waiting on you" },
  { value: "Accepted", label: "Accepted" },
  { value: "Delivered", label: "Delivered" },
  { value: "All", label: "Everything" },
];

export default function SupplyRequests() {
  const { profile, loading } = useProfile("Vendor");
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState(null);

  const load = async () => {
    setBusy(true);
    let query = supabase
      .from("raw_orders")
      .select("id, quantity, base_price, total_price, status_updated, deadline, created_at, raw_materials(name, unit), factories(name, location)")
      .order("created_at", { ascending: false });
    if (filter !== "All") query = query.eq("status_updated", filter);
    const { data } = await query;
    setOrders(data || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const setStatus = async (order, status) => {
    setWorking(order.id);
    const { error } = await supabase.from("raw_orders").update({ status_updated: status }).eq("id", order.id);
    setWorking(null);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Request #${order.id} ${status.toLowerCase()}.`, status === "Rejected" ? "info" : "success");
    load();
  };

  if (loading) return null;

  return (
    <AppShell
      role="Vendor"
      profile={profile}
      title="Supply requests"
      description="Accept what you can fill, and mark it delivered when it ships"
      actions={<Select className="w-48" value={filter} onChange={setFilter} options={FILTERS} />}
    >
      <Card>
        <CardHeader title="Requests" description={`${number(orders.length)} shown`} />
        <Table
          loading={busy}
          empty="Nothing in this part of the list."
          rows={orders}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            { key: "material", header: "Material", strong: true, render: (r) => r.raw_materials?.name || "—" },
            {
              key: "factory",
              header: "Factory",
              render: (r) => (
                <span className="flex flex-col">
                  <span>{r.factories?.name || "—"}</span>
                  <span className="text-xs text-zinc-400">{r.factories?.location}</span>
                </span>
              ),
            },
            { key: "quantity", header: "Qty", align: "right", render: (r) => `${number(r.quantity)} ${r.raw_materials?.unit || ""}` },
            { key: "value", header: "Value", align: "right", render: (r) => currency(r.total_price) },
            {
              key: "deadline",
              header: "Needed by",
              render: (r) => (
                <span className="flex flex-col">
                  <span>{shortDate(r.deadline)}</span>
                  <span className="text-xs text-zinc-400">{relativeDays(r.deadline)}</span>
                </span>
              ),
            },
            {
              key: "action",
              header: "",
              align: "right",
              render: (r) =>
                r.status_updated === "Pending" ? (
                  <span className="flex justify-end gap-2">
                    <Button size="sm" variant="success" loading={working === r.id} onClick={() => setStatus(r, "Accepted")}>
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setStatus(r, "Rejected")}>
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                  </span>
                ) : r.status_updated === "Accepted" ? (
                  <Button size="sm" variant="secondary" loading={working === r.id} onClick={() => setStatus(r, "Delivered")}>
                    Mark delivered
                  </Button>
                ) : (
                  <Badge>{r.status_updated}</Badge>
                ),
            },
          ]}
        />
      </Card>
    </AppShell>
  );
}

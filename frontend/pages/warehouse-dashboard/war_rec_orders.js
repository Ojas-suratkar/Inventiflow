import { useEffect, useState } from "react";
import { Check, X, Inbox } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { currency, number, shortDate } from "@/lib/format";

const FILTERS = [
  { value: "Pending", label: "Waiting on you" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
  { value: "All", label: "Every order" },
];

export default function IncomingOrders() {
  const { profile, loading } = useProfile("Warehouse Manager");
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [working, setWorking] = useState(null);

  const load = async () => {
    if (!profile?.warehouse_id) return;
    setBusy(true);

    const { data: distributors } = await supabase
      .from("profiles")
      .select("id, name, company_name")
      .eq("warehouse_id", profile.warehouse_id);

    const ids = (distributors || []).map((d) => d.id);
    if (!ids.length) {
      setOrders([]);
      setBusy(false);
      return;
    }

    let query = supabase
      .from("orders")
      .select("id, product_id, packaging, quantity, price, status, deadline, created_at, distributor_id, products(name), packaging(type)")
      .in("distributor_id", ids)
      .order("created_at", { ascending: false });

    if (filter !== "All") query = query.eq("status", filter);

    const { data } = await query;
    const byId = Object.fromEntries((distributors || []).map((d) => [d.id, d]));
    setOrders((data || []).map((o) => ({ ...o, distributor: byId[o.distributor_id] })));
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, [profile, filter]);

  /* Accepting an order takes the stock out of this warehouse. */
  const accept = async (order) => {
    setWorking(order.id);
    const { data: stock } = await supabase
      .from("warehouse_inventory")
      .select("id, quantity, price")
      .eq("warehouse_id", profile.warehouse_id)
      .eq("product_id", order.product_id)
      .maybeSingle();

    if (!stock) {
      toast(`No ${order.products?.name} stocked at this site.`, "error");
      setWorking(null);
      return;
    }
    if (Number(stock.quantity) < Number(order.quantity)) {
      toast(`Only ${number(stock.quantity)} units of ${order.products?.name} on hand, order needs ${number(order.quantity)}.`, "error");
      setWorking(null);
      return;
    }

    const remaining = Number(stock.quantity) - Number(order.quantity);
    await supabase
      .from("warehouse_inventory")
      .update({ quantity: remaining, total_price: Number((remaining * Number(stock.price || 0)).toFixed(2)) })
      .eq("id", stock.id);

    const { error } = await supabase.from("orders").update({ status: "Accepted" }).eq("id", order.id);
    setWorking(null);

    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Order #${order.id} accepted. ${number(order.quantity)} units released.`);
    load();
  };

  const reject = async (order) => {
    setWorking(order.id);
    await supabase.from("orders").update({ status: "Rejected" }).eq("id", order.id);
    setWorking(null);
    toast(`Order #${order.id} rejected.`, "info");
    load();
  };

  if (loading) return null;

  return (
    <AppShell
      role="Warehouse Manager"
      profile={profile}
      title="Incoming orders"
      description="Accepting an order releases stock from this warehouse"
      actions={<Select className="w-44" value={filter} onChange={setFilter} options={FILTERS} />}
    >
      <Card>
        <CardHeader title="Distributor orders" description={`${number(orders.length)} shown`} />
        <Table
          loading={busy}
          empty={filter === "Pending" ? "Nothing waiting. Every order has been handled." : "No orders match that filter."}
          rows={orders}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Order", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            {
              key: "distributor",
              header: "Distributor",
              strong: true,
              render: (r) => (
                <span className="flex flex-col">
                  <span>{r.distributor?.company_name || "—"}</span>
                  <span className="text-xs text-zinc-400">{r.distributor?.name}</span>
                </span>
              ),
            },
            { key: "product", header: "Product", render: (r) => r.products?.name || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
            { key: "price", header: "Value", align: "right", render: (r) => currency(r.price) },
            { key: "deadline", header: "Deadline", render: (r) => shortDate(r.deadline) },
            {
              key: "action",
              header: "",
              align: "right",
              render: (r) =>
                r.status === "Pending" ? (
                  <span className="flex justify-end gap-2">
                    <Button size="sm" variant="success" loading={working === r.id} onClick={() => accept(r)}>
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => reject(r)}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </span>
                ) : (
                  <Badge>{r.status}</Badge>
                ),
            },
          ]}
        />
      </Card>
    </AppShell>
  );
}

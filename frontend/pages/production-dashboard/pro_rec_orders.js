import { useEffect, useState } from "react";
import { Play, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { currency, number, shortDate } from "@/lib/format";

const FILTERS = [
  { value: "Pending", label: "Waiting to start" },
  { value: "Accepted", label: "In production" },
  { value: "Delivered", label: "Delivered" },
  { value: "All", label: "Everything" },
];

export default function ProductionQueue() {
  const { profile, loading } = useProfile("Production Manager");
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [working, setWorking] = useState(null);

  const load = async () => {
    setBusy(true);
    let query = supabase
      .from("war_orders")
      .select("id, product_id, quantity, base_price, total_price, status, deadline, created_at, products(name), packaging(type), warehouse(name)")
      .order("created_at", { ascending: false });
    if (filter !== "All") query = query.eq("status", filter);
    const { data } = await query;
    setOrders(data || []);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  /* What a run consumes: recipe quantity per unit multiplied by the order,
     checked against what the factory has on the shelf. */
  const openRun = async (order) => {
    setOpen(order);
    setRecipe([]);

    const { data: lines } = await supabase
      .from("product_recipes")
      .select("quantity_per_unit, raw_materials(id, name, unit, base_price)")
      .eq("product_id", order.product_id);

    const { data: link } = await supabase
      .from("production_manager_factory")
      .select("factory_id")
      .eq("prod_manager_id", profile.id)
      .maybeSingle();

    const { data: stock } = await supabase
      .from("factory_inventory")
      .select("raw_material_id, quantity")
      .eq("factory_id", link?.factory_id || 0);

    const onHand = Object.fromEntries((stock || []).map((s) => [s.raw_material_id, Number(s.quantity)]));

    setRecipe(
      (lines || []).map((line) => {
        const needed = Number(line.quantity_per_unit) * Number(order.quantity);
        const have = onHand[line.raw_materials?.id] ?? 0;
        return {
          id: line.raw_materials?.id,
          name: line.raw_materials?.name,
          unit: line.raw_materials?.unit,
          perUnit: Number(line.quantity_per_unit),
          needed,
          have,
          short: Math.max(0, needed - have),
          cost: needed * Number(line.raw_materials?.base_price || 0),
        };
      })
    );
  };

  const start = async (order) => {
    setWorking(order.id);
    const { error } = await supabase.from("war_orders").update({ status: "Accepted" }).eq("id", order.id);
    setWorking(null);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Run #${order.id} started for ${number(order.quantity)} units.`);
    setOpen(null);
    load();
  };

  const complete = async (order) => {
    setWorking(order.id);
    const { error } = await supabase.from("war_orders").update({ status: "Delivered" }).eq("id", order.id);
    setWorking(null);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Run #${order.id} marked delivered.`);
    load();
  };

  if (loading) return null;

  return (
    <AppShell
      role="Production Manager"
      profile={profile}
      title="Production queue"
      description="Open a request to see the raw materials the run will consume"
      actions={<Select className="w-48" value={filter} onChange={setFilter} options={FILTERS} />}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader title="Requests" description={`${number(orders.length)} shown`} />
          <Table
            loading={busy}
            empty="Nothing in this part of the queue."
            rows={orders}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "product",
                header: "Run",
                strong: true,
                render: (r) => (
                  <span className="flex flex-col">
                    <span>{r.products?.name || "—"}</span>
                    <span className="text-xs font-normal text-zinc-400">#{r.id} · for {r.warehouse?.name || "—"}</span>
                  </span>
                ),
              },
              { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
              { key: "deadline", header: "Needed by", render: (r) => shortDate(r.deadline) },
              { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                key: "action",
                header: "",
                align: "right",
                render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => openRun(r)}>
                    Materials <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        <Card className="h-fit">
          <CardHeader
            title={open ? `Run #${open.id}` : "Material plan"}
            description={open ? `${number(open.quantity)} × ${open.products?.name}` : "Pick a request to work it out"}
          />
          <CardBody>
            {!open && <p className="py-6 text-center text-[13px] text-zinc-500">Nothing selected yet.</p>}

            {open && (
              <>
                <ul className="space-y-3">
                  {recipe.map((line) => (
                    <li key={line.id} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-zinc-900">{line.name}</span>
                        <span className="text-sm tabular text-zinc-900">
                          {number(Math.round(line.needed))} {line.unit}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <span>{line.perUnit} {line.unit} per unit · {currency(line.cost)}</span>
                        {line.short > 0 ? (
                          <Badge tone="low">short {number(Math.round(line.short))}</Badge>
                        ) : (
                          <Badge tone="ok">in stock</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                  {recipe.length === 0 && <li className="text-[13px] text-zinc-500">No recipe recorded for this product.</li>}
                </ul>

                <div className="mt-5 flex gap-2">
                  {open.status === "Pending" && (
                    <Button className="flex-1" loading={working === open.id} onClick={() => start(open)}>
                      <Play className="h-4 w-4" /> Start run
                    </Button>
                  )}
                  {open.status === "Accepted" && (
                    <Button className="flex-1" variant="success" loading={working === open.id} onClick={() => complete(open)}>
                      <Check className="h-4 w-4" /> Mark delivered
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

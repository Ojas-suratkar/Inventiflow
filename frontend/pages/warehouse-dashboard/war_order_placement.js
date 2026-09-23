import { useEffect, useMemo, useState } from "react";
import { Factory } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency, number, shortDate } from "@/lib/format";

export default function Restock() {
  const { profile, loading } = useProfile("Warehouse Manager");
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ product: "", packaging: "", quantity: "", deadline: "" });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  useEffect(() => {
    supabase.from("products").select("id, name, category, base_price").order("name").then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    if (!form.product) return setPacks([]);
    supabase.from("packaging").select("id, type, price").eq("product_id", form.product).order("price").then(({ data }) => setPacks(data || []));
  }, [form.product]);

  const loadOrders = async () => {
    if (!profile?.warehouse_id) return;
    const { data } = await supabase
      .from("war_orders")
      .select("id, quantity, base_price, total_price, deadline, status, created_at, products(name), packaging(type)")
      .eq("warehouse_id", profile.warehouse_id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setBusy(false);
  };

  useEffect(() => {
    loadOrders();
  }, [profile]);

  const product = products.find((p) => String(p.id) === String(form.product));
  const pack = packs.find((p) => String(p.id) === String(form.packaging));
  const unit = Number(product?.base_price || 0) + Number(pack?.price || 0);
  const total = useMemo(() => unit * Number(form.quantity || 0), [unit, form.quantity]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.packaging || !form.quantity || !form.deadline) {
      toast("Fill in every field before sending the request.", "error");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("war_orders").insert([
      {
        warehouse_id: profile.warehouse_id,
        product_id: Number(form.product),
        packaging_id: Number(form.packaging),
        quantity: Number(form.quantity),
        base_price: Number(product?.base_price || 0),
        total_price: Number(total.toFixed(2)),
        deadline: form.deadline,
        status: "Pending",
      },
    ]);
    setSending(false);

    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Restock requested: ${number(form.quantity)} × ${product?.name}`);
    setForm({ product: "", packaging: "", quantity: "", deadline: "" });
    loadOrders();
  };

  if (loading) return null;

  return (
    <AppShell role="Warehouse Manager" profile={profile} title="Restock" description="Order finished goods from the factories that make them">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="New restock request" />
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <Field label="Product" className="sm:col-span-2">
                <Select
                  value={form.product}
                  onChange={set("product")}
                  placeholder="Choose a product"
                  options={products.map((p) => ({ value: p.id, label: `${p.name} · ${p.category}` }))}
                />
              </Field>
              <Field label="Packaging">
                <Select
                  value={form.packaging}
                  onChange={set("packaging")}
                  placeholder={form.product ? "Choose packaging" : "Pick a product first"}
                  disabled={!form.product}
                  options={packs.map((p) => ({ value: p.id, label: `${p.type} · +${currency(p.price)}` }))}
                />
              </Field>
              <Field label="Quantity">
                <Input type="number" min="1" placeholder="2000" value={form.quantity} onChange={set("quantity")} />
              </Field>
              <Field label="Needed by" className="sm:col-span-2">
                <Input type="date" value={form.deadline} onChange={set("deadline")} />
              </Field>
              <div className="sm:col-span-2 flex items-center justify-between pt-1">
                <span className="text-sm text-zinc-500">
                  Estimated cost <span className="font-medium text-zinc-900 tabular">{currency(total)}</span>
                </span>
                <Button type="submit" loading={sending}>
                  <Factory className="h-4 w-4" /> Send to production
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="How this works" />
          <CardBody className="space-y-3 text-[13px] leading-relaxed text-zinc-600">
            <p>A restock request goes to the factory that makes the product.</p>
            <p>Production works out the raw materials the run needs from the product recipe, and orders anything short from a vendor.</p>
            <p>Once the run is delivered, the stock lands in this warehouse and can be released to distributors.</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Requests you have sent" description={`${number(orders.length)} in total`} />
        <Table
          loading={busy}
          empty="No restock requests yet."
          rows={orders}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Request", render: (r) => <span className="font-mono text-[12.5px] text-zinc-500">#{r.id}</span> },
            { key: "product", header: "Product", strong: true, render: (r) => r.products?.name || "—" },
            { key: "packaging", header: "Packaging", render: (r) => r.packaging?.type || "—" },
            { key: "quantity", header: "Qty", align: "right", render: (r) => number(r.quantity) },
            { key: "total", header: "Cost", align: "right", render: (r) => currency(r.total_price) },
            { key: "deadline", header: "Needed by", render: (r) => shortDate(r.deadline) },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
          ]}
        />
      </Card>
    </AppShell>
  );
}

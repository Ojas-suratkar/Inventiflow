import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { PackagePlus } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { useToast } from "@/components/ui/toast";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency, number } from "@/lib/format";

export default function PlaceOrder() {
  const router = useRouter();
  const toast = useToast();
  const { profile, loading } = useProfile("Distributor");
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [form, setForm] = useState({ product: "", packaging: "", quantity: "", deadline: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("products").select("id, name, category, base_price").order("name").then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    if (!form.product) return setPacks([]);
    supabase
      .from("packaging")
      .select("id, type, price")
      .eq("product_id", form.product)
      .order("price")
      .then(({ data }) => setPacks(data || []));
  }, [form.product]);

  const product = products.find((p) => String(p.id) === String(form.product));
  const pack = packs.find((p) => String(p.id) === String(form.packaging));
  const unit = Number(product?.base_price || 0) + Number(pack?.price || 0);
  const total = useMemo(() => unit * Number(form.quantity || 0), [unit, form.quantity]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value?.target ? value.target.value : value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.packaging || !form.quantity || !form.deadline) {
      toast("Fill in every field before placing the order.", "error");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("orders").insert([
      {
        distributor_id: profile.id,
        product_id: Number(form.product),
        packaging: Number(form.packaging),
        quantity: Number(form.quantity),
        price: Number(total.toFixed(2)),
        deadline: form.deadline,
        status: "Pending",
      },
    ]);
    setBusy(false);

    if (error) {
      toast(error.message, "error");
      return;
    }
    toast(`Order placed: ${number(form.quantity)} × ${product?.name}`);
    router.push("/distributor-dashboard/dis_order_history");
  };

  if (loading) return null;

  return (
    <AppShell role="Distributor" profile={profile} title="Place an order" description="Stock is fulfilled by the warehouse that covers your postcode.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Order details" />
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
                <Input type="number" min="1" placeholder="500" value={form.quantity} onChange={set("quantity")} />
              </Field>
              <Field label="Needed by" className="sm:col-span-2">
                <Input type="date" value={form.deadline} onChange={set("deadline")} />
              </Field>
              <div className="sm:col-span-2 flex justify-end pt-1">
                <Button type="submit" loading={busy}>
                  <PackagePlus className="h-4 w-4" /> Place order
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Summary" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Product" value={product?.name || "—"} />
            <Row label="Packaging" value={pack?.type || "—"} />
            <Row label="Unit price" value={unit ? currency(unit) : "—"} />
            <Row label="Quantity" value={form.quantity ? number(form.quantity) : "—"} />
            <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
              <span className="font-medium text-zinc-900">Total</span>
              <span className="text-lg font-semibold text-zinc-900 tabular">{currency(total)}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900">{value}</span>
    </div>
  );
}

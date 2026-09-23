import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertTriangle, Boxes, CheckCircle2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const ROLES = [
  { value: "Distributor", label: "Distributor" },
  { value: "Warehouse Manager", label: "Warehouse Manager" },
  { value: "Production Manager", label: "Production Manager" },
  { value: "Vendor", label: "Vendor" },
];

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", company_name: "", company_location: "", pincode: "", role: "Distributor",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;

      const userId = data.user?.id;
      if (!userId) throw new Error("Could not create the account. Try a different email.");

      /* A distributor is served by whichever warehouse covers its postcode. */
      let warehouseId = null;
      if (form.role === "Distributor") {
        const { data: warehouses, error: whError } = await supabase.from("warehouse").select("id, name, service_pincodes");
        if (whError) throw whError;

        const match = (warehouses || []).find((w) =>
          Array.isArray(w.service_pincodes) && w.service_pincodes.includes(parseInt(form.pincode, 10))
        );
        if (!match) {
          throw new Error(`No warehouse covers postcode ${form.pincode} yet. Try 90802, 91710 or 94536.`);
        }
        warehouseId = match.id;
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          name: form.name,
          email: form.email,
          company_name: form.company_name,
          company_location: form.company_location,
          role: form.role,
          pincode: form.pincode,
          warehouse_id: warehouseId,
        },
      ]);
      if (profileError) throw profileError;

      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center justify-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">InventiFlow</span>
        </Link>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-7 shadow-card">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Create an account</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Distributors are matched to a warehouse by postcode.</p>

          {done ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[13px] text-emerald-800">Account created. Taking you to sign in.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <Input required placeholder="Dana Ruiz" value={form.name} onChange={set("name")} />
              </Field>
              <Field label="Email">
                <Input type="email" required placeholder="you@company.com" value={form.email} onChange={set("email")} />
              </Field>
              <Field label="Password">
                <Input type="password" required minLength={8} placeholder="8 characters or more" value={form.password} onChange={set("password")} />
              </Field>
              <Field label="Company">
                <Input required placeholder="Harbor Provisions" value={form.company_name} onChange={set("company_name")} />
              </Field>
              <Field label="Location">
                <Input required placeholder="Long Beach, CA" value={form.company_location} onChange={set("company_location")} />
              </Field>
              <Field label="Postcode" hint="90802, 91710 and 94536 are covered.">
                <Input required placeholder="90802" value={form.pincode} onChange={set("pincode")} />
              </Field>
              <Field label="Role">
                <Select value={form.role} onChange={set("role")} options={ROLES} />
              </Field>

              {error && (
                <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-[13px] text-rose-700">{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" loading={busy} className="sm:col-span-2 w-full">
                {busy ? "Creating account" : "Create account"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-[13px] text-zinc-500">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertTriangle, Boxes } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NAV } from "@/lib/nav";

const ROLES = [
  { value: "Distributor", label: "Distributor" },
  { value: "Warehouse Manager", label: "Warehouse Manager" },
  { value: "Production Manager", label: "Production Manager" },
  { value: "Vendor", label: "Vendor" },
];

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", role: "Distributor" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError("That email and password do not match an account.");
      setBusy(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .single();

    if (!profile?.role) {
      setError("This account has no profile yet. Sign up first.");
      setBusy(false);
      return;
    }

    if (profile.role !== form.role) {
      setError(`This account is registered as ${profile.role}. Pick that role to continue.`);
      setBusy(false);
      return;
    }

    router.replace(NAV[profile.role]?.home || "/");
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[52%]">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">InventiFlow</span>
          </Link>

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
          <p className="mt-1.5 text-[14px] text-zinc-500">Pick the role your account was created with.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input type="email" required placeholder="you@company.com" value={form.email} onChange={set("email")} />
            </Field>
            <Field label="Password">
              <Input type="password" required placeholder="••••••••" value={form.password} onChange={set("password")} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={set("role")} options={ROLES} />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[13px] text-rose-700">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" loading={busy} className="w-full">
              {busy ? "Signing in" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-[13px] text-zinc-500">
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">Create one</Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 border-l border-zinc-200 bg-zinc-50 lg:block">
        <div className="flex h-full flex-col justify-center px-14">
          <p className="text-[13px] font-medium uppercase tracking-wider text-brand-600">Demo accounts</p>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
            Each role sees a different part of the same order trail. All demo accounts use the password
            <code className="mx-1.5 rounded bg-white px-1.5 py-0.5 font-mono text-[13px] text-zinc-800 border border-zinc-200">Demo!2026inv</code>
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              ["distributor@inventiflow.demo", "Distributor"],
              ["warehouse@inventiflow.demo", "Warehouse Manager"],
              ["production@inventiflow.demo", "Production Manager"],
              ["vendor@inventiflow.demo", "Vendor"],
            ].map(([email, role]) => (
              <li key={email} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5">
                <code className="font-mono text-[12.5px] text-zinc-700">{email}</code>
                <span className="text-xs text-zinc-500">{role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { LogOut, Boxes } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import { cn } from "@/lib/cn";

/* Every signed-in page renders inside this: the same sidebar, the same header,
   the same page padding. The old app repeated a different layout per page. */
export function AppShell({ role, profile, title, description, actions, children }: any) {
  const router = useRouter();
  const nav = NAV[role] || { items: [] };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const initials = (profile?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">InventiFlow</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {nav.items.map((item) => {
            const active = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-brand-50 font-medium text-brand-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-900">{profile?.name || "Signed in"}</p>
              <p className="truncate text-xs text-zinc-500">{ROLE_LABEL[role] || role}</p>
            </div>
            <button onClick={signOut} title="Sign out" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur">
          <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-zinc-900">{title}</h1>
              {description && <p className="text-[13px] text-zinc-500">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-6 py-6 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;

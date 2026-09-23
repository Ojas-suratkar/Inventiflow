import { cn } from "@/lib/cn";

export function Stat({ label, value, sub, icon, tone = "neutral", className }: any) {
  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white p-4 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-zinc-500">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              tone === "brand" && "bg-brand-50 text-brand-600",
              tone === "warn" && "bg-amber-50 text-amber-600",
              tone === "good" && "bg-emerald-50 text-emerald-600",
              tone === "neutral" && "bg-zinc-100 text-zinc-500"
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 tabular">{value}</p>
      {sub && <p className="mt-1 text-[13px] text-zinc-500">{sub}</p>}
    </div>
  );
}

export function StatRow({ children, className }: any) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

export default Stat;

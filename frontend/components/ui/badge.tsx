import { cn } from "@/lib/cn";

const tones = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Accepted: "bg-brand-50 text-brand-700 border-brand-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  low: "bg-rose-50 text-rose-700 border-rose-200",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function Badge({ children, tone, className }: any) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone] || tones[children] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;

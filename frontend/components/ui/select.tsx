import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

/* A dropdown that renders in the page rather than as an OS menu, so it behaves
   the same everywhere and shows up in screenshots and recordings. */
export function Select({ value, onChange, options = [], placeholder = "Select...", className, disabled }: any) {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  React.useEffect(() => {
    const close = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3",
          "text-sm text-left transition-colors focus-ring disabled:opacity-50",
          selected ? "text-zinc-900" : "text-zinc-400"
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-zinc-200 bg-white p-1 shadow-pop animate-fade-up max-h-64 overflow-auto">
          {options.length === 0 && <p className="px-3 py-2 text-sm text-zinc-400">Nothing to choose yet</p>}
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm text-left",
                String(o.value) === String(value) ? "bg-brand-50 text-brand-700" : "text-zinc-700 hover:bg-zinc-50"
              )}
            >
              <span className="truncate">{o.label}</span>
              {String(o.value) === String(value) && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;

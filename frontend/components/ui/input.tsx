import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef(function Input({ className, ...props }: any, ref: any) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
        "placeholder:text-zinc-400 focus-ring transition-colors",
        className
      )}
      {...props}
    />
  );
});

export function Field({ label, hint, children, className }: any) {
  return (
    <div className={className}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default Input;

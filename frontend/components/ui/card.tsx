import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...props }: any) {
  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }: any) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-200", className)}>
      <div>
        <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
        {description && <p className="text-[13px] text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: any) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export default Card;

import Link from "next/link";
import { ArrowRight, Boxes, Factory, Truck, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  { icon: Truck, title: "Distributors", copy: "Order stock from the warehouse that covers your postcode and track every order to delivery." },
  { icon: Warehouse, title: "Warehouses", copy: "Accept or reject incoming orders against live stock, and restock from the factories." },
  { icon: Factory, title: "Production", copy: "See the queue, and the raw materials each run consumes, worked out from the recipe." },
  { icon: Boxes, title: "Vendors", copy: "Fill raw material requests from the factories, with prices and deadlines in one list." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">InventiFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm">Create account</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <p className="text-[13px] font-medium uppercase tracking-wider text-brand-600">Supply chain operations</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
          One order trail from the shelf back to the raw material.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600">
          InventiFlow connects distributors, warehouses, factories and vendors in a single system. An order placed
          downstream moves stock, triggers a restock, and works out the raw materials the run will need.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login"><Button size="lg">Sign in <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/signup"><Button size="lg" variant="secondary">Create an account</Button></Link>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden px-6 py-16 sm:grid-cols-2">
          {roles.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-brand-600">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-zinc-900">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto max-w-5xl px-6 py-6 text-[13px] text-zinc-500">
          InventiFlow · Next.js and Supabase
        </div>
      </footer>
    </div>
  );
}

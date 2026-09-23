import { cn } from "@/lib/cn";

export function Table({ columns = [], rows = [], empty = "Nothing here yet", loading = false, rowKey }: any) {
  if (loading) {
    return (
      <div className="p-5 space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 rounded-md bg-zinc-100 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="px-5 py-10 text-center text-sm text-zinc-500">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap",
                  c.align === "right" && "text-right"
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row) : i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-5 py-3 text-zinc-700 whitespace-nowrap",
                    c.align === "right" && "text-right tabular",
                    c.strong && "font-medium text-zinc-900"
                  )}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

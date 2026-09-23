import * as React from "react";
import { CheckCircle2, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/cn";

/* The app used window.alert for every message, which blocks the page and looks
   like a browser error. These are inline and dismiss themselves. */
const ToastContext = React.createContext<(message: string, tone?: string) => void>(() => {});

export const useToast = () => React.useContext(ToastContext);

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <AlertTriangle className="h-4 w-4 text-rose-600" />,
  info: <Info className="h-4 w-4 text-brand-600" />,
};

export function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);

  const push = React.useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, message, tone }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismiss = (id) => setItems((list) => list.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-pop animate-fade-up",
              t.tone === "error" ? "border-rose-200" : "border-zinc-200"
            )}
          >
            <span className="mt-0.5">{icons[t.tone] || icons.info}</span>
            <p className="flex-1 text-sm text-zinc-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;

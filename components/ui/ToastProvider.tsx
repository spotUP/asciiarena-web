"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastKind = "success" | "warning" | "danger" | "info";

interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
}

interface ToastContextValue {
  /** Show a transient toast. Defaults to a green "success" alert. */
  toast: (msg: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast used outside ToastProvider");
  return ctx;
}

let nextToastId = 1;
const TOAST_MS = 2500;

/**
 * Site-wide transient toasts. Reuses the Bootstrap `.alert-*` look the settings
 * pages already use, floated bottom-left (clear of the bottom-right chat bar)
 * and auto-dismissing. Use for save feedback as forms move to auto-save.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = nextToastId++;
    setItems(prev => [...prev, { id, msg, kind }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), TOAST_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 9500,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          maxWidth: "min(360px, 90vw)",
        }}
      >
        {items.map(t => (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            className={`alert alert-${t.kind} animate__animated animate__fadeInUp`}
            style={{
              margin: 0,
              pointerEvents: "all",
              cursor: "pointer",
              // Site rule: everything renders at the fixed 16px terminal size.
              fontSize: "16px",
              lineHeight: "16px",
              fontFamily: "TopazPlus_a1200, monospace",
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

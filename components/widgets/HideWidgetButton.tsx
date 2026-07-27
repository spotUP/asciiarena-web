"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WidgetKey } from "@/lib/widgets-types";

// The [X] in a widget's top-right corner. Hides that widget for this user
// only; it can be switched back on from Settings -> Widgets.
//
// PATCHes a single key rather than sending the whole hidden set, so clicking
// [X] cannot clobber a change made in another tab or on the settings page.
export default function HideWidgetButton({ widgetKey }: { widgetKey: WidgetKey }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      className="widget-hide-btn lightgrey"
      disabled={pending}
      title={failed ? "Could not hide this widget" : "Hide this widget (re-enable in Settings)"}
      aria-label="Hide this widget"
      onClick={() => {
        setFailed(false);
        startTransition(async () => {
          try {
            const res = await fetch("/api/settings/widgets", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hide: widgetKey }),
            });
            if (!res.ok) { setFailed(true); return; }
            // The sidebars are server-rendered, so the widget only actually
            // goes away once the page re-fetches.
            router.refresh();
          } catch {
            setFailed(true);
          }
        });
      }}
    >
      {failed ? "[!]" : "[X]"}
    </button>
  );
}

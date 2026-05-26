"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresh({ channel }: { channel: string }) {
  const router = useRouter();
  useEffect(() => {
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string };
        if (evt.type === "watching") return;
        router.refresh();
      } catch {
        router.refresh();
      }
    };
    return () => es.close();
  }, [channel, router]);
  return null;
}

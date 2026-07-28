"use client";

import { useRouter } from "next/navigation";
import NewItemsPill from "@/components/ui/NewItemsPill";

/**
 * Non-intrusive "N new" strip for a board's topic list.
 *
 * A full router.refresh() would reorder rows under a reader who is mid-scroll,
 * mid-sort or mid-search, so the topic list waits to be told.
 */
export default function BoardNewItemsPill({ channel }: { channel: string }) {
  const router = useRouter();
  return (
    <NewItemsPill
      channel={channel}
      onReset={() => router.refresh()}
      label={n => `^ ${n} new ${n === 1 ? "post" : "posts"} since you loaded - click to refresh`}
    />
  );
}

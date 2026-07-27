"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hidePollAction } from "@/app/actions/polls";

// Offered on the home page hero once the user has voted: stops this poll
// taking the top of their home page, without hiding it from /polls or from
// anybody else. The server re-checks that they actually voted.
export default function HidePollButton({ pollId }: { pollId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span style={{ display: "inline-flex", gap: "8px", alignItems: "baseline" }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await hidePollAction(pollId);
            if (!res.ok) { setError(res.error ?? "Could not hide this poll."); return; }
            // The hero is server-rendered, so the page has to re-fetch for the
            // poll to actually disappear.
            router.refresh();
          });
        }}
        className="lightgrey"
        title="Stop showing this poll on my home page"
        style={{
          background: "transparent", border: "none", padding: 0, cursor: "pointer",
          fontFamily: "inherit", fontSize: "inherit", lineHeight: "16px", textDecoration: "underline",
        }}
      >
        {pending ? "[ hiding... ]" : "[ hide this poll ]"}
      </button>
      {error && <span className="lightred">{error}</span>}
    </span>
  );
}

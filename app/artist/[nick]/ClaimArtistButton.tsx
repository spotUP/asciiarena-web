"use client";

import { useState } from "react";
import { claimArtist } from "@/app/actions/artists";

export default function ClaimArtistButton({ artistNick }: { artistNick: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const claim = async () => {
    setState("loading");
    const r = await claimArtist(artistNick);
    if (r.success) {
      setState("done");
      setMsg("Claimed! Reload to see your profile linked.");
    } else {
      setState("error");
      setMsg(r.error ?? "Failed to claim artist.");
    }
  };

  if (state === "done") return <span className="yellow">{msg}</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <input
        type="button"
        className="btn-big"
        value={state === "loading" ? "Claiming..." : "Claim this artist"}
        disabled={state === "loading"}
        onClick={claim}
      />
      {state === "error" && <span className="red">{msg}</span>}
    </span>
  );
}

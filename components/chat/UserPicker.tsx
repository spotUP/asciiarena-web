"use client";

import { useEffect, useRef, useState } from "react";

export interface PickableUser { id: number; nick: string }

interface Props {
  onPick: (user: PickableUser) => void;
  /** Users already chosen / already in the thread — filtered out of results. */
  excludeIds?: number[];
  placeholder?: string;
  autoFocus?: boolean;
  width?: string;
}

const DEBOUNCE_MS = 150;

/**
 * Nick type-ahead against /api/chat/users.
 *
 * Extracted from ChatWindow's add-member popover so the message composer can
 * reuse the exact same search instead of growing a third copy (the composer
 * used to demand a raw numeric user ID). Deliberately single-pick: callers that
 * need several users call onPick repeatedly and own the selection state, which
 * keeps this component free of any opinion about how selections are displayed.
 */
export default function UserPicker({ onPick, excludeIds = [], placeholder = "nick...", autoFocus = false, width }: Props) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<PickableUser[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/chat/users?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) setSuggestions(data as PickableUser[]);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);
  };

  const visible = suggestions.filter(s => !excludeIds.includes(s.id));

  const pick = (user: PickableUser) => {
    onPick(user);
    setSearch("");
    setSuggestions([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width }}>
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); fetchSuggestions(e.target.value); }}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === "Escape") { setSearch(""); setSuggestions([]); }
          // Enter picks the only remaining match — faster than reaching for the
          // mouse when the nick has been typed out in full.
          if (e.key === "Enter" && visible.length === 1) { e.preventDefault(); pick(visible[0]); }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          background: "#111", border: "1px solid #444", color: "#aaaaaa",
          fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px",
          padding: "0 8px", height: "32px",
        }}
      />
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {visible.map(s => (
            <button
              key={s.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(s); }}
              style={{
                background: "#1a1a1a", border: "1px solid #333", color: "#ffff55",
                cursor: "pointer", fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px",
                lineHeight: "16px", height: "16px", padding: "0 8px", textAlign: "left",
              }}
            >
              {s.nick}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

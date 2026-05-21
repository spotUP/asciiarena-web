"use client";

import { useEffect, useState } from "react";

export default function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/messages/unread")
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        const c = data?.count ?? 0;
        setCount(c);
      })
      .catch(() => {});
  }, []);

  if (count <= 0) return null;

  return (
    <span
      style={{
        background: "var(--color-magenta)",
        color: "#000",
        borderRadius: "50%",
        padding: "0 4px",
        fontSize: "0.7em",
        marginLeft: "4px",
      }}
    >
      {count}
    </span>
  );
}

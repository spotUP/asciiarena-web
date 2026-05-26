"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatBar from "./ChatBar";

interface SessionUser {
  id?: string;
  name?: string | null;
}

export default function ChatProvider() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { user?: SessionUser } | null) => {
        if (data?.user?.id) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  if (!user?.id) return null;
  // Don't render the chat bar in popped-out chat windows — they're their own
  // dedicated chat surface and a bar at the bottom would be recursive UI.
  if (pathname?.startsWith("/chat/window/")) return null;

  return <ChatBar userId={user.id} userNick={user.name ?? ""} />;
}

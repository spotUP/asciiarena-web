"use client";

import { useEffect, useState } from "react";
import ChatBar from "./ChatBar";

interface SessionUser {
  id?: string;
  name?: string | null;
}

export default function ChatProvider() {
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

  return <ChatBar userId={user.id} userNick={user.name ?? ""} />;
}

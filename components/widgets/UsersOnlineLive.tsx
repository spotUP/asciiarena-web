"use client";
import { useEffect, useRef, useState } from "react";
import { urlsafe } from "@/lib/utils";
import ScrambleText from "@/components/ui/ScrambleText";
import { useChatContext } from "@/components/chat/ChatContext";

type NickState = "stable" | "entering" | "leaving";

interface UserEntry {
  id: number;
  nick: string;
  state: NickState;
  inChat: boolean;
}

interface ActiveUser {
  id: number;
  nick: string;
  inChat?: boolean;
}

interface OnlineData {
  activeUsers: ActiveUser[];
  anonymousOnline: number;
}

const ANIM_MS = 400;

function load(set: (d: OnlineData) => void) {
  fetch("/api/users-online")
    .then(r => r.json())
    .then((d: unknown) => {
      if (d && typeof d === "object" && "activeUsers" in d) set(d as OnlineData);
    })
    .catch(() => {});
}

export default function UsersOnlineLive({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [anonCount, setAnonCount] = useState(0);
  const [anonFlash, setAnonFlash] = useState(false);
  const sessionIdRef = useRef<string>("");
  const prevAnonRef = useRef<number>(0);
  const { openChat } = useChatContext();

  function applyUpdate(newUsers: ActiveUser[], newAnon: number) {
    const newNicks = newUsers.map(u => u.nick);
    setEntries(prev => {
      const prevSet = new Set(prev.map(e => e.nick));
      const newSet = new Set(newNicks);
      const entering = newNicks.filter(n => !prevSet.has(n));
      const leaving = prev.filter(e => !newSet.has(e.nick) && e.state !== "leaving").map(e => e.nick);

      const updated: UserEntry[] = [
        ...newUsers.map(u => ({
          id: u.id,
          nick: u.nick,
          state: entering.includes(u.nick) ? ("entering" as NickState) : "stable",
          inChat: !!u.inChat,
        })),
        ...prev.filter(e => leaving.includes(e.nick)).map(e => ({ ...e, state: "leaving" as NickState })),
      ];

      if (entering.length > 0) {
        setTimeout(() => {
          setEntries(cur => cur.map(e => entering.includes(e.nick) ? { ...e, state: "stable" } : e));
        }, ANIM_MS);
      }
      if (leaving.length > 0) {
        setTimeout(() => {
          setEntries(cur => cur.filter(e => !leaving.includes(e.nick)));
        }, ANIM_MS);
      }
      return updated;
    });

    if (newAnon !== prevAnonRef.current) {
      prevAnonRef.current = newAnon;
      setAnonCount(newAnon);
      setAnonFlash(true);
      setTimeout(() => setAnonFlash(false), 800);
    }
  }

  useEffect(() => {
    let sid = localStorage.getItem("anon-session") ?? "";
    if (!sid || !/^[a-f0-9-]{36}$/.test(sid)) {
      sid = crypto.randomUUID();
      localStorage.setItem("anon-session", sid);
    }
    sessionIdRef.current = sid;

    load(d => {
      setEntries(d.activeUsers.map(u => ({ id: u.id, nick: u.nick, state: "stable", inChat: !!u.inChat })));
      setAnonCount(d.anonymousOnline);
      prevAnonRef.current = d.anonymousOnline;
    });

    const es = new EventSource("/api/live?channel=site:online");
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "update") {
          applyUpdate(event.activeUsers as ActiveUser[], event.anonymousOnline as number);
        }
      } catch { /* ignore */ }
    };

    function ping() {
      fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
    }
    ping();
    const interval = setInterval(ping, 60_000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2" style={{ minHeight: "160px" }}>
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">USERS ONLINE</h2>
      </div>
      <div className="container col-12 p-0 m-0 apt-1 bg-secondary" style={{ minHeight: "112px" }}>
        {entries.map((entry) => (
          <div key={entry.nick} className="col-lg-12" style={{ paddingLeft: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
            <a className="yellow" href={`/member/${urlsafe(entry.nick)}`}>
              <ScrambleText text={entry.nick} mode={entry.state} />
            </a>
            {entry.inChat && (
              <span
                title={`${entry.nick} has chat open`}
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#55ffff",
                  boxShadow: "0 0 4px #55ffff",
                }}
              />
            )}
            {isLoggedIn && entry.id > 0 && (
              <button
                onClick={() => openChat(entry.id, entry.nick)}
                className="lightgrey"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
                title={`Chat with ${entry.nick}`}
              >
                [chat]
              </button>
            )}
          </div>
        ))}
        <div className="col-lg-12 apt-1 p-0 pl-lg-2 pr-lg-2">
          <span className={anonFlash ? "blink" : ""}>{anonCount} anonymous online</span>
        </div>
      </div>
    </div>
  );
}

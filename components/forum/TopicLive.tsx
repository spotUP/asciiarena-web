"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeRaw } from "@/lib/sse-pool";

interface Props {
  channel: string;
  /** Own nick, so your own typing draft is not echoed back at you. */
  userNick?: string | null;
  /** True when the reader is on the last page, where new replies can appear. */
  onLastPage: boolean;
}

interface Draft {
  nick: string;
  text: string;
}

const DRAFT_TTL = 4000;
/** How close to the bottom counts as "following along". Two screens. */
const NEAR_BOTTOM_PX = 2000;

/**
 * The topic page's only live subscriber. Three jobs on one connection:
 * the [N viewing] chip, peer typing drafts, and new replies.
 *
 * New replies are handled adaptively. Someone at the bottom of the last page is
 * reading along and wants the reply to appear; someone on page 1 of 9 is
 * reading and must not have the page yanked out from under them, so they get a
 * pill instead. router.refresh() preserves client state either way, so a
 * half-written reply survives.
 */
export default function TopicLive({ channel, userNick, onLastPage }: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [watching, setWatching] = useState(0);
  const [pending, setPending] = useState(0);
  const draftTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const onLastPageRef = useRef(onLastPage);
  onLastPageRef.current = onLastPage;

  useEffect(() => {
    const timers = draftTimers.current;
    const unsubscribe = subscribeRaw(channel, evt => {
      if (!evt) return;
      const nick = typeof evt.nick === "string" ? evt.nick : null;

      if (evt.type === "watching") {
        setWatching(typeof evt.count === "number" ? evt.count : 0);
        return;
      }
      if (evt.type === "typing" && nick) {
        const draft = typeof evt.draft === "string" ? evt.draft : "";
        setDrafts(prev => ({ ...prev, [nick]: { nick, text: draft } }));
        clearTimeout(timers[nick]);
        timers[nick] = setTimeout(() => {
          setDrafts(prev => {
            const next = { ...prev };
            delete next[nick];
            return next;
          });
        }, DRAFT_TTL);
        return;
      }
      if (evt.type === "clear" && nick) {
        clearTimeout(timers[nick]);
        setDrafts(prev => {
          const next = { ...prev };
          delete next[nick];
          return next;
        });
        return;
      }
      if (evt.type === "posted") {
        const nearBottom =
          window.innerHeight + window.scrollY >= document.body.offsetHeight - NEAR_BOTTOM_PX;
        if (onLastPageRef.current && nearBottom) {
          router.refresh();
        } else {
          setPending(n => n + 1);
        }
        return;
      }
      // Refresh ONLY for events that actually changed what is on the page. A
      // catch-all here meant every unrecognised event -- and every future one
      // -- reloaded the topic under the reader, which is what made the forum
      // feel like it was constantly reloading.
      if (evt.type === "edit" || evt.type === "delete" || evt.type === "moderated") {
        router.refresh();
      }
    });

    return () => {
      unsubscribe();
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, [channel, router]);

  const peerDrafts = Object.values(drafts).filter(d => d.text && d.nick !== userNick);

  return (
    <>
      {watching > 1 && (
        <div className="lightcyan" style={{ height: "16px", lineHeight: "16px", marginBottom: "16px" }}>
          [{watching} viewing]
        </div>
      )}

      {pending > 0 && (
        <div
          onClick={() => {
            setPending(0);
            router.refresh();
          }}
          title="Reload this topic to see the new replies"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            cursor: "pointer",
            background: "#aa00aa",
            color: "#ffffff",
            textAlign: "center",
            height: "16px",
            lineHeight: "16px",
            padding: "0 8px",
            marginBottom: "16px",
            fontSize: "16px",
            fontFamily: "TopazPlus_a1200, monospace",
          }}
        >
          {`^ ${pending} new ${pending === 1 ? "reply" : "replies"} - click to refresh`}
        </div>
      )}

      {peerDrafts.map(d => (
        <div
          key={d.nick}
          className="col-lg-12 pl-0 apb-1 bg-secondary ap-1"
          style={{ marginBottom: "16px", opacity: 0.7 }}
        >
          <div className="lightgrey" style={{ height: "16px", lineHeight: "16px" }}>
            {d.nick} (typing...)
          </div>
          <div className="lightgrey" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "16px" }}>
            {d.text}
            <span className="cursor-block" />
          </div>
        </div>
      ))}
    </>
  );
}

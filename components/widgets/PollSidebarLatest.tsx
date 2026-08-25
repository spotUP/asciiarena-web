import Link from "next/link";
import { getSession } from "@/lib/session";
import { loadLatestClosedPoll } from "@/lib/polls/load";
import PollCard from "@/components/widgets/poll/PollCard";

// Small sidebar widget showing the most recent closed poll's result bars,
// with a link to the archive. Returns null when no closed polls exist.
export default async function PollSidebarLatest() {
  const session = await getSession().catch(() => null);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const loaded = await loadLatestClosedPoll(userId ? Number(userId) : null);
  if (!loaded) return null;

  return (
    <div className="widget">
      <div className="widget-head">
        <h2 className="widget-title bg-header">LAST POLL</h2>
      </div>
      <PollCard
        poll={loaded.poll}
        myVotes={loaded.myVotes}
        results={loaded.results}
        canSeeResults={true}
        isLoggedIn={!!userId}
        variant="sidebar"
      />
      <div style={{ textAlign: "right", padding: "0 8px" }}>
        <Link prefetch={false} href="/polls/archive" className="lightgrey" style={{
          fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px",
        }}>
          {"[ all past polls -> ]"}
        </Link>
      </div>
    </div>
  );
}

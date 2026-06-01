import LiveRefresh from "@/components/widgets/LiveRefresh";
import { getSession } from "@/lib/session";
import { loadFeaturedPoll } from "@/lib/polls/load";
import PollCard from "@/components/widgets/poll/PollCard";
import { getHiddenWidgets } from "@/lib/widgets";

// Big hero widget for the homepage. Renders the featured open poll (if any)
// and subscribes to two SSE channels — site:polls (so the hero swaps when
// the admin features a different poll) and poll:<id> (so bars update live
// as votes come in). Returns null if no featured poll exists.
export default async function PollHero() {
  const hidden = await getHiddenWidgets();
  if (hidden.has("poll_hero")) return null;
  const session = await getSession().catch(() => null);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  const loaded = await loadFeaturedPoll(userId ? Number(userId) : null);

  return (
    <>
      <LiveRefresh channel="site:polls" />
      {loaded && (
        <PollCard
          poll={loaded.poll}
          myVotes={loaded.myVotes}
          results={loaded.results}
          canSeeResults={loaded.canSeeResults}
          isLoggedIn={!!userId}
          variant="hero"
        />
      )}
    </>
  );
}

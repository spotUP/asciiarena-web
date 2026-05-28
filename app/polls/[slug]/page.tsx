import { notFound } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import { getSession } from "@/lib/session";
import { loadPollBySlug } from "@/lib/polls/load";
import PollCard from "@/components/widgets/poll/PollCard";

export const dynamic = "force-dynamic";

export default async function PollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const loaded = await loadPollBySlug(slug, userId);
  if (!loaded) notFound();

  return (
    <SiteLayout title={loaded.poll.title}>
      <PollCard
        poll={loaded.poll}
        myVotes={loaded.myVotes}
        results={loaded.results}
        canSeeResults={loaded.canSeeResults}
        isLoggedIn={!!userId}
        variant="page"
      />
    </SiteLayout>
  );
}

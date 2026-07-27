import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { unstable_cache } from "next/cache";

// Artist handles for the logo tagger's author picker.
//
// The submit form gets the same list from a server component
// (app/submit/page.tsx), but the tagging panel is mounted client-side from the
// release page, so it needs an endpoint. Without it the picker has nothing to
// match against and can only ever offer "create a new artist" — which is how
// a tagger ends up creating a duplicate of an artist who is already in the
// catalog.
//
// Nicks only: no ids, no ratings, nothing that is not already on the public
// artist listing. Cached because the set changes rarely and every tagger who
// opens the panel asks for it.
const getArtistNames = unstable_cache(
  async () => {
    const rows = await prisma.artists.findMany({
      select: { nick: true },
      orderBy: { nick: "asc" },
    });
    return rows.map((r) => r.nick ?? "").filter(Boolean);
  },
  ["artist-names"],
  { revalidate: 600, tags: ["site:artists"] },
);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  return apiOk(await getArtistNames());
}

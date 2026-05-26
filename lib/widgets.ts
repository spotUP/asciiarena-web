import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";
import type { WidgetKey } from "@/lib/widgets-types";

/**
 * Fetch the set of widget keys the current user has chosen to hide. Cached per
 * render so multiple components (LeftSidebar, RightSidebar, the home page) each
 * pay one shared DB lookup. Returns an empty Set for anonymous viewers.
 */
export const getHiddenWidgets = cache(async (): Promise<Set<WidgetKey>> => {
  const session = await auth().catch(() => null);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  if (!userId) return new Set();

  const u = await prisma.users.findUnique({
    where: { id: parseInt(userId) },
    select: { hidden_widgets: true },
  });
  if (!u?.hidden_widgets) return new Set();

  return new Set(
    u.hidden_widgets.split(",").map(x => x.trim()).filter(Boolean) as WidgetKey[]
  );
});

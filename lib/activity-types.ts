/**
 * Pure data + types about the activity-feed event taxonomy. Kept separate from
 * `lib/activity.ts` so client components (which can't import Prisma) can use
 * the labels and the type list without dragging the DB adapter into the bundle.
 */
export const ACTIVITY_TYPES = [
  "wall",
  "upload",
  "request",
  "view",
  "comment",
  "fav",
  "unfav",
  "claim",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  wall: "Posting on the wall",
  upload: "Uploading collys",
  request: "Submitting requests",
  view: "Viewing releases",
  comment: "Posting comments",
  fav: "Favouriting collys",
  unfav: "Un-favouriting collys",
  claim: "Claiming artist pages",
};

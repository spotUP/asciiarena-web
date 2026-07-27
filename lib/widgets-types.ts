/**
 * Canonical widget key list. The settings UI offers a toggle per key, and the
 * rendering code in `app/page.tsx`, `components/layout/LeftSidebar.tsx`, and
 * `components/layout/RightSidebar.tsx` skips a widget when its key is in the
 * user's `hidden_widgets`.
 *
 * Kept in its own file (no Prisma imports) so client components can import the
 * labels without dragging the DB adapter into the bundle.
 */

export const WIDGET_KEYS = [
  // Home main content
  "poll_hero",
  "latest_releases",
  "random_releases",
  "latest_comments",
  "recently_viewed",
  "wall",
  "global_wall",
  // Left sidebar
  "users_online",
  "activity_feed",
  "ced_sessions",
  "now_playing",
  "music_player",
  "last_callers",
  "poll_latest_closed",
  "latest_collys_released",
  "latest_collys_added",
  "latest_mags",
  "latest_apps",
  "new_users",
  "weektop",
  // Right sidebar
  "top_collys",
  "most_viewed_collys",
  "top_artists",
  "top_crews",
  "top_uploaders",
  "top_commenters",
  "top_taggers",
  "arena_stats",
  "bbs_weektop",
] as const;

export type WidgetKey = (typeof WIDGET_KEYS)[number];

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  poll_hero: "Featured Poll (Hero)",
  poll_latest_closed: "Last Poll Results",
  latest_releases: "Latest Releases",
  random_releases: "Random Releases",
  latest_comments: "Latest Comments",
  recently_viewed: "Recently Viewed",
  wall: "aSCIIaRENA Wall",
  global_wall: "Global BBS Wall",
  users_online: "Users Online",
  activity_feed: "Live Feed",
  ced_sessions: "Editing in CED",
  now_playing: "Playing in HippoPlayer",
  music_player: "Modland Music Player",
  last_callers: "Last Callers",
  latest_collys_released: "New Collys",
  latest_collys_added: "Latest Added Collys",
  latest_mags: "Latest Added Mags",
  latest_apps: "Latest Added Apps",
  new_users: "New Users",
  weektop: "Weektop — BBS Uploaders",
  top_collys: "Top 5 Collys",
  most_viewed_collys: "Most Viewed Collys",
  top_artists: "Top 5 Artists",
  top_crews: "Top 5 Crews",
  top_uploaders: "Top Uploaders",
  top_commenters: "Top Commenters",
  top_taggers: "Top Taggers",
  arena_stats: "aSCIIaRENA Stats",
  bbs_weektop: "Weektop — BBS:es",
};

// Loose, broad-grouped order for the settings UI.
export const WIDGET_GROUPS: { label: string; keys: WidgetKey[] }[] = [
  {
    label: "Home main column",
    keys: ["poll_hero", "latest_releases", "random_releases", "latest_comments", "recently_viewed", "wall", "global_wall"],
  },
  {
    label: "Left sidebar",
    keys: [
      "users_online", "activity_feed", "ced_sessions", "now_playing", "music_player", "last_callers",
      "poll_latest_closed",
      "latest_collys_released", "latest_collys_added", "latest_mags",
      "latest_apps", "new_users", "weektop",
    ],
  },
  {
    label: "Right sidebar",
    keys: [
      "top_collys", "most_viewed_collys", "top_artists", "top_crews",
      "top_uploaders", "top_commenters", "top_taggers", "arena_stats", "bbs_weektop",
    ],
  },
];

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link to one of the site's content pages, with prefetching switched off.
 *
 * Next prefetches `<Link>` targets as they enter the viewport, and on this site
 * every one of those prefetches is a FULL server render of the target page --
 * `/release/*` decodes and renders ANSI art, and measures 0.5-1.3s and
 * 120-190KB each. A listing page carries a lot of them: `/artist/boheme` has
 * 150 release links alone, so scrolling it asked a two-CPU box for a hundred
 * page renders that nobody had navigated to. The page you are looking at stays
 * fast while the server is busy building pages for links you merely scrolled
 * past.
 *
 * `components/layout/Navbar.tsx` already carried `prefetch={false}` on every
 * link for this reason. This component is that same decision, in one place,
 * for the content routes -- so the rule does not have to be remembered at each
 * of the sixty-odd call sites.
 *
 * Use it for any link to /release, /artist, /crew, /member, /magazine,
 * /application, /country, /logos or /collys.
 * `lib/__tests__/content-link-prefetch.test.ts` enforces that.
 */
export default function ContentLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} />;
}

// The site's section-title idiom, in one place. Same markup as
// app/admin/polls/page.tsx and components/widgets/LatestNews.tsx.
//
// h2 is deliberate: site.css glows h1-h3 and blinks h5-h6, and a widget title
// is exactly where the glow is wanted (RULES.md).
export default function ForumSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="header col-lg-12 p-0 amb-1">
      <h2 className="ap-1 bg-header">{children}</h2>
    </div>
  );
}

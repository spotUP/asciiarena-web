/**
 * Column headers for the board index.
 *
 * Plain labels, not sort links: the board list is short, hand-ordered by
 * position, and re-sorting it would fight that ordering. The widths match
 * BoardRow, which matches the topic list's, so the two tables read as one
 * design rather than two.
 */
const COLUMNS: ReadonlyArray<{ label: string; width: string }> = [
  { label: "Board", width: "col-5" },
  { label: "Topics", width: "col-2" },
  { label: "Posts", width: "col-2" },
  { label: "Last Post", width: "col-2" },
];

export default function BoardHeaders() {
  return (
    <div className="row amb-1 m-0" style={{ height: "16px", lineHeight: "16px" }}>
      <div className="col-1 p-0" />
      {COLUMNS.map(c => (
        <div key={c.label} className={`${c.width} p-0`}>
          <span className="yellow">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

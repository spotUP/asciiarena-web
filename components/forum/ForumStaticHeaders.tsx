/**
 * Column headers for a forum table that does not sort.
 *
 * Plain labels, not sort links: the board list is hand-ordered by position and
 * the recent-topics list is defined BY its order, so re-sorting either would
 * fight what the list is for. Sortable tables use ForumSortHeaders instead.
 *
 * The widths are the same set BoardRow and TopicRow use, so every table on the
 * forum lines up as one design rather than several.
 */
export interface ForumColumn {
  label: string;
  /** Bootstrap column class, e.g. "col-5". */
  width: string;
}

export const BOARD_COLUMNS: ReadonlyArray<ForumColumn> = [
  { label: "Board", width: "col-5" },
  { label: "Topics", width: "col-2" },
  { label: "Posts", width: "col-2" },
  { label: "Last Post", width: "col-2" },
];

export const RECENT_TOPIC_COLUMNS: ReadonlyArray<ForumColumn> = [
  { label: "Topic", width: "col-5" },
  { label: "Board", width: "col-2" },
  { label: "Author", width: "col-2" },
  { label: "Last Post", width: "col-2" },
];

export default function ForumStaticHeaders({ columns }: { columns: ReadonlyArray<ForumColumn> }) {
  return (
    <div className="row amb-1 m-0" style={{ height: "16px", lineHeight: "16px" }}>
      {/* Empty leader cell: the rows put their pin/marker glyph here. */}
      <div className="col-1 p-0" />
      {columns.map(c => (
        <div key={c.label} className={`${c.width} p-0`}>
          <span className="yellow">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

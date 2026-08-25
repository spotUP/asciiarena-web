"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { addPlaylist as addPlaylistAction, deletePlaylist as deletePlaylistAction } from "@/app/actions/playlists";
import NewItemsPill from "@/components/ui/NewItemsPill";
import SortHeader from "@/components/ui/SortHeader";

interface PlaylistRow {
  id: number;
  title: string;
  genre: string | null;
  filename: string;
  uploaddate: string | null;
  total_count: number;
}

const PAGE_SIZE = 120;

export default function PlaylistsClient() {
  const [rows, setRows] = useState<PlaylistRow[]>([]);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [sort, setSort] = useState("uploaddate");
  const [asc, setAsc] = useState<"A" | "D">("D");
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newFilename, setNewFilename] = useState("");

  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg(text); setMsgOk(ok);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), 3000);
  };

  const load = useCallback(async () => {
    try {
      let url = `/api/playlists?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}`;
      if (filter) url += `&filter=${encodeURIComponent(filter)}`;
      const data: PlaylistRow[] = await (await fetch(url)).json();
      const total = data[0]?.total_count ?? 0;
      setMaxPage(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      setRows(data);
    } catch {}
  }, [page, sort, asc, filter]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (col: string) => {
    if (sort === col) {
      setAsc(a => a === "A" ? "D" : "A");
    } else {
      setSort(col);
      setAsc("A");
    }
    setPage(1);
  };

  const handleFilterChange = (val: string) => {
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => { setFilter(val); setPage(1); }, 300);
  };

  const deletePlaylist = async (id: number) => {
    if (!confirm("Delete this playlist?")) return;
    await deletePlaylistAction(id);
    load();
  };

  const addPlaylist = async () => {
    if (!newTitle || !newFilename) { flash("Title and filename required.", false); return; }
    const r = await addPlaylistAction({ title: newTitle, author: newAuthor, genre: newGenre, filename: newFilename });
    if (r.success) {
      setNewTitle(""); setNewAuthor(""); setNewGenre(""); setNewFilename("");
      flash("Added!", true);
      load();
    } else {
      flash(r.error ?? "Failed.", false);
    }
  };

  return (
    <>
      <NewItemsPill
        channel="site:playlists"
        onReset={() => { setRows([]); setPage(1); }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
        <input type="button" className="btn-big" value="|<" onClick={() => setPage(1)} />
        <input type="button" className="btn-big" value="<" onClick={() => setPage(p => Math.max(1, p - 1))} />
        <span className="lightgrey" style={{ minWidth: "80px", textAlign: "center" }}>{page} of {maxPage}</span>
        <input type="button" className="btn-big" value=">" onClick={() => setPage(p => Math.min(maxPage, p + 1))} />
        <input type="button" className="btn-big" value=">|" onClick={() => setPage(maxPage)} />
        <input
          type="text"
          className="form-control search-field"
          style={{ width: "200px" }}
          placeholder="Search..."
          onChange={e => handleFilterChange(e.target.value)}
        />
      </div>

      {/* Column widths match the data rows below (col-5 / col-3 / col-2 / col-2
          delete) so the headers line up with their columns. */}
      <div className="row amb-1">
        <div className="col-5">
          <SortHeader col="title" label="TITLE" sortKey={sort} asc={asc} onSort={toggleSort} />
        </div>
        <div className="col-3">
          <SortHeader col="genre" label="GENRE" sortKey={sort} asc={asc} onSort={toggleSort} />
        </div>
        <div className="col-2">
          <SortHeader col="uploaddate" label="DATE" sortKey={sort} asc={asc} onSort={toggleSort} />
        </div>
        <div className="col-2"></div>
      </div>

      <div>
        {rows.length === 0 && <div className="lightgrey apt-1">No playlists found.</div>}
        {rows.map(r => (
          <div key={r.id} className="row amb-1">
            <div className="col-5 text-truncate">
              <a className="magenta" href={`/assets/playlists/${encodeURIComponent(r.filename)}`}>{r.title}</a>
            </div>
            <div className="col-3 text-truncate lightgrey">{r.genre ?? ""}</div>
            <div className="col-2 lightgrey">{r.uploaddate ?? ""}</div>
            <div className="col-2">
              <input type="button" className="btn-big" value="Delete" onClick={() => deletePlaylist(r.id)} />
            </div>
          </div>
        ))}
      </div>

      <div className="apt-1" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <input type="text" className="form-control" style={{ width: "180px" }} placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <input type="text" className="form-control" style={{ width: "130px" }} placeholder="Author" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
        <input type="text" className="form-control" style={{ width: "120px" }} placeholder="Genre" value={newGenre} onChange={e => setNewGenre(e.target.value)} />
        <input type="text" className="form-control" style={{ width: "150px" }} placeholder="Filename (e.g. set.m3u)" value={newFilename} onChange={e => setNewFilename(e.target.value)} />
        <input type="button" className="btn-big" value="Add Playlist" onClick={addPlaylist} />
        {msg && <span className="apl-1" style={{ color: msgOk ? "#55ff55" : "#ff5555" }}>{msg}</span>}
      </div>
    </>
  );
}

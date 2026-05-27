"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import NewItemsPill from "@/components/ui/NewItemsPill";

interface MagRow {
  url: string;
  id: number;
  name: string | null;
  filesize: number | null;
  filename: string | null;
  author: string | null;
  timestamp: string | null;
  total_count: number;
}

interface MagsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function MagsClient({ initialSort, initialOrder }: MagsClientProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [asc, setAsc] = useState<"A" | "D">(initialOrder === "D" ? "D" : "A");
  const [filter, setFilter] = useState("");
  const [allRows, setAllRows] = useState<MagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Effect 1: reset list when sort/filter changes
  useEffect(() => {
    setAllRows([]);
    setPage(1);
    setHasMore(true);
  }, [sort, asc, filter]);

  // Effect 2: fetch current page
  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    (async () => {
      try {
        const rows: MagRow[] = await (await fetch(`/api/mags?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`)).json();
        if (!cancelled) {
          const total = rows[0]?.total_count ?? 0;
          setAllRows(prev => page === 1 ? rows : [...prev, ...rows]);
          setHasMore(rows.length > 0 && page * PAGE_SIZE < total);
          setLoading(false);
          setLoadingMore(false);
        }
      } catch {
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [page, sort, asc, filter]);

  // Effect 3: IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage(p => p + 1); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  function updateSort(newSort: string) {
    const newAsc = sort === newSort ? (asc === "A" ? "D" : "A") : "A";
    setSort(newSort);
    setAsc(newAsc);
  }

  return (
    <>
      <NewItemsPill
        channel="site:mags"
        onReset={() => { setAllRows([]); setPage(1); setHasMore(true); }}
      />
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary apb-1 w-100">
            <input
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-1 w-100"
              placeholder="Search..."
              type="text"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="row amb-1">
        <div className="col-3 white">
          <button className="sort-btn" onClick={() => updateSort("name")}>NAME</button>
        </div>
        <div className="col-3 white">
          <button className="sort-btn" onClick={() => updateSort("filename")}>FILENAME</button>
        </div>
        <div className="col-3 white">
          <button className="sort-btn" onClick={() => updateSort("author")}>AUTHOR</button>
        </div>
        <div className="col-3 white">
          <button className="sort-btn" onClick={() => updateSort("timestamp")}>DATE</button>
        </div>
      </div>

      <div id="magList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((mag) => (
            <div key={mag.id} className="row">
              <div className="col-3 text-truncate">
                <Link href={mag.url}>{mag.name}</Link>
              </div>
              <div className="col-3 text-truncate">
                <Link href={mag.url}>{mag.filename}</Link>
              </div>
              <div className="col-3 text-truncate">{mag.author}</div>
              <div className="col-3 text-truncate">{mag.timestamp}</div>
            </div>
          ))}
        {loadingMore && <div className="row apt-1"><div className="col lightgrey">Loading...</div></div>}
        {!hasMore && allRows.length > 0 && <div className="row apt-1"><div className="col lightgrey">--- end of results ---</div></div>}
        <div ref={sentinelRef} style={{ height: "1px" }} />
      </div>
    </>
  );
}

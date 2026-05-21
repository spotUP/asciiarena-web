"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface BbsRow {
  url: string;
  id: number;
  name: string | null;
  sysop: string | null;
  total_count: number;
}

interface BBSClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function BBSClient({ initialSort, initialOrder }: BBSClientProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [asc, setAsc] = useState<"A" | "D">(initialOrder === "D" ? "D" : "A");
  const [filter, setFilter] = useState("");
  const [allRows, setAllRows] = useState<BbsRow[]>([]);
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
        const rows: BbsRow[] = await (await fetch(`/api/bbs?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`)).json();
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
        <div className="col-6 white">
          <a onClick={() => updateSort("name")} style={{ cursor: "pointer" }}>
            NAME
          </a>
        </div>
        <div className="col-6 white">
          <a onClick={() => updateSort("sysop")} style={{ cursor: "pointer" }}>
            SYSOP
          </a>
        </div>
      </div>

      <div id="bbsList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((bbs) => (
            <div key={bbs.id} className="row">
              <div className="col-6">
                <Link href={bbs.url}>{bbs.name}</Link>
              </div>
              <div className="col-6">{bbs.sysop}</div>
            </div>
          ))}
        {loadingMore && <div className="row apt-1"><div className="col lightgrey">Loading...</div></div>}
        {!hasMore && allRows.length > 0 && <div className="row apt-1"><div className="col lightgrey">--- end of results ---</div></div>}
        <div ref={sentinelRef} style={{ height: "1px" }} />
      </div>
    </>
  );
}

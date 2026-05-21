"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { urlsafe } from "@/lib/utils";

interface ArtistRow {
  url: string;
  id: number;
  nick: string;
  crews: string;
  total_count: number;
}

interface ArtistsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function ArtistsClient({ initialSort, initialOrder }: ArtistsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? initialSort);
  const [asc, setAsc] = useState<"A" | "D">(() => (searchParams.get("asc") ?? initialOrder) === "D" ? "D" : "A");
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "");
  const [allRows, setAllRows] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const syncUrl = useCallback((s: string, a: string, f: string) => {
    const params = new URLSearchParams();
    if (s !== initialSort) params.set("sort", s);
    if (a !== "A") params.set("asc", a);
    if (f) params.set("filter", f);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, initialSort]);

  useEffect(() => {
    syncUrl(sort, asc, filter);
  }, [sort, asc, filter, syncUrl]);

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
        const rows: ArtistRow[] = await (await fetch(`/api/artists?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`)).json();
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
        <div className="col-2">
          <button className="sort-btn white" onClick={() => updateSort("nick")}>ARTiST</button>
        </div>
        <div className="col-10">
          <button className="sort-btn white" onClick={() => updateSort("crews")}>CREW</button>
        </div>
      </div>

      <div id="artistList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((artist) => (
            <div key={artist.id} className="row">
              <div className="forum_nick col-2">
                <Link href={artist.url}>{artist.nick}</Link>
              </div>
              <div className="artist_crew col-10">
                {(artist.crews ?? "").split(",").filter(Boolean).map((crew, i) => (
                  <span key={crew}>{i > 0 && ", "}<Link href={`/crew/${urlsafe(crew.trim())}`}>{crew.trim()}</Link></span>
                ))}
              </div>
            </div>
          ))}
        {loadingMore && <div className="row apt-1"><div className="col lightgrey">Loading...</div></div>}
        {!hasMore && allRows.length > 0 && <div className="row apt-1"><div className="col lightgrey">--- end of results ---</div></div>}
        <div ref={sentinelRef} style={{ height: "1px" }} />
      </div>
    </>
  );
}

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ContentLink from "@/components/ui/ContentLink";
import { countrySlug } from "@/lib/countrySlug";
import { urlsafe } from "@/lib/utils";
import SortHeader from "@/components/ui/SortHeader";
import NewItemsPill from "@/components/ui/NewItemsPill";

interface ArtistRow {
  url: string;
  id: number;
  nick: string;
  crews: string;
  rating: number | null;
  country: string;
  total_count: number;
}

interface ArtistsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function ArtistsClient({ initialSort, initialOrder }: ArtistsClientProps) {
  const searchParams = useSearchParams();

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
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [initialSort]);

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
      <NewItemsPill
        channel="site:artists"
        onReset={() => { setAllRows([]); setPage(1); setHasMore(true); }}
      />
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary w-100">
            <input
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-1 w-100 search-field"
              placeholder="Search..."
              type="text"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="row amb-1">
        <div className="col-2">
          <SortHeader col="nick" label="ARTiST" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col-6">
          <SortHeader col="crews" label="CREW" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col-2">
          <SortHeader col="rating" label="RATiNG" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col-2">
          <SortHeader col="country" label="COUNTRY" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
      </div>

      <div id="artistList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((artist) => (
            <div key={artist.id} className="row">
              <div className="forum_nick col-2">
                <ContentLink href={artist.url}>{artist.nick}</ContentLink>
              </div>
              <div className="artist_crew col-6">
                {(artist.crews ?? "").split(",").filter(Boolean).map((crew, i) => (
                  <span key={crew}>{i > 0 && ", "}<ContentLink href={`/crew/${urlsafe(crew.trim())}`}>{crew.trim()}</ContentLink></span>
                ))}
              </div>
              <div className="col-2 lightgrey">{artist.rating != null ? artist.rating.toFixed(1) : "-"}</div>
              <div className="col-2 lightgrey">
                {artist.country
                  ? <ContentLink href={`/country/${countrySlug(artist.country)}`} className="lightgrey">{artist.country}</ContentLink>
                  : "-"}
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

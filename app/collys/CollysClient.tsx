"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ContentLink from "@/components/ui/ContentLink";
import { urlsafe } from "@/lib/utils";
import SortHeader from "@/components/ui/SortHeader";
import NewItemsPill from "@/components/ui/NewItemsPill";

interface CollyRow {
  url: string;
  id: number;
  name: string;
  filename: string;
  filesize: number | null;
  artists: string;
  crews: string;
  cdate: string;
  total_count: number;
}

interface CollysClientProps {
  initialSort: string;
  initialOrder: string;
}

export default function CollysClient({ initialSort, initialOrder }: CollysClientProps) {
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? initialSort);
  const [asc, setAsc] = useState<"A" | "D">(() => (searchParams.get("asc") ?? initialOrder) === "D" ? "D" : "A");
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "");
  const [viewMode, setViewMode] = useState<1 | 2>(() => {
    const v = parseInt(searchParams.get("view") ?? "1");
    return v === 2 ? 2 : 1;
  });
  const [allRows, setAllRows] = useState<CollyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const pagesize = viewMode === 2 ? 6 : 120;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const syncUrl = useCallback((s: string, a: string, f: string, v: number) => {
    const params = new URLSearchParams();
    if (s !== initialSort) params.set("sort", s);
    if (a !== "A") params.set("asc", a);
    if (f) params.set("filter", f);
    if (v !== 1) params.set("view", String(v));
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [initialSort]);

  useEffect(() => {
    syncUrl(sort, asc, filter, viewMode);
  }, [sort, asc, filter, viewMode, syncUrl]);

  // Effect 1: reset list when sort/filter/viewMode changes
  useEffect(() => {
    setAllRows([]);
    setPage(1);
    setHasMore(true);
    setError(false);
  }, [sort, asc, filter, viewMode]);

  // Effect 2: fetch current page
  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    (async () => {
      try {
        const rows: CollyRow[] = await (await fetch(`/api/collys?page=${page}&sort=${sort}&asc=${asc}&pagesize=${pagesize}&filter=${encodeURIComponent(filter)}`)).json();
        if (!cancelled) {
          const total = rows[0]?.total_count ?? 0;
          setAllRows(prev => page === 1 ? rows : [...prev, ...rows]);
          setHasMore(rows.length > 0 && page * pagesize < total);
          setLoading(false);
          setLoadingMore(false);
        }
      } catch {
        if (!cancelled) { setLoading(false); setLoadingMore(false); setError(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [page, sort, asc, filter, pagesize]);

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

  function handleViewMode(v: number) {
    setViewMode(v as 1 | 2);
  }

  const [currentDate, setCurrentDate] = useState("");
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-GB", {
      weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit",
    }));
  }, []);

  return (
    <>
      <NewItemsPill
        channel="site:releases"
        onReset={() => { setAllRows([]); setPage(1); setHasMore(true); }}
      />
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1">
          <div className="btn-group">
            <button
              className="btn btn-primary dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              View Mode: v
            </button>
            <div className="dropdown-menu">
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => { e.preventDefault(); handleViewMode(1); }}
              >
                Standard
              </a>
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => { e.preventDefault(); handleViewMode(2); }}
              >
                BBS
              </a>
            </div>
          </div>
        </div>
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

      <div className="container-fluid bg-secondary apb-1">
        <div className="d-none d-sm-block text-truncate text-center">
          <span className="green">- --/\-\/- -</span>{" "}
          <span className="cyan">aSCIIaRENA</span>{" "}
          <span className="red">--=*=-- </span>
          <span className="pink">[{currentDate}]</span>
          <span className="red"> --=*=-- </span>{" "}
          <span className="cyan">aSCIIaRENA</span>{" "}
          <span className="green"> - -/\-\/- -- -</span>
        </div>
      </div>

      <div
        id="hdrcols"
        className="row mb-4"
        style={viewMode === 2 ? { display: "none" } : {}}
      >
        <div className="col-md-7 text-truncate d-none d-md-block">
          <SortHeader col="name" label="NAME" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col text-truncate">
          <SortHeader col="filename" label="FILENAME" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col white text-truncate">
          <SortHeader col="artists" label="ARTiST" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col white text-truncate">
          <SortHeader col="crews" label="CREW" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col text-truncate d-none d-md-block">
          <SortHeader col="cdate" label="DATE" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
      </div>

      <div
        id="hdrcols2"
        className="row amb-1"
        style={viewMode === 1 ? { display: "none" } : {}}
      >
        <span className="col-2 white">
          <SortHeader col="filename" label="FILENAME" sortKey={sort} asc={asc} onSort={updateSort} />
        </span>
        <span className="col-1 white">FLAGS</span>
        <span className="col-1 white">
          <SortHeader col="filesize" label="FILESIZE" sortKey={sort} asc={asc} onSort={updateSort} />
        </span>
        <span className="col-2 white">
          <SortHeader col="cdate" label="DATE" sortKey={sort} asc={asc} onSort={updateSort} />
        </span>
        <span className="white">DESCRIPTION</span>
      </div>

      <div id="collyList">
        {error && <div className="row apt-1"><div className="col" style={{ color: "#ff5555" }}>Failed to load — please try again.</div></div>}
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((colly) =>
            viewMode === 1 ? (
              <div key={colly.id} className="row mb-4 mb-sm-0">
                <div className="col-md-7 text-truncate">
                  <ContentLink className="magenta" href={colly.url}>
                    {colly.name}
                  </ContentLink>
                </div>
                <div className="col text-truncate">
                  <ContentLink className="magenta" href={colly.url}>
                    {colly.filename}
                  </ContentLink>
                </div>
                <div className="col green text-truncate">
                  {(colly.artists ?? "").split(",").filter(Boolean).map((a, i) => (
                    <span key={a}>{i > 0 && ","}<ContentLink className="yellow" href={`/artist/${urlsafe(a.trim())}`}>{a.trim()}</ContentLink></span>
                  ))}
                </div>
                <div className="col green text-truncate">
                  {(colly.crews ?? "").split(",").filter(Boolean).map((c, i) => (
                    <span key={c}>{i > 0 && ","}<ContentLink className="yellow" href={`/crew/${urlsafe(c.trim())}`}>{c.trim()}</ContentLink></span>
                  ))}
                </div>
                <div className="col text-truncate d-none d-md-block">{colly.cdate}</div>
              </div>
            ) : (
              <div key={colly.id} className="row apt-1 text-center text-md-start">
                <span className="col-2">
                  <ContentLink className="cyan" href={colly.url}>
                    {colly.filename}
                  </ContentLink>
                </span>
                <span className="col-1 green">PF--</span>
                <span className="col-1 yellow">{colly.filesize}</span>
                <span className="col-2 yellow">{colly.cdate}</span>
                <div className="col-6 apb-1">
                  <span className="text-center text-md-start">
                    [ aSCIIaRENa ] [ FREE LEECH ] [ aSCIIaRENa ]
                  </span>
                </div>
              </div>
            )
          )}
        {loadingMore && <div className="row apt-1"><div className="col lightgrey">Loading...</div></div>}
        {!hasMore && allRows.length > 0 && <div className="row apt-1"><div className="col lightgrey">--- end of results ---</div></div>}
        <div ref={sentinelRef} style={{ height: "1px" }} />
      </div>
    </>
  );
}

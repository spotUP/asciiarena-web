"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { urlsafe } from "@/lib/utils";

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
  const router = useRouter();

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

  const pagesize = viewMode === 2 ? 6 : 120;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const syncUrl = useCallback((s: string, a: string, f: string, v: number) => {
    const params = new URLSearchParams();
    if (s !== initialSort) params.set("sort", s);
    if (a !== "A") params.set("asc", a);
    if (f) params.set("filter", f);
    if (v !== 1) params.set("view", String(v));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, initialSort]);

  useEffect(() => {
    syncUrl(sort, asc, filter, viewMode);
  }, [sort, asc, filter, viewMode, syncUrl]);

  // Effect 1: reset list when sort/filter/viewMode changes
  useEffect(() => {
    setAllRows([]);
    setPage(1);
    setHasMore(true);
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
        if (!cancelled) { setLoading(false); setLoadingMore(false); }
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

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <>
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1">
          <div className="btn-group">
            <button
              className="btn btn-primary dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              View Mode:
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
          <button className="sort-btn" onClick={() => updateSort("name")}>NAME</button>
        </div>
        <div className="col text-truncate">
          <button className="sort-btn" onClick={() => updateSort("filename")}>FILENAME</button>
        </div>
        <div className="col white text-truncate">
          <button className="sort-btn" onClick={() => updateSort("artists")}>ARTiST</button>
        </div>
        <div className="col white text-truncate">
          <button className="sort-btn" onClick={() => updateSort("crews")}>CREW</button>
        </div>
        <div className="col text-truncate d-none d-md-block">
          <button className="sort-btn" onClick={() => updateSort("cdate")}>DATE</button>
        </div>
      </div>

      <div
        id="hdrcols2"
        className="row amb-1"
        style={viewMode === 1 ? { display: "none" } : {}}
      >
        <span className="col-2 white">
          <button className="sort-btn" onClick={() => updateSort("filename")}>FILENAME</button>
        </span>
        <span className="col-1 white">FLAGS</span>
        <span className="col-1 white">
          <button className="sort-btn" onClick={() => updateSort("filesize")}>FILESIZE</button>
        </span>
        <span className="col-2 white">
          <button className="sort-btn" onClick={() => updateSort("cdate")}>DATE</button>
        </span>
        <span className="white">DESCRIPTION</span>
      </div>

      <div id="collyList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          allRows.map((colly) =>
            viewMode === 1 ? (
              <div key={colly.id} className="row mb-4 mb-sm-0">
                <div className="col-md-7 text-truncate">
                  <Link className="magenta" href={colly.url}>
                    {colly.name}
                  </Link>
                </div>
                <div className="col text-truncate">
                  <Link className="magenta" href={colly.url}>
                    {colly.filename}
                  </Link>
                </div>
                <div className="col green text-truncate">
                  {(colly.artists ?? "").split(",").filter(Boolean).map((a, i) => (
                    <span key={a}>{i > 0 && ","}<Link className="yellow" href={`/artist/${urlsafe(a.trim())}`}>{a.trim()}</Link></span>
                  ))}
                </div>
                <div className="col green text-truncate">
                  {(colly.crews ?? "").split(",").filter(Boolean).map((c, i) => (
                    <span key={c}>{i > 0 && ","}<Link className="yellow" href={`/crew/${urlsafe(c.trim())}`}>{c.trim()}</Link></span>
                  ))}
                </div>
                <div className="col text-truncate d-none d-md-block">{colly.cdate}</div>
              </div>
            ) : (
              <div key={colly.id} className="row apt-1 text-center text-md-start">
                <span className="col-2">
                  <Link className="cyan" href={colly.url}>
                    {colly.filename}
                  </Link>
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

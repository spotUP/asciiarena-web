"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import NewItemsPill from "@/components/ui/NewItemsPill";
import SortHeader from "@/components/ui/SortHeader";

interface RequestRow {
  id: number;
  title: string | null;
  status: number | null;
  time: string;
  user: string | null;
  url: string;
  total_count: number;
}

const PAGE_SIZE = 120;

const STATUS_LABELS: Record<number, string> = {
  0: "Open",
  1: "Closed (Unfulfilled)",
  2: "Closed (Fulfilled)",
};

const STATUS_BADGE: Record<number, string> = {
  0: "bg-primary",
  1: "bg-warning",
  2: "bg-success",
};

const VIEW_BUTTONS: { label: string; viewmode: number }[] = [
  { label: "Open", viewmode: 0 },
  { label: "Closed (Unfulfilled)", viewmode: 1 },
  { label: "Closed (Fulfilled)", viewmode: 2 },
  { label: "Closed (Any)", viewmode: 3 },
  { label: "All", viewmode: 4 },
];

export default function RequestsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "timestamp");
  const [asc, setAsc] = useState<"A" | "D">(() => searchParams.get("asc") === "A" ? "A" : "D");
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "");
  const [viewmode, setViewmode] = useState(() => parseInt(searchParams.get("viewmode") ?? "0") || 0);
  const [allRows, setAllRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const syncUrl = useCallback((s: string, a: string, f: string, v: number) => {
    const params = new URLSearchParams();
    if (s !== "timestamp") params.set("sort", s);
    if (a !== "D") params.set("asc", a);
    if (f) params.set("filter", f);
    if (v !== 0) params.set("viewmode", String(v));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router]);

  useEffect(() => {
    syncUrl(sort, asc, filter, viewmode);
  }, [sort, asc, filter, viewmode, syncUrl]);

  // Effect 1: reset list when sort/filter/viewmode changes
  useEffect(() => {
    setAllRows([]);
    setPage(1);
    setHasMore(true);
  }, [sort, asc, filter, viewmode]);

  // Effect 2: fetch current page
  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    (async () => {
      try {
        const rows: RequestRow[] = await (await fetch(`/api/requests?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}&viewmode=${viewmode}`)).json();
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
  }, [page, sort, asc, filter, viewmode]);

  // Effect 2b: live status changes from any admin/owner action
  useEffect(() => {
    const es = new EventSource("/api/live?channel=site:status");
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as { type?: string; id?: number; status?: number };
        if (evt.type === "request-status" && typeof evt.id === "number" && typeof evt.status === "number") {
          setAllRows(prev => prev.map(r => r.id === evt.id ? { ...r, status: evt.status ?? r.status } : r));
        }
      } catch {}
    };
    return () => es.close();
  }, []);

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

  function handleViewmode(v: number) {
    setViewmode(v);
  }

  return (
    <>
      <NewItemsPill
        channel="site:requests"
        onReset={() => { setAllRows([]); setPage(1); setHasMore(true); }}
      />
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary w-100">
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

      <div className="apt-1 apb-1">
        <div className="btn-group" role="group" aria-label="Filter by status">
          {VIEW_BUTTONS.map(({ label, viewmode: v }) => (
            <button
              key={v}
              type="button"
              className={`btn btn-primary${viewmode === v ? " active" : ""}`}
              onClick={() => handleViewmode(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="row amb-1">
        <div className="col-3">
          <SortHeader col="title" label="Title" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col-3">
          <SortHeader col="status" label="Status" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
        <div className="col-3">
          <span className="white">Requested By</span>
        </div>
        <div className="col-3">
          <SortHeader col="timestamp" label="Date" sortKey={sort} asc={asc} onSort={updateSort} />
        </div>
      </div>

      <div id="requestsList">
        {loading && (
          <div className="row apt-1">
            <div className="col">Loading...</div>
          </div>
        )}
        {!loading &&
          allRows.map((req) => (
            <div key={req.id} className="row amb-1">
              <div className="col-3 text-truncate">
                <Link className="magenta" href={req.url}>
                  {req.title}
                </Link>
              </div>
              <div className="col-3 text-truncate">
                <span
                  className={`badge ${STATUS_BADGE[req.status ?? 0] ?? "bg-secondary"}`}
                >
                  {STATUS_LABELS[req.status ?? 0] ?? "Unknown"}
                </span>
              </div>
              <div className="col-3 text-truncate">
                <span className="grey small">{req.user}</span>
              </div>
              <div className="col-3 text-truncate">
                <span className="grey small">{req.time}</span>
              </div>
            </div>
          ))}
        {loadingMore && <div className="row apt-1"><div className="col lightgrey">Loading...</div></div>}
        {!hasMore && allRows.length > 0 && <div className="row apt-1"><div className="col lightgrey">--- end of results ---</div></div>}
        <div ref={sentinelRef} style={{ height: "1px" }} />
      </div>

      <div className="apt-1">
        <Link href="/submit#request">
          <input type="submit" className="btn-big" value="Add Request" readOnly />
        </Link>
      </div>
    </>
  );
}

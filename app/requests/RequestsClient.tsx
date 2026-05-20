"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Paginator from "@/components/ui/Paginator";

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

  const [page, setPage] = useState(() => parseInt(searchParams.get("page") ?? "1") || 1);
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "timestamp");
  const [asc, setAsc] = useState<"A" | "D">(() => searchParams.get("asc") === "A" ? "A" : "D");
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "");
  const [viewmode, setViewmode] = useState(() => parseInt(searchParams.get("viewmode") ?? "0") || 0);
  const [data, setData] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const syncUrl = useCallback((p: number, s: string, a: string, f: string, v: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (s !== "timestamp") params.set("sort", s);
    if (a !== "D") params.set("asc", a);
    if (f) params.set("filter", f);
    if (v !== 0) params.set("viewmode", String(v));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router]);

  useEffect(() => {
    syncUrl(page, sort, asc, filter, viewmode);
  }, [page, sort, asc, filter, viewmode, syncUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows: RequestRow[] = await (await fetch(`/api/requests?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}&viewmode=${viewmode}`)).json();
        if (!cancelled) { setData(rows); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, sort, asc, filter, viewmode]);

  function updateSort(newSort: string) {
    const newAsc = sort === newSort ? (asc === "A" ? "D" : "A") : "A";
    setSort(newSort);
    setAsc(newAsc);
    setPage(1);
  }

  function handleViewmode(v: number) {
    setViewmode(v);
    setPage(1);
  }

  const totalCount = data[0]?.total_count ?? 0;
  const maxPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <Paginator
        page={page}
        maxPage={maxPage}
        onFirst={() => setPage(1)}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        onLast={() => setPage(maxPage)}
        onFilter={(v) => {
          setFilter(v);
          setPage(1);
        }}
        filterValue={filter}
      />

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
          <a
            className="white"
            onClick={() => updateSort("title")}
            style={{ cursor: "pointer" }}
          >
            Title
          </a>
        </div>
        <div className="col-3">
          <a
            className="white"
            onClick={() => updateSort("status")}
            style={{ cursor: "pointer" }}
          >
            Status
          </a>
        </div>
        <div className="col-3">
          <span className="white">Requested By</span>
        </div>
        <div className="col-3">
          <a
            className="white"
            onClick={() => updateSort("timestamp")}
            style={{ cursor: "pointer" }}
          >
            Date
          </a>
        </div>
      </div>

      <div id="requestsList">
        {loading && (
          <div className="row apt-1">
            <div className="col">Loading...</div>
          </div>
        )}
        {!loading &&
          data.map((req) => (
            <div key={req.id} className="row amb-1">
              <div className="col-3 text-truncate">
                <a className="magenta" href={req.url}>
                  {req.title}
                </a>
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
      </div>

      <div className="apt-1">
        <a href="/submit#request">
          <input type="submit" className="btn-big" value="Add Request" readOnly />
        </a>
      </div>
    </>
  );
}

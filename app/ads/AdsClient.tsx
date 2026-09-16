"use client";

import React, { useEffect, useState, useRef } from "react";
import ContentLink from "@/components/ui/ContentLink";
import AdArt from "@/components/ui/AdArt";

interface AdRow {
  url: string;
  id: number;
  bbs_id: number;
  bbs_name: string | null;
  filename: string | null;
  filesize: number | null;
  content: string | null;
  is_ansi: number | null;
  nodes: number | null;
  total_count: number;
}

interface AdsClientProps {
  initialQ: string;
  initialCrew: string;
  initialBbsId: string;
  crewList: string[];
}

const PAGE_SIZE = 20;

export default function AdsClient({ initialQ, initialCrew, initialBbsId, crewList }: AdsClientProps) {
  const [q, setQ] = useState(initialQ);
  const [crew, setCrew] = useState(initialCrew);
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllRows([]);
    setPage(1);
    setHasMore(true);
  }, [q, crew]);

  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pagesize: String(PAGE_SIZE),
          q,
          crew,
          bbs_id: initialBbsId,
        });
        const rows: AdRow[] = await (await fetch(`/api/bbs-ads?${params}`)).json();
        if (!cancelled) {
          const total = rows[0]?.total_count ?? 0;
          setAllRows((prev) => (page === 1 ? rows : [...prev, ...rows]));
          setHasMore(rows.length > 0 && page * PAGE_SIZE < total);
          setLoading(false);
          setLoadingMore(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, q, crew, initialBbsId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  return (
    <>
      <div className="row">
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary w-100">
            <input
              id="filter"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-1 w-100 search-field"
              placeholder="Search ads..."
              type="text"
            />
          </div>
        </div>
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary w-100">
            <select
              value={crew}
              onChange={(e) => setCrew(e.target.value)}
              className="pl-1 w-100 search-field"
            >
              <option value="">All groups</option>
              {crewList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading && (
        <div className="row">
          <div className="col-12">Loading...</div>
        </div>
      )}
      {!loading &&
        allRows.map((row) => (
          <div className="row apb-1" key={row.id}>
            <div className="col-lg-12">
              <div className="apb-1">
                <ContentLink href={row.url}>{row.filename}</ContentLink>
                {" on "}
                <ContentLink href={`/bbs/${row.bbs_id}`}>{row.bbs_name}</ContentLink>
                {row.nodes != null ? ` - ${row.nodes} nodes` : ""}
              </div>
              <AdArt lines={(row.content ?? "").split("\n")} />
            </div>
          </div>
        ))}
      {!loading && allRows.length === 0 && (
        <div className="row">
          <div className="col-12">No ads found.</div>
        </div>
      )}
      {loadingMore && (
        <div className="row">
          <div className="col-12">Loading...</div>
        </div>
      )}
      <div ref={sentinelRef} />
    </>
  );
}

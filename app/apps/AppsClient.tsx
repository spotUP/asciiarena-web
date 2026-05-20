"use client";

import React, { useEffect, useState } from "react";
import Paginator from "@/components/ui/Paginator";

interface AppRow {
  url: string;
  id: number;
  name: string | null;
  filesize: number | null;
  filename: string | null;
  author: string | null;
  timestamp: string | null;
  total_count: number;
}

interface AppsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function AppsClient({ initialSort, initialOrder }: AppsClientProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [asc, setAsc] = useState<"A" | "D">(initialOrder === "D" ? "D" : "A");
  const [filter, setFilter] = useState("");
  const [data, setData] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/apps?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`
    )
      .then((r) => r.json())
      .then((rows: AppRow[]) => {
        if (!cancelled) {
          setData(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sort, asc, filter]);

  function updateSort(newSort: string) {
    const newAsc = sort === newSort ? (asc === "A" ? "D" : "A") : "A";
    setSort(newSort);
    setAsc(newAsc);
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

      <div className="row amb-1">
        <div className="col-3 white">
          <a onClick={() => updateSort("name")} style={{ cursor: "pointer" }}>
            NAME
          </a>
        </div>
        <div className="col-3 white">
          <a onClick={() => updateSort("filename")} style={{ cursor: "pointer" }}>
            FILENAME
          </a>
        </div>
        <div className="col-3 white">
          <a onClick={() => updateSort("author")} style={{ cursor: "pointer" }}>
            AUTHOR
          </a>
        </div>
        <div className="col-3 white">
          <a onClick={() => updateSort("timestamp")} style={{ cursor: "pointer" }}>
            DATE
          </a>
        </div>
      </div>

      <div id="appList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          data.map((app) => (
            <div key={app.id} className="row">
              <div className="col-3 text-truncate">
                <a href={app.url}>{app.name}</a>
              </div>
              <div className="col-3 text-truncate">
                <a href={app.url}>{app.filename}</a>
              </div>
              <div className="col-3 text-truncate">{app.author}</div>
              <div className="col-3 text-truncate">{app.timestamp}</div>
            </div>
          ))}
      </div>
    </>
  );
}

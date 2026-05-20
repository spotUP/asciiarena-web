"use client";

import React, { useEffect, useState } from "react";
import Paginator from "@/components/ui/Paginator";

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
  const [data, setData] = useState<MagRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/mags?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`
    )
      .then((r) => r.json())
      .then((rows: MagRow[]) => {
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

      <div id="magList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          data.map((mag) => (
            <div key={mag.id} className="row">
              <div className="col-3 text-truncate">
                <a href={mag.url}>{mag.name}</a>
              </div>
              <div className="col-3 text-truncate">
                <a href={mag.url}>{mag.filename}</a>
              </div>
              <div className="col-3 text-truncate">{mag.author}</div>
              <div className="col-3 text-truncate">{mag.timestamp}</div>
            </div>
          ))}
      </div>
    </>
  );
}

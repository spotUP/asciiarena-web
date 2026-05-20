"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Paginator from "@/components/ui/Paginator";
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

  const [page, setPage] = useState(() => parseInt(searchParams.get("page") ?? "1") || 1);
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? initialSort);
  const [asc, setAsc] = useState<"A" | "D">(() => (searchParams.get("asc") ?? initialOrder) === "D" ? "D" : "A");
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "");
  const [viewMode, setViewMode] = useState<1 | 2>(() => {
    const v = parseInt(searchParams.get("view") ?? "1");
    return v === 2 ? 2 : 1;
  });
  const [data, setData] = useState<CollyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const pagesize = viewMode === 2 ? 6 : 120;

  const syncUrl = useCallback((p: number, s: string, a: string, f: string, v: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (s !== initialSort) params.set("sort", s);
    if (a !== "A") params.set("asc", a);
    if (f) params.set("filter", f);
    if (v !== 1) params.set("view", String(v));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, initialSort]);

  useEffect(() => {
    syncUrl(page, sort, asc, filter, viewMode);
  }, [page, sort, asc, filter, viewMode, syncUrl]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/collys?page=${page}&sort=${sort}&asc=${asc}&pagesize=${pagesize}&filter=${encodeURIComponent(filter)}`
    )
      .then((r) => r.json())
      .then((rows: CollyRow[]) => {
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
  }, [page, sort, asc, filter, pagesize]);

  function updateSort(newSort: string) {
    const newAsc = sort === newSort ? (asc === "A" ? "D" : "A") : "A";
    setSort(newSort);
    setAsc(newAsc);
    setPage(1);
  }

  function handleViewMode(v: number) {
    setViewMode(v as 1 | 2);
    setPage(1);
  }

  const totalCount = data[0]?.total_count ?? 0;
  const maxPage = Math.max(1, Math.ceil(totalCount / pagesize));

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

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
        viewMode={viewMode}
        onViewMode={handleViewMode}
      />

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
          <a onClick={() => updateSort("name")} style={{ cursor: "pointer" }}>
            NAME
          </a>
        </div>
        <div className="col text-truncate">
          <a onClick={() => updateSort("filename")} style={{ cursor: "pointer" }}>
            FILENAME
          </a>
        </div>
        <div className="col white text-truncate">
          <a onClick={() => updateSort("artists")} style={{ cursor: "pointer" }}>
            ARTiST
          </a>
        </div>
        <div className="col white text-truncate">
          <a onClick={() => updateSort("crews")} style={{ cursor: "pointer" }}>
            CREW
          </a>
        </div>
        <div className="col text-truncate d-none d-md-block">
          <a onClick={() => updateSort("cdate")} style={{ cursor: "pointer" }}>
            DATE
          </a>
        </div>
      </div>

      <div
        id="hdrcols2"
        className="row amb-1"
        style={viewMode === 1 ? { display: "none" } : {}}
      >
        <span className="col-2 white">
          <a onClick={() => updateSort("filename")} style={{ cursor: "pointer" }}>
            FILENAME
          </a>
        </span>
        <span className="col-1 white">FLAGS</span>
        <span className="col-1 white">
          <a onClick={() => updateSort("filesize")} style={{ cursor: "pointer" }}>
            FILESIZE
          </a>
        </span>
        <span className="col-2 white">
          <a onClick={() => updateSort("cdate")} style={{ cursor: "pointer" }}>
            DATE
          </a>
        </span>
        <span className="white">DESCRIPTION</span>
      </div>

      <div id="collyList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          data.map((colly) =>
            viewMode === 1 ? (
              <div key={colly.id} className="row mb-4 mb-sm-0">
                <div className="col-md-7 text-truncate">
                  <a className="magenta" href={colly.url}>
                    {colly.name}
                  </a>
                </div>
                <div className="col text-truncate">
                  <a className="magenta" href={colly.url}>
                    {colly.filename}
                  </a>
                </div>
                <div className="col green text-truncate">
                  {(colly.artists ?? "").split(",").filter(Boolean).map((a, i) => (
                    <span key={a}>{i > 0 && ","}<a className="yellow" href={`/artist/${urlsafe(a.trim())}`}>{a.trim()}</a></span>
                  ))}
                </div>
                <div className="col green text-truncate">
                  {(colly.crews ?? "").split(",").filter(Boolean).map((c, i) => (
                    <span key={c}>{i > 0 && ","}<a className="yellow" href={`/crew/${urlsafe(c.trim())}`}>{c.trim()}</a></span>
                  ))}
                </div>
                <div className="col text-truncate d-none d-md-block">{colly.cdate}</div>
              </div>
            ) : (
              <div key={colly.id} className="row apt-1 text-center text-md-start">
                <span className="col-2">
                  <a className="cyan" href={colly.url}>
                    {colly.filename}
                  </a>
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
      </div>
    </>
  );
}

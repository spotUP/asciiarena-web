"use client";

import React, { useEffect, useState } from "react";
import Paginator from "@/components/ui/Paginator";

interface CrewRow {
  url: string;
  id: number;
  name: string | null;
  acronym: string | null;
  members_cnt: number;
  releases_cnt: number;
  rating: number | null;
  total_count: number;
}

interface CrewsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function CrewsClient({ initialSort, initialOrder }: CrewsClientProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [asc, setAsc] = useState<"A" | "D">(initialOrder === "D" ? "D" : "A");
  const [filter, setFilter] = useState("");
  const [data, setData] = useState<CrewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows: CrewRow[] = await (await fetch(`/api/crews?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`)).json();
        if (!cancelled) { setData(rows); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
        <div className="col-4 white">
          <a onClick={() => updateSort("name")} style={{ cursor: "pointer" }}>
            CREW
          </a>
        </div>
        <div className="col-2 white">
          <a onClick={() => updateSort("members_cnt")} style={{ cursor: "pointer" }}>
            MEMBERS
          </a>
        </div>
        <div className="col-2 white">
          <a onClick={() => updateSort("releases_cnt")} style={{ cursor: "pointer" }}>
            RELEASES
          </a>
        </div>
        <div className="col-2 white">
          <a onClick={() => updateSort("rating")} style={{ cursor: "pointer" }}>
            RATING
          </a>
        </div>
      </div>

      <div id="crewList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          data.map((crew) => (
            <div key={crew.id} className="row">
              <div className="col-4">
                <a href={crew.url}>{crew.name}</a>{" "}
                {crew.acronym && <span className="grey">({crew.acronym})</span>}
              </div>
              <div className="col-2">{crew.members_cnt}</div>
              <div className="col-2">{crew.releases_cnt}</div>
              <div className="col-2">{crew.rating ?? "-"}</div>
            </div>
          ))}
      </div>
    </>
  );
}

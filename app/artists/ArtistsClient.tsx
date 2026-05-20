"use client";

import React, { useEffect, useState } from "react";
import Paginator from "@/components/ui/Paginator";

interface ArtistRow {
  url: string;
  id: number;
  nick: string;
  crews: string;
  total_count: number;
}

interface ArtistsClientProps {
  initialSort: string;
  initialOrder: string;
}

const PAGE_SIZE = 120;

export default function ArtistsClient({ initialSort, initialOrder }: ArtistsClientProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [asc, setAsc] = useState<"A" | "D">(initialOrder === "D" ? "D" : "A");
  const [filter, setFilter] = useState("");
  const [data, setData] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/artists?page=${page}&sort=${sort}&asc=${asc}&pagesize=${PAGE_SIZE}&filter=${encodeURIComponent(filter)}`
    )
      .then((r) => r.json())
      .then((rows: ArtistRow[]) => {
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
        <div className="col-2">
          <a className="white" onClick={() => updateSort("nick")} style={{ cursor: "pointer" }}>
            ARTiST
          </a>
        </div>
        <div className="col-10">
          <a className="white" onClick={() => updateSort("crews")} style={{ cursor: "pointer" }}>
            CREW
          </a>
        </div>
      </div>

      <div id="artistList">
        {loading && <div className="row apt-1"><div className="col">Loading...</div></div>}
        {!loading &&
          data.map((artist) => (
            <div key={artist.id} className="row">
              <div className="forum_nick col-2">
                <a href={artist.url}>{artist.nick}</a>
              </div>
              <div
                className="artist_crew col-10"
                dangerouslySetInnerHTML={{ __html: artist.crews ?? "" }}
              />
            </div>
          ))}
      </div>
    </>
  );
}

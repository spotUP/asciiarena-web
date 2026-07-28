"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Paginator from "@/components/ui/Paginator";

interface Props {
  page: number;
  maxPage: number;
  basePath: string;
  /** Extra query params to preserve across paging (sort, order, filter). */
  params?: Record<string, string | undefined>;
  /** Show the search box. Only the topic list wants it. */
  filterValue?: string;
}

/**
 * Paginator wired to real URLs.
 *
 * basePath is always explicit: a bare router.push("?") resolves to the root
 * route in the App Router and silently kills every subsequent Link click
 * (RULES.md).
 */
export default function ForumPaginator({ page, maxPage, basePath, params = {}, filterValue }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState(filterValue ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setFilter(filterValue ?? ""), [filterValue]);

  const urlFor = (next: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...next })) {
      if (v != null && v !== "") qs.set(k, v);
    }
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const goto = (p: number) => router.push(urlFor({ page: String(Math.min(Math.max(1, p), maxPage)) }));

  return (
    <Paginator
      page={page}
      maxPage={maxPage}
      onFirst={() => goto(1)}
      onPrev={() => goto(page - 1)}
      onNext={() => goto(page + 1)}
      onLast={() => goto(maxPage)}
      filterValue={filterValue === undefined ? undefined : filter}
      onFilter={
        filterValue === undefined
          ? undefined
          : (v: string) => {
              setFilter(v);
              if (debounce.current) clearTimeout(debounce.current);
              // A filter change resets to page 1: staying on page 7 of a
              // narrower result set shows an empty list.
              debounce.current = setTimeout(() => router.replace(urlFor({ filter: v, page: "1" })), 300);
            }
      }
    />
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { urlsafe } from "@/lib/utils";
import PrintLines from "@/components/ui/PrintLines";

interface CommentRow { filename: string; nick: string; comment: string }

function load(set: (rows: CommentRow[]) => void) {
  fetch("/api/comments/latest")
    .then(r => r.json())
    .then((d: unknown) => { if (Array.isArray(d)) set(d as CommentRow[]); })
    .catch(() => {});
}

export default function LatestComments() {
  const [rows, setRows] = useState<CommentRow[]>([]);

  useEffect(() => {
    load(setRows);
    const es = new EventSource("/api/live?channel=site:comments");
    es.onmessage = () => load(setRows);
    return () => es.close();
  }, []);

  if (!rows.length) return null;

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header w-100 col-12">
        <h2 className="ap-1 am-0 bg-header">LATEST COMMENTS</h2>
      </div>
      <div className="col-12 bg-secondary apb-1" style={{ paddingLeft: "8px" }}>
        <div className="row">
          <div className="col-6 col-sm-7 text-truncate apb-1 apt-1">
            <span className="white">COMMENT</span>
          </div>
          <div className="col-sm-3 text-truncate d-none d-sm-block apt-1">
            <span className="white">COLLY</span>
          </div>
          <div className="col-6 col-sm-2 text-truncate apt-1">
            <span className="white float-right">NiCK</span>
          </div>
        </div>
        <PrintLines>
        {rows.map((row, i) => (
          <div className="row" key={i}>
            <div className="col-sm-7 cyan text-truncate">
              <Link prefetch={false} className="cyan" href={`/release/${row.filename}`}>{row.comment}</Link>
            </div>
            <div className="col-6 col-sm-3 mb-4 mb-sm-0 text-truncate">
              <Link prefetch={false} className="magenta text-truncate" href={`/release/${row.filename}`}>{row.filename}</Link>
            </div>
            <div className="col-6 col-sm-2 mb-4 mb-sm-0 text-truncate">
              <Link prefetch={false} className="yellow text-truncate float-right" href={`/member/${urlsafe(row.nick)}`}>{row.nick}</Link>
            </div>
          </div>
        ))}
        </PrintLines>
      </div>
    </div>
  );
}

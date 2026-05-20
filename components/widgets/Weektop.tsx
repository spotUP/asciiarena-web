"use client";

import { useEffect, useId } from "react";

export default function Weektop() {
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const containerId = `weektop_${uid}`;
    const headerId = `weektophdr_${uid}`;

    function fetchWeektop() {
      fetch(
        "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=16&Count=5"
      )
        .then((r) => r.json())
        .then((data: { stats: Array<{ name: string; count: number }> }) => {
          const container = document.getElementById(containerId);
          if (!container) return;
          let html = "";
          data.stats.forEach((item) => {
            let cnt: number | string = item.count;
            let unit = "KB";
            if (cnt > 10485759) {
              cnt = (item.count / 1024 / 1024).toFixed(0);
              unit = "GB";
            } else if (cnt > 900000) {
              cnt = (item.count / 1024 / 1024).toFixed(2);
              unit = "GB";
            } else if (cnt > 10239) {
              cnt = (item.count / 1024).toFixed(0);
              unit = "MB";
            } else if (cnt > 900) {
              cnt = (item.count / 1024).toFixed(2);
              unit = "MB";
            }
            html += `<div class="col-lg-12 p-0 ps-lg-2 pe-lg-2 d-flex justify-content-between">`;
            html += `<a class="yellow text-truncate">${item.name}</a>`;
            html += `<span class="text-truncate">${cnt} ${unit}</span>`;
            html += `</div>`;
          });
          container.innerHTML = html;
        })
        .catch(() => {
          // external API failures are non-fatal
        });
    }

    fetchWeektop();
  }, [uid]);

  return (
    <div className="container fluid col-12 p-0 ps-lg-2 pe-lg-2">
      <div className="header col-lg-12 p-0 bg">
        <h2 id={`weektophdr_${uid}`} className="ap-1 bg-header">
          WEEKTOP - BBS UPLOADERS
        </h2>
      </div>
      <div className="container-fluid p-0 ps-lg-2 pe-lg-2 bg-secondary">
        <div
          className="row m-0 p-0 bg-secondary apb-1"
          id={`weektop_${uid}`}
        ></div>
      </div>
    </div>
  );
}

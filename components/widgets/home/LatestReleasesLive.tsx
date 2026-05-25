"use client";
import { useEffect, useState } from "react";

interface Release { url: string; content: string }

function load(set: (r: Release[]) => void) {
  fetch("/api/releases/latest")
    .then(r => r.json())
    .then((d: unknown) => { if (Array.isArray(d)) set(d as Release[]); })
    .catch(() => {});
}

export default function LatestReleasesLive({ columns = 2, header = "LATEST RELEASES" }: {
  columns?: number;
  header?: string;
}) {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    load(setReleases);
    const es = new EventSource("/api/live?channel=site:releases");
    es.onmessage = () => load(setReleases);
    return () => es.close();
  }, []);

  const colSize = Math.round(12 / columns);

  return (
    <div className="container-fluid m-0 p-0 apb-1">
      <div className="header w-100 col-12">
        <h2 className="ap-1 am-0 bg-header">{header}</h2>
      </div>
      <div className="row m-0 p-0">
        {releases.map(({ url, content }) => (
          <div
            key={url}
            className={`col-12 d-flex justify-content-center align-items-center col-xl-${colSize} overflow-hidden apt-1 apb-1`}
          >
            <div className="row animate__animated animate__backInUp">
              <pre>
                <a href={url} className="ascii magenta" dangerouslySetInnerHTML={{ __html: content }} />
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

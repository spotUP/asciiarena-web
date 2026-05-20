"use client";

import { useEffect, useState } from "react";

export type PageHeaderProps = {
  title: string | string[];
};

export default function PageHeader({ title }: PageHeaderProps) {
  const isArray = Array.isArray(title);
  const titles = isArray ? (title as string[]) : [title as string];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (titles.length < 2) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % titles.length), 2890);
    return () => clearInterval(id);
  }, [titles.length]);

  return (
    <div className="page-header">
      <div className="row ml-0 pl-0 mr-0 pr-0">
        <div className="col-12">
          <h1 className="bg-header ap-1" style={{ minHeight: "16px" }}>
            {titles[current]}
          </h1>
        </div>
      </div>
    </div>
  );
}

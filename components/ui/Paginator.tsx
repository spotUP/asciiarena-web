"use client";

import React from "react";

interface PaginatorProps {
  page: number;
  maxPage: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onFilter?: (v: string) => void;
  filterValue?: string;
  viewMode?: number; // 1=standard, 2=BBS - only for collys
  onViewMode?: (v: number) => void;
}

export default function Paginator({
  page,
  maxPage,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onFilter,
  filterValue,
  viewMode,
  onViewMode,
}: PaginatorProps) {
  return (
    <div className="row">
      <div className="row col-12 m-0 p-0 apt-1 pl-1">
        <ul className="pagination w-100">
          <li className="page-item">
            <button className="btn btn-primary" style={{ width: 50 }} onClick={onFirst}>
              &lt;&lt;
            </button>
          </li>
          <li className="page-item">
            <button className="btn btn-primary" style={{ width: 50 }} onClick={onPrev}>
              &lt;
            </button>
          </li>
          <span className="paginator w-100 apt-1">
            {page} of {maxPage}
          </span>
          <li className="page-item">
            <button className="btn btn-primary" style={{ width: 50 }} onClick={onNext}>
              &gt;
            </button>
          </li>
          <li className="page-item">
            <button className="btn btn-primary" style={{ width: 50 }} onClick={onLast}>
              &gt;&gt;
            </button>
          </li>
        </ul>
      </div>
      {viewMode !== undefined && (
        <div className="col-6 m-0 apt-1 apb-1">
          <div className="btn-group">
            <button
              className="btn btn-primary dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              View Mode: v
            </button>
            <div className="dropdown-menu">
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onViewMode?.(1);
                }}
              >
                Standard
              </a>
              <a
                className="dropdown-item"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onViewMode?.(2);
                }}
              >
                BBS
              </a>
            </div>
          </div>
        </div>
      )}
      {onFilter && (
        <div className="col-6 m-0 apt-1 apb-1 d-flex">
          <div className="bg-secondary apb-1 w-100">
            <input
              id="filter"
              value={filterValue ?? ""}
              onChange={(e) => onFilter(e.target.value)}
              className="pl-1 w-100"
              placeholder="Search..."
              type="text"
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </div>
  );
}

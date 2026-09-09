import { NextRequest, NextResponse } from "next/server";

// Shared helpers for the public read-only bot API (/api/v1/*).
//
// Conventions (chatbot-friendly):
// - Every list returns an envelope: { data: [...], meta: { page, per_page, total, total_pages } }
// - Pagination accepts page + per_page (aliases: pagesize, limit). Clamped to 1..100.
// - Search accepts q (aliases: filter, query).
// - Sort params are always whitelisted per route via safeSort().
// - All responses are public, cacheable GETs, no auth required.
// - Rate limited per IP (in-memory fixed window) — see rate-limit.ts.

export const V1_VERSION = "1.0.0";
export const V1_PER_PAGE_DEFAULT = 25;
export const V1_PER_PAGE_MAX = 100;

export interface V1Meta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export function v1Params(request: NextRequest): URLSearchParams {
  const nextUrl = (request as unknown as { nextUrl?: URL }).nextUrl;
  if (nextUrl) return nextUrl.searchParams;
  return new URL(request.url).searchParams;
}

export function parsePagination(sp: URLSearchParams): { page: number; perPage: number; offset: number } {
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const raw = sp.get("per_page") ?? sp.get("pagesize") ?? sp.get("limit") ?? String(V1_PER_PAGE_DEFAULT);
  const perPage = Math.min(Math.max(1, parseInt(raw, 10) || V1_PER_PAGE_DEFAULT), V1_PER_PAGE_MAX);
  return { page, perPage, offset: (page - 1) * perPage };
}

export function parseQuery(sp: URLSearchParams): string {
  return (sp.get("q") ?? sp.get("filter") ?? sp.get("query") ?? "").trim().slice(0, 200);
}

export function parseSort(sp: URLSearchParams, fallback: string): { sort: string; order: "ASC" | "DESC" } {
  const sort = (sp.get("sort") ?? fallback).trim();
  const o = (sp.get("order") ?? sp.get("asc") ?? "").trim().toLowerCase();
  // Accept order=asc|desc as well as the legacy UI convention asc=A (ascending).
  const order: "ASC" | "DESC" = o === "asc" || o === "a" ? "ASC" : "DESC";
  return { sort, order };
}

export function v1Envelope<T>(data: T[], page: number, perPage: number, total: number): { data: T[]; meta: V1Meta } {
  return {
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

export function v1Ok<T>(data: T[], page: number, perPage: number, total: number, extraHeaders?: HeadersInit): NextResponse {
  return NextResponse.json(v1Envelope(data, page, perPage, total), {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      ...extraHeaders,
    },
  });
}

export function v1One(data: unknown): NextResponse {
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

export function v1Error(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Slice a logo's ASCII lines out of a colly's decoded content_text.
// Mirrors lib/collyLogoGallery.ts sliceSnippet (preview window 11, cap 32 lines,
// trim surrounding blanks) so the API and the gallery never disagree.
const PREVIEW_WINDOW = 11;
const MAX_SNIPPET_LINES = 200;

export function sliceLogoText(content: string, start0: number, end0: number | null): string[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const start = Math.max(0, start0);
  const end = end0 != null && end0 >= start ? end0 : start + PREVIEW_WINDOW;
  const out = lines.slice(start, Math.min(end + 1, start + MAX_SNIPPET_LINES));
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

export function siteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://asciiarena.se").replace(/\/$/, "");
  return `${base}${path}`;
}

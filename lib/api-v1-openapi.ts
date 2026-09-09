import { V1_VERSION } from "@/lib/api-v1";

// OpenAPI 3.1 document for the public bot API. Served at /api/v1/openapi.
// Kept as a static object (no reflection) so bots get a stable contract.

function listProps(properties: Record<string, unknown>): unknown {
  return {
    type: "object",
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: { type: "object", properties } },
      meta: { $ref: "#/components/schemas/PageMeta" },
    },
  };
}

const PAGE_PARAMS: unknown[] = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "per_page", in: "query", description: "1-100, default 25 (aliases: pagesize, limit)", schema: { type: "integer", default: 25 } },
  { name: "q", in: "query", description: "Search text (aliases: filter, query)", schema: { type: "string" } },
];

export function buildOpenApi(): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: {
      title: "aSCIIaRENA public API",
      version: V1_VERSION,
      description:
        "Read-only public API for bots. No key required, 120 req/min per IP. " +
        "Lists return { data, meta: { page, per_page, total, total_pages } }. " +
        "Individual ASCII logos tagged inside collections live at /logos (search by artist/crew/label) " +
        "and /collys/:id/logos (all logos in one release, each with its text slice).",
    },
    servers: [{ url: "https://asciiarena.se" }],
    paths: {
      "/api/v1/status": { get: { summary: "Health + endpoint index", responses: { "200": { description: "OK" } } } },
      "/api/v1/stats": { get: { summary: "Archive totals", responses: { "200": { description: "OK" } } } },
      "/api/v1/search": {
        get: {
          summary: "Unified search (collys, logos, artists, crews)",
          parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/collys": {
        get: {
          summary: "List collections",
          parameters: [
            ...PAGE_PARAMS,
            { name: "artist", in: "query", schema: { type: "string" } },
            { name: "crew", in: "query", schema: { type: "string" } },
            { name: "year", in: "query", schema: { type: "integer" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["name", "filename", "date", "filesize", "rating", "views", "downloads"] } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/collys/{id}": {
        get: {
          summary: "Colly detail (id or filename)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/collys/{id}/logos": {
        get: {
          summary: "All tagged logos in one colly, each with ASCII text",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/collys/{id}/comments": {
        get: {
          summary: "Comments on one colly",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/collys/{id}/text": {
        get: {
          summary: "Full decoded plaintext of one colly",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/logos": {
        get: {
          summary: "Search tagged logos across all collys (e.g. all logos by an artist)",
          parameters: [
            ...PAGE_PARAMS,
            { name: "artist", in: "query", schema: { type: "string" } },
            { name: "crew", in: "query", schema: { type: "string" } },
            { name: "filename", in: "query", schema: { type: "string" } },
            { name: "artist_id", in: "query", schema: { type: "integer" } },
            { name: "crew_id", in: "query", schema: { type: "integer" } },
            { name: "colly_id", in: "query", schema: { type: "integer" } },
            { name: "manual", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/logos/{id}": {
        get: {
          summary: "One tagged logo with ASCII text",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/site-logos": {
        get: {
          summary: "List standalone logo-wall entries",
          parameters: [
            ...PAGE_PARAMS,
            { name: "author", in: "query", schema: { type: "string" } },
            { name: "kind", in: "query", schema: { type: "string", enum: ["ascii", "ansi"] } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/site-logos/{id}": {
        get: {
          summary: "One logo-wall entry with full text",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/artists": { get: { summary: "List artists (sort=nick|rating)", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/artists/{id}": {
        get: {
          summary: "Artist detail (id or nick)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/crews": { get: { summary: "List crews (sort=name|rating)", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/crews/{id}": {
        get: {
          summary: "Crew detail (id or name)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/mags": { get: { summary: "List mags", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/apps": { get: { summary: "List apps", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/bbs": { get: { summary: "List BBSes", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/requests": {
        get: {
          summary: "List requests",
          parameters: [...PAGE_PARAMS, { name: "status", in: "query", schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/requests/{id}": {
        get: {
          summary: "Request detail with comments",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/comments": {
        get: {
          summary: "Latest colly comments",
          parameters: [...PAGE_PARAMS, { name: "colly_id", in: "query", schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/tops": {
        get: {
          summary: "Leaderboards: top uploaders, commenters, taggers",
          parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 5 } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/news": { get: { summary: "Published site news", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/news/{id}": {
        get: {
          summary: "One news item with body",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/polls": {
        get: {
          summary: "Open + closed polls",
          parameters: [...PAGE_PARAMS, { name: "status", in: "query", schema: { type: "string", enum: ["open", "closed"] } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/polls/{slug}": {
        get: {
          summary: "Poll with options + results (when public)",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/walls": { get: { summary: "Wall boards", parameters: PAGE_PARAMS, responses: { "200": { description: "OK" } } } },
      "/api/v1/walls/{id}": {
        get: {
          summary: "Wall with latest tags",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/online": { get: { summary: "Users online now", responses: { "200": { description: "OK" } } } },
      "/api/v1/new-users": { get: { summary: "Newest members", responses: { "200": { description: "OK" } } } },
      "/api/v1/last-callers": { get: { summary: "Recently active users", responses: { "200": { description: "OK" } } } },
      "/api/v1/forum": { get: { summary: "Latest public forum posts", responses: { "200": { description: "OK" } } } },
      "/api/v1/weektop": {
        get: {
          summary: "BBS weektop via cached upstream proxy",
          parameters: [{ name: "source", in: "query", schema: { type: "string", enum: ["uploaders", "bbs", "globalwall"] } }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/openapi": { get: { summary: "This OpenAPI document", responses: { "200": { description: "OK" } } } },
    },
    components: {
      schemas: {
        PageMeta: listProps({}),
      },
    },
  };
}

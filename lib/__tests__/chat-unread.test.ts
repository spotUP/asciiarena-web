import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { isOwnMessage, shouldCountAsUnread } from "@/lib/chatUnread";
import { unreadCountExpr } from "@/lib/chatUnreadSql";

const ME = 7;
const MY_NICK = "plur";

describe("shouldCountAsUnread", () => {
  it("does not count a message the viewer wrote themselves", () => {
    expect(shouldCountAsUnread({ fromId: ME, viewerId: ME, minimized: true })).toBe(false);
  });

  it("counts a message from somebody else on a minimized window", () => {
    expect(shouldCountAsUnread({ fromId: 42, viewerId: ME, minimized: true })).toBe(true);
  });

  it("counts an event with no author rather than dropping it", () => {
    expect(shouldCountAsUnread({ fromId: null, viewerId: ME, minimized: true })).toBe(true);
    expect(shouldCountAsUnread({ fromId: undefined, viewerId: ME, minimized: true })).toBe(true);
  });

  it("never counts anything while the window is open -- it marks read instead", () => {
    expect(shouldCountAsUnread({ fromId: 42, viewerId: ME, minimized: false })).toBe(false);
    expect(shouldCountAsUnread({ fromId: ME, viewerId: ME, minimized: false })).toBe(false);
  });
});

describe("isOwnMessage", () => {
  it("recognises a legacy row that names the viewer in postername", () => {
    expect(isOwnMessage({ fromId: null, postername: MY_NICK }, ME, MY_NICK)).toBe(true);
  });

  it("does not claim a legacy row written by somebody else", () => {
    expect(isOwnMessage({ fromId: null, postername: "Xray2000" }, ME, MY_NICK)).toBe(false);
    expect(isOwnMessage({ fromId: null, postername: null }, ME, MY_NICK)).toBe(false);
  });

  it("trusts from_id when it is present, whatever postername says", () => {
    expect(isOwnMessage({ fromId: ME, postername: "someoneelse" }, ME, MY_NICK)).toBe(true);
    expect(isOwnMessage({ fromId: 42, postername: MY_NICK }, ME, MY_NICK)).toBe(false);
  });

  it("claims nothing when the viewer has no nick, rather than matching empties", () => {
    expect(isOwnMessage({ fromId: null, postername: "" }, ME, "")).toBe(false);
  });
});

describe("unreadCountExpr", () => {
  const sql = unreadCountExpr(ME, MY_NICK);

  it("parameterises the viewer's id and nick -- no interpolated values", () => {
    expect(sql.values).toEqual([ME, MY_NICK]);
    expect(sql.sql).not.toContain(MY_NICK);
  });

  it("excludes the viewer's own legacy rows by nick, keeping everyone else's", () => {
    const text = sql.sql.replace(/\s+/g, " ");
    expect(text).toContain("um.from_id IS NOT NULL AND um.from_id <>");
    expect(text).toContain("um.from_id IS NULL AND (um.postername IS NULL OR um.postername <>");
  });

  it("still honours the participant's join and read cursors", () => {
    const text = sql.sql.replace(/\s+/g, " ");
    expect(text).toContain("um.timestamp >= cp.joined_at");
    expect(text).toContain("um.timestamp > cp.last_read_at");
  });
});

/**
 * The count is reported by two endpoints. They drifted apart once already, so
 * this fails if either one grows its own copy of the predicate again.
 */
describe("the unread predicate is not re-inlined", () => {
  const ROUTES = ["app/api/messages/route.ts", "app/api/messages/unread/route.ts"];

  it.each(ROUTES)("%s uses unreadCountExpr and no hand-written variant", route => {
    const src = readFileSync(route, "utf8");
    expect(src).toContain("unreadCountExpr");
    expect(src).not.toContain("um.from_id IS NULL OR um.from_id");
  });
});

describe("the badge and the inbox count the same thing", () => {
  /**
   * unreadCountExpr exists because two endpoints report unread -- the navbar
   * badge and the inbox list -- and a badge that disagrees with the list it
   * links to is worse than either number being wrong. Verified against the whole
   * production dataset on 2026-07-31: zero rows anywhere where a user's own
   * message counted toward their own unread, which is the bug the 07-28 fix
   * targeted, and 28 legacy from_id NULL rows confirming that branch is really
   * exercised rather than dead.
   *
   * This guards the structure that makes it hold: nobody hand-rolls the count.
   */
  function routeFilesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...routeFilesUnder(full));
      else if (entry === "route.ts") out.push(full);
    }
    return out;
  }

  const routes = routeFilesUnder(path.join(process.cwd(), "app/api"));

  it("scans a plausible number of routes", () => {
    expect(routes.length).toBeGreaterThan(20);
  });

  it("has no route computing unread without the shared expression", () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const src = readFileSync(file, "utf8");
      // A route that reads last_read_at is computing unread by hand unless it
      // is doing it through the shared definition.
      if (src.includes("last_read_at") && !src.includes("unreadCountExpr")) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

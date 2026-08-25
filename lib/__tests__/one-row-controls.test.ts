import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: search boxes came out three rows tall, and USERS ONLINE looked
 * like it had a blank line between every user.
 *
 * Both are the same rule. site.css pins every control to a 48px box:
 *
 *   input, optgroup { min-height: 48px; max-height: 48px; ... }
 *   button, select  { min-height: 48px; max-height: 48px; ... }
 *
 * 48px is three rows of the 8x16 grid. Right for a stand-alone field or a
 * .btn-big; wrong for a control that has to read as part of a line of text.
 * The [chat] button next to a nick set its whole row to 48px, which is the
 * "empty row" between users, and the modland search box was three rows tall
 * with its inline border stripped by the same rule's `border: 0 !important`.
 *
 * .search-field / .search-btn / .text-btn are that control on one 16px row.
 */

const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");

/** The declarations of the rule whose selector list STARTS with `selector`. */
function rule(selector: string): string {
  const re = new RegExp(`^${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}[^{]*\\{[^}]*\\}`, "m");
  return css.match(re)?.[0] ?? "";
}

describe("one-row controls", () => {
  it("undoes the 48px box the element rules impose", () => {
    // All three share the sizing block, so this is one assertion for all.
    const shared = rule(".search-field,");
    expect(shared).toMatch(/height:\s*16px;/);
    expect(shared).toMatch(/min-height:\s*0;/);
    expect(shared).toMatch(/max-height:\s*16px;/);
    expect(shared).toMatch(/line-height:\s*16px;/);
  });

  it("beats the padding and margin the element rule sets with !important", () => {
    // `input, optgroup` sets padding-left and margin-left !important, so a
    // plain declaration here would lose and the text would sit off-grid.
    const shared = rule(".search-field,");
    expect(shared).toMatch(/padding:\s*0 8px !important;/);
    expect(shared).toMatch(/margin:\s*0 !important;/);
  });

  it("keeps a text button transparent and unpadded", () => {
    // Its own rule, not the shared sizing block it also appears in -- which is
    // why this matches on the first declaration rather than on the selector.
    expect(css).toMatch(/\.text-btn \{\s*\n\s*background: none !important;[\s\S]*?padding: 0 !important;/);
  });
});

describe("the users online list", () => {
  const source = readFileSync(
    path.join(process.cwd(), "components/widgets/UsersOnlineLive.tsx"),
    "utf8",
  );

  it("puts each user on a single 16px row", () => {
    expect(source).toMatch(/height: "16px", lineHeight: "16px"/);
  });

  it("draws [chat] as a text button rather than a 48px control", () => {
    expect(source).toMatch(/className="lightgrey text-btn"/);
    // The inline style that tried, and failed, to shrink it.
    expect(source).not.toMatch(/background: "none", border: "none", cursor: "pointer", padding: 0/);
  });

  it("leaves exactly one blank row above the anonymous count", () => {
    // apt-1 is 16px -- one row -- and the 16px below it comes from
    // .widget-body's own padding, so the count is never flush to the edge.
    expect(source).toMatch(/className="col-lg-12 apt-1 p-0 pl-lg-2 pr-lg-2"/);
    expect(css).toMatch(/\.widget-body \{[^}]*padding:\s*16px 0;/);
  });
});

describe("search fields", () => {
  const FILES = [
    "app/crews/CrewsClient.tsx",
    "app/messages/MessagesClient.tsx",
    "app/playlists/PlaylistsClient.tsx",
    "app/collys/CollysClient.tsx",
    "app/admin/crews/CrewsClient.tsx",
    "app/admin/collys/CollysClient.tsx",
    "app/admin/content/ContentClient.tsx",
    "app/admin/requests/RequestsClient.tsx",
    "app/admin/users/UsersClient.tsx",
    "app/admin/artists/ArtistsClient.tsx",
    "app/admin/bbs/BbsClient.tsx",
    "app/requests/RequestsClient.tsx",
    "app/mags/MagsClient.tsx",
    "app/artists/ArtistsClient.tsx",
    "app/bbs/BBSClient.tsx",
    "app/apps/AppsClient.tsx",
    "components/ui/Paginator.tsx",
    "components/layout/SearchForm.tsx",
    "components/music/SoundtrackPicker.tsx",
    "components/widgets/MusicPlayer.tsx",
  ];

  for (const file of FILES) {
    it(`${file} draws its search box on one row`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).toMatch(/className="[^"]*search-field/);
    });
  }

  it("pairs the modland box with a button of the same height", () => {
    // A 16px field beside a 48px .btn-big reads as a mistake.
    const player = readFileSync(path.join(process.cwd(), "components/widgets/MusicPlayer.tsx"), "utf8");
    expect(player).toMatch(/className="search-btn"/);
    expect(player).not.toMatch(/style=\{btn\}/);
  });
});

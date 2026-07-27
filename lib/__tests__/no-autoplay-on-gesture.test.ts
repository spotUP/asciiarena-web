import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Regression: the site started playing music by itself. Two independent
// document-wide listeners did it -- the music provider resumed the previous
// tune on the first pointerdown anywhere, and the release page started the
// colly's soundtrack on the first pointerdown or keydown anywhere. Clicking a
// link, a button or the tagging panel was enough.
//
// Satisfying the browser's autoplay policy needs a user gesture; that is not
// the same as the reader wanting sound. The page stays silent until they press
// play or start a groove/autoplay run.

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

const provider = read("components/music/MusicProvider.tsx");
const release = read("app/release/[filename]/ReleaseClient.tsx");

/** Document- or window-level listeners for a user's first interaction. */
function gestureListeners(source: string): string[] {
  return source.match(/(document|window)\.addEventListener\(\s*"(pointerdown|click|keydown|touchstart|mousedown)"/g) ?? [];
}

describe("music never starts on its own", () => {
  it("the music provider registers no gesture listener at all", () => {
    expect(gestureListeners(provider)).toEqual([]);
  });

  it("the release page registers no gesture listener that could start audio", () => {
    // The page legitimately binds keydown for viewer shortcuts inside an
    // effect gated on the viewer being visible; what must not exist is a
    // document-level pointerdown/touchstart whose only job is to start sound.
    expect(provider).not.toMatch(/addEventListener\("pointerdown"/);
    expect(release).not.toMatch(/addEventListener\("pointerdown", start/);
    expect(release).not.toMatch(/addEventListener\("keydown", start/);
  });

  it("restores the previous tune without loading it", () => {
    // The tune reappears in the player; the module is loaded only when the
    // reader presses play.
    expect(provider).toMatch(/pendingResumeRef\.current = file/);
    // The mount effect must not call the loader itself.
    const mountEffect = provider.slice(provider.indexOf('sessionStorage.getItem("uade.resume")'));
    const upToEffectEnd = mountEffect.slice(0, mountEffect.indexOf("}, ["));
    expect(upToEffectEnd).not.toMatch(/tryLoad\(/);
  });

  it("loads the restored tune when the reader presses play", () => {
    const toggleBody = provider.slice(provider.indexOf("const toggle ="), provider.indexOf("const stop ="));
    expect(toggleBody).toMatch(/pendingResumeRef\.current/);
    expect(toggleBody).toMatch(/playFile\(pending\)/);
  });

  it("still starts the colly soundtrack from autoplay", () => {
    // The one path that MAY start sound without a play press, because the
    // reader explicitly started an autoplay run.
    expect(release).toMatch(/if \(soundtrack\) playSoundtrack\(\)/);
  });
});

describe("minimap hover hint", () => {
  const minimap = read("app/release/[filename]/LogoMinimap.tsx");
  const hint = minimap.slice(minimap.indexOf("{hover && ("));

  it("uses the site font rather than the browser's default monospace", () => {
    expect(hint).toMatch(/fontFamily: "inherit"/);
    expect(hint).not.toMatch(/fontFamily: "monospace"/);
  });

  it("sits on the 8x16 character grid", () => {
    expect(hint).toMatch(/fontSize: "16px"/);
    expect(hint).toMatch(/lineHeight: "16px"/);
    // No 12px text, no 2px/6px padding.
    expect(hint).not.toMatch(/fontSize: "12px"/);
    expect(hint).not.toMatch(/padding: "2px 6px"/);
  });
});

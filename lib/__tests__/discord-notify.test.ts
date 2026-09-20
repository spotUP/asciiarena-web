import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyDiscord } from "@/lib/utils";

/**
 * Reported 2026-09-20: the Discord new-release announcements are broken, and
 * have been for a long time.
 *
 * The cause was configuration -- DISCORD_UPLOAD_WEBHOOK was empty on the
 * server -- but the reason it went unnoticed for months is this function. It
 * wrapped the whole request in `catch {}`, so `fetch("")` threw, the
 * announcement vanished, and nothing was written anywhere. Every announcement
 * on the site goes through here: collys, mags, apps and requests.
 *
 * It still must not throw: an upload cannot fail because Discord is down. What
 * it must do is say so.
 */

const fetchMock = vi.fn();
let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  warn.mockRestore();
  error.mockRestore();
});

describe("notifyDiscord", () => {
  it("says so when no webhook is configured, and does not call fetch", async () => {
    // The exact production state: the variable exists but is empty.
    await notifyDiscord("", "A new ascii collection has just been uploaded");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no webhook configured"));
    // The dropped message is named, so the journal says WHAT was lost.
    expect(warn.mock.calls[0][0]).toContain("A new ascii collection");
  });

  it("reports a webhook that has been deleted or rotated", async () => {
    // 401/404 reads exactly like success unless somebody logs it.
    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    await notifyDiscord("https://discord.com/api/webhooks/1/abc", "hello");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("404"));
  });

  it("reports a request that never completed", async () => {
    fetchMock.mockRejectedValue(new Error("getaddrinfo ENOTFOUND discord.com"));
    await notifyDiscord("https://discord.com/api/webhooks/1/abc", "hello");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("ENOTFOUND"));
  });

  it("never throws, whatever happens -- an upload must not fail over this", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    await expect(notifyDiscord("https://discord.com/api/webhooks/1/abc", "x")).resolves.toBeUndefined();
    fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" });
    await expect(notifyDiscord("https://discord.com/api/webhooks/1/abc", "x")).resolves.toBeUndefined();
  });

  it("posts the announcement in the shape Discord expects", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: "No Content" });
    await notifyDiscord("https://discord.com/api/webhooks/1/abc", "a new colly");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://discord.com/api/webhooks/1/abc");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ username: "ASCII ARENA", content: "a new colly" });
    // Nothing to report when it worked.
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyRecaptcha } from "@/lib/recaptcha";

/**
 * The register page rendered a `g-recaptcha` div, never loaded Google's script,
 * and the API never looked for a token. There was no captcha at all -- only a
 * 3-per-hour IP rate limit, which rotating IPs walk straight through. Hence the
 * spam accounts reported 2026-09-20.
 *
 * This is the check that closes it. It fails CLOSED: a missing secret, a
 * Google outage or a malformed answer all refuse the registration, because
 * failing open would restore the hole and a briefly unavailable signup form is
 * the cheaper failure.
 */

const fetchMock = vi.fn();
let error: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  error = vi.spyOn(console, "error").mockImplementation(() => {});
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.RECAPTCHA_SECRET = "test-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
  error.mockRestore();
  warn.mockRestore();
  delete process.env.RECAPTCHA_SECRET;
});

describe("verifyRecaptcha", () => {
  it("accepts a token Google says is good", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await expect(verifyRecaptcha("tok", "1.2.3.4")).resolves.toEqual({ ok: true });
  });

  it("refuses a registration with no token at all", async () => {
    // A script posting straight at /api/register sends no token.
    const r = await verifyRecaptcha(undefined, "1.2.3.4");
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses when Google rejects the token", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["timeout-or-duplicate"] }),
    });
    const r = await verifyRecaptcha("stale", "1.2.3.4");
    expect(r.ok).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("timeout-or-duplicate"));
  });

  it("fails CLOSED when the secret is not configured", async () => {
    // The Discord webhooks were empty strings on the server for months. If that
    // happens here it must block signups loudly, not wave everyone through.
    delete process.env.RECAPTCHA_SECRET;
    const r = await verifyRecaptcha("tok", "1.2.3.4");
    expect(r.ok).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("RECAPTCHA_SECRET is not set"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails CLOSED when Google is unreachable or answers badly", async () => {
    fetchMock.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(verifyRecaptcha("tok", "1.2.3.4")).resolves.toMatchObject({ ok: false });
    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable" });
    await expect(verifyRecaptcha("tok", "1.2.3.4")).resolves.toMatchObject({ ok: false });
  });

  it("reads the secret per call, not at module load", async () => {
    // A module-level `process.env.X ?? ""` is how the Discord webhooks became
    // permanently empty; changing the env and restarting must be enough.
    process.env.RECAPTCHA_SECRET = "rotated-secret";
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await verifyRecaptcha("tok", "1.2.3.4");
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("rotated-secret");
  });

  it("sends the token and a real IP, and omits a placeholder one", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await verifyRecaptcha("tok", "1.2.3.4");
    let body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.2.3.4");

    fetchMock.mockClear();
    await verifyRecaptcha("tok", "unknown");
    body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("remoteip")).toBeNull();
  });
});

describe("the register endpoint", () => {
  it("verifies the captcha before it touches the database", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const route = readFileSync(
      path.join(process.cwd(), "app/api/register/route.ts"),
      "utf8",
    );
    const check = route.indexOf("verifyRecaptcha(");
    const firstQuery = route.indexOf("prisma.");
    expect(check).toBeGreaterThan(-1);
    expect(firstQuery).toBeGreaterThan(-1);
    expect(check).toBeLessThan(firstQuery);
  });

  it("asks the form to send a token", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const form = readFileSync(
      path.join(process.cwd(), "app/register/RegisterForm.tsx"),
      "utf8",
    );
    // The widget only exists if Google's script is on the page -- it was not.
    expect(form).toMatch(/recaptcha\/api\.js/);
    // The leaked key pair must not come back; it belongs to an account we do
    // not control and its secret is public.
    expect(form).not.toMatch(/6Le5rpQr/);
    expect(form).toMatch(/recaptchaToken: window\.grecaptcha\?\.getResponse\(\)/);
    // A token is single-use; a failed attempt has to reset the widget.
    expect(form).toMatch(/window\.grecaptcha\?\.reset\(\)/);
  });
});

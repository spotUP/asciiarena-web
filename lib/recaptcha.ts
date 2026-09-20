/**
 * Server-side reCAPTCHA verification for the registration form.
 *
 * The React site rendered a `g-recaptcha` div, never loaded Google's script,
 * and never checked a token: the widget did not exist and the register API
 * accepted anything that got past a 3-per-hour IP rate limit. Rotating IPs walk
 * straight through that, which is where the spam accounts came from.
 *
 * Two deliberate choices:
 *
 * - The secret is read HERE, per call, not at module load. A module-level
 *   `process.env.X ?? ""` is how the Discord webhooks silently became empty
 *   strings and stayed that way for months.
 * - It fails CLOSED. A missing secret, a Google outage or a malformed answer
 *   all refuse the registration. Failing open would leave exactly the hole this
 *   closes, and a registration form being briefly unavailable is the cheaper
 *   failure.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaResult {
  ok: boolean;
  /** Safe to show a user; the detail goes to the log, not the response. */
  error?: string;
}

export async function verifyRecaptcha(token: string | undefined, ip: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET ?? "";
  if (!secret) {
    console.error("[recaptcha] RECAPTCHA_SECRET is not set; refusing the registration");
    return { ok: false, error: "The captcha is not configured. Contact an administrator." };
  }
  if (!token) {
    return { ok: false, error: "Complete the captcha before registering." };
  }

  const body = new URLSearchParams({ secret, response: token });
  // The IP is advisory to Google and absent behind some proxies; send it only
  // when it is a real address rather than the "unknown" placeholder.
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      console.error(`[recaptcha] siteverify answered ${res.status} ${res.statusText}`);
      return { ok: false, error: "Could not check the captcha. Try again." };
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success === true) return { ok: true };

    const codes = (data["error-codes"] ?? []).join(", ");
    console.warn(`[recaptcha] rejected a registration: ${codes || "no reason given"}`);
    // "timeout-or-duplicate" is the common honest case: the widget was solved
    // too long ago, or the same token was replayed.
    return { ok: false, error: "Captcha check failed. Solve it again and retry." };
  } catch (err) {
    console.error(`[recaptcha] siteverify request failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, error: "Could not check the captcha. Try again." };
  }
}

import Script from "next/script";
import type { Session } from "next-auth";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";
import Navbar from "./Navbar";
import LogoHeader from "./LogoHeader";
import PageHeader from "./PageHeader";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import LiveRefresh from "@/components/widgets/LiveRefresh";
import ModemAnim from "./ModemAnim";
import { buildLogoHeaderRowsQuery } from "@/lib/logo-header-query";

export type SiteLayoutProps = {
  title?: string | string[];
  children: React.ReactNode;
};

export type SiteLogo =
  | { kind: "ascii"; ascii: string }
  | { kind: "ansi"; ansiB64: string; font: string | null };

const getLogos = unstable_cache(
  async (): Promise<SiteLogo[]> => {
    try {
      const rows = await prisma.$queryRaw<Array<{
        kind: string; ascii: string; ansi_b64: string | null; font: string | null;
      }>>(
        buildLogoHeaderRowsQuery()
      );
      return rows.flatMap((r): SiteLogo[] => {
        if (r.kind === "ansi") {
          // Drop ANSI rows with no payload so the header never renders a blank slot.
          return r.ansi_b64 ? [{ kind: "ansi", ansiB64: r.ansi_b64, font: r.font }] : [];
        }
        return [{ kind: "ascii", ascii: r.ascii }];
      });
    } catch {
      return [];
    }
  },
  ["logos"],
  // Busted via revalidateTag("site:logos") from app/api/admin/logos POST
  // and app/api/logos POST so freshly-submitted logos appear in rotation
  // without waiting up to 120s.
  { revalidate: 181, tags: ["site:logos"] }
);

export default async function SiteLayout({ title, children }: SiteLayoutProps) {
  const [rawSession, logos] = await Promise.all([
    auth().catch(() => null),
    getLogos(),
  ]);

  // auth() is overloaded; cast to the Session | null variant
  const session = rawSession as Session | null;

  // crt/anim come from the DB rather than the session JWT so that toggling
  // them in /settings takes effect on the next router.refresh (triggered by
  // the user:{id}:profile broadcast in LiveRefresh below) — JWT-cached
  // values would otherwise stick until next login.
  let crtEffect: string | null = null;
  let animEffect: string | null = null;
  if (session?.user?.id) {
    try {
      const row = await prisma.users.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { crt_effect: true, anim_effect: true },
      });
      crtEffect = row?.crt_effect ?? null;
      animEffect = row?.anim_effect ?? null;
    } catch { /* fall through to defaults */ }
  }
  // Both effects default to OFF. Anonymous users never see them; logged-in
  // users only see them when they have explicitly opted in (value === "Y").
  const showCrt = crtEffect === "Y";
  const showAnim = animEffect === "Y";

  return (
    <>
      {/* BBS-style modem redraw animation — runs on initial load and on
          every SPA navigation when enabled. Disabled = body shown directly. */}
      {!showAnim && (
        <script
          dangerouslySetInnerHTML={{
            __html: "document.body.style.visibility='visible';",
          }}
        />
      )}
      <ModemAnim enabled={showAnim} />

      {showCrt && <div className="scanlines"></div>}
      <div className="vignette"></div>

      <Navbar session={session} />
      {session?.user?.id && (
        <>
          <LiveRefresh channel={`user:${session.user.id}:widgets`} />
          <LiveRefresh channel={`user:${session.user.id}:profile`} />
        </>
      )}

      <div className="container-fluid mobile-bg">
        <div className="row logo-header-row" style={{ paddingTop: "58px", paddingBottom: "16px" }}>
          <div className="col-12 d-flex align-items-center justify-content-center m-0 p-0">
            <LogoHeader logos={logos} />
          </div>
        </div>

        {title && <PageHeader title={title} />}

        <div className="row m-0 p-0 amb-1">
          <div className="col-lg-12">
            <div className="bs-component aml-1 apl-1 apr-1 apt-1"></div>
          </div>
        </div>

        <div className="modal-body row m-0 p-0">
          <div className="col-lg-8 order-md-1 order-lg-2 order-xl-2">
            {children}
          </div>
          <div className="col-lg-2 order-md-2 order-lg-1 order-xl-1">
            <LeftSidebar />
          </div>
          <div className="col-lg-2 order-md-3 order-lg-3 order-xl-3">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Login modal — BS5 attributes, action posts to NextAuth credentials endpoint */}
      <div className="modal" id="login" tabIndex={-1} role="dialog" aria-hidden="true">
        <div className="modal-dialog animate__animated animate__backInLeft" role="document">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#444444" }}>
              <span className="modal-title">LOGiN</span>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body bg-primary">
              {!session?.user ? (
                <form action="/api/auth/callback/credentials" method="post" id="login-form">
                  <input type="hidden" name="csrfToken" value="" id="csrf-token" />
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-12 col-sm-6">
                        <div className="form-group">
                          <input type="text" className="form-control" name="login" id="login-nick" autoComplete="username" placeholder="Enter your handle" />
                        </div>
                        <div className="form-group">
                          <input type="password" name="password" id="login-password" className="form-control" autoComplete="current-password" placeholder="Prove it" />
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="form-group">
                          <div className="form-check form-switch lightgrey">
                            <input className="form-check-input" type="checkbox" id="rememberme" name="rememberme" value="1" defaultChecked />
                            <label className="form-check-label" htmlFor="rememberme">Remember me</label>
                          </div>
                        </div>
                        <a href="/register">Register</a> <span style={{ color: "#999999" }}>new account!</span><br /><br />
                        <a href="/reminder">Help!</a> <span style={{ color: "#999999" }}>forgot your password?</span>
                      </div>
                    </div>
                  </div>
                  <div id="login-results"></div>
                </form>
              ) : (
                <span>You&apos;re already logged in</span>
              )}
            </div>
            <div className="modal-footer bg-primary">
              <button type="button" className="btn-secondary bg-transparent amr-1 apr-1" data-bs-dismiss="modal">CLOSE</button>
              <button type="button" className="btn-secondary bg-transparent aml-1 apl-1" id="login-submit-btn">LOG iN</button>
            </div>
          </div>
        </div>
      </div>

      <Script id="site-init" strategy="afterInteractive">{`
        async function loginUser() {
          const nick = document.getElementById("login-nick").value;
          const pass = document.getElementById("login-password").value;
          const resultsEl = document.getElementById("login-results");
          function showError(msg) {
            if (resultsEl) {
              resultsEl.innerHTML = '<div class="alert alert-danger animate__animated animate__shakeX">' + msg + '</div>';
              setTimeout(function() { resultsEl.innerHTML = ""; }, 4000);
            }
          }
          try {
            const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
            if (!csrfRes.ok) { showError("csrf error " + csrfRes.status); return; }
            const { csrfToken } = await csrfRes.json();
            // POST credentials — use redirect:"manual" so we never follow the redirect
            // (NextAuth redirects to localhost:3001 behind this proxy, causing CORS/SSL errors).
            // Instead, check the session endpoint to determine success.
            await fetch("/api/auth/callback/credentials", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              credentials: "include",
              redirect: "manual",
              body: new URLSearchParams({ login: nick, password: pass, csrfToken }),
            }).catch(function() {});
            const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
            const session = sessionRes.ok ? await sessionRes.json().catch(function() { return null; }) : null;
            if (!session || !session.user) {
              showError("Login failed. Check your handle and password. If you just registered, click the activation link in your welcome email first.");
            } else {
              const loginEl = document.getElementById("login");
              if (loginEl) {
                loginEl.classList.remove("show");
                loginEl.style.display = "none";
                loginEl.setAttribute("aria-hidden", "true");
                loginEl.removeAttribute("aria-modal");
              }
              document.body.classList.remove("modal-open");
              document.body.style.overflow = "";
              document.body.style.paddingRight = "";
              const backdrop = document.querySelector(".modal-backdrop");
              if (backdrop) backdrop.parentNode.removeChild(backdrop);
              if (window.location.pathname === "/login") {
                const params = new URLSearchParams(window.location.search);
                const cb = params.get("callbackUrl");
                window.location.href = (cb && cb.startsWith("/")) ? cb : "/";
              } else {
                window.location.reload();
              }
            }
          } catch(err) {
            showError("error: " + (err && err.message ? err.message : String(err)));
          }
        }
        // Delegate on document (which persists across client-side navigation) so
        // login works on EVERY page. This inline script runs once (Next dedupes
        // by id), but SiteLayout's modal DOM is recreated per route — directly
        // binding to #login-submit-btn only worked on the first page loaded.
        document.addEventListener("click", function(e) {
          var t = e.target;
          if (t && t.closest && t.closest("#login-submit-btn")) loginUser();
        });
        document.addEventListener("submit", function(e) {
          if (e.target && e.target.id === "login-form") { e.preventDefault(); loginUser(); }
        });
        // Keyboard flow: Enter/Tab in the nick field advances to the password
        // field (the LOG iN button is type="button", so no implicit submit);
        // Enter in the password field logs in.
        document.addEventListener("keydown", function(e) {
          var t = e.target;
          if (!t || !t.id) return;
          if (t.id === "login-nick" && (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey))) {
            e.preventDefault();
            document.getElementById("login-password")?.focus();
          } else if (t.id === "login-password" && e.key === "Enter") {
            e.preventDefault();
            loginUser();
          }
        });
        // Focus + select the nick field whenever the modal opens. Bootstrap's
        // shown.bs.modal bubbles, so delegate it too (survives navigation).
        document.addEventListener("shown.bs.modal", function(e) {
          if (e.target && e.target.id === "login") {
            var nickEl = document.getElementById("login-nick");
            if (nickEl) { nickEl.focus(); nickEl.select(); }
          }
        });
      `}</Script>
    </>
  );
}

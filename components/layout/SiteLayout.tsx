import Script from "next/script";
import type { Session } from "next-auth";
import { unstable_cache } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";
import Navbar from "./Navbar";
import LogoHeader from "./LogoHeader";
import PageHeader from "./PageHeader";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export type SiteLayoutProps = {
  title?: string | string[];
  children: React.ReactNode;
};

const getLogos = unstable_cache(
  async () => {
    try {
      const rows = await prisma.$queryRaw<Array<{ ascii: string }>>(
        Prisma.sql`SELECT ascii FROM logos ORDER BY logo_id LIMIT 50`
      );
      return rows.map((r) => r.ascii);
    } catch {
      return [];
    }
  },
  ["logos"],
  { revalidate: 120 }
);

export default async function SiteLayout({ title, children }: SiteLayoutProps) {
  const [rawSession, logos] = await Promise.all([
    auth().catch(() => null),
    getLogos(),
  ]);

  // auth() is overloaded; cast to the Session | null variant
  const session = rawSession as Session | null;

  const userPrefs = session?.user as { crt_effect?: string; anim_effect?: string } | undefined;
  const showCrt = !session?.user || userPrefs?.crt_effect !== "N";
  const showAnim = !session?.user || userPrefs?.anim_effect !== "N";

  return (
    <>
      {/* 386 boot animation — only shown when anim_effect is enabled */}
      {showAnim ? (
        <script
          type="module"
          dangerouslySetInnerHTML={{ __html: `
            try {
              const { default: init386 } = await import('/assets/js/386-animation/index.js');
              init386({ fastLoad: true, onePass: true, speedFactor: 4, background: '#000000', cursorColor: '#ff0000' });
            } catch(e) {
              document.body.style.visibility = 'visible';
            }
          `}}
        />
      ) : (
        <script dangerouslySetInnerHTML={{ __html: "document.body.style.visibility='visible';" }} />
      )}

      {showCrt && <div className="scanlines"></div>}
      <div className="vignette"></div>

      <Navbar session={session} />

      <div className="container-fluid mobile-bg">
        <div className="row" style={{ paddingTop: "58px", paddingBottom: "16px" }}>
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
              showError("authentication failed");
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
              window.location.reload();
            }
          } catch(err) {
            showError("error: " + (err && err.message ? err.message : String(err)));
          }
        }
        document.getElementById("login-submit-btn")?.addEventListener("click", loginUser);
        document.getElementById("login-form")?.addEventListener("submit", function(e) { e.preventDefault(); loginUser(); });
        document.getElementById("login")?.addEventListener("shown.bs.modal", function() {
          document.getElementById("login-nick")?.focus();
        });
      `}</Script>
    </>
  );
}

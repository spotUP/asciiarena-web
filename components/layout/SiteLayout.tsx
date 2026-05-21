import Script from "next/script";
import type { Session } from "next-auth";
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

export default async function SiteLayout({ title, children }: SiteLayoutProps) {
  const [rawSession, logoRows] = await Promise.all([
    auth(),
    prisma.$queryRaw<Array<{ ascii: string }>>(
      Prisma.sql`SELECT ascii FROM logos ORDER BY logo_id LIMIT 50`
    ),
  ]);

  // auth() is overloaded; cast to the Session | null variant
  const session = rawSession as Session | null;
  const logos = logoRows.map((r) => r.ascii);

  const userPrefs = session?.user as { crt_effect?: string; anim_effect?: string } | undefined;
  const showCrt = !session?.user || userPrefs?.crt_effect !== "N";
  const showAnim = !session?.user || userPrefs?.anim_effect !== "N";

  return (
    <>
      <div id="spotclose" className="spotclose" suppressHydrationWarning>
        <div className="noevents">x</div>
      </div>
      <Script id="fullscreen-toggle" strategy="beforeInteractive">{`
        function showFullscreen() {
          document.getElementById('colly')?.classList.toggle('fullscreen');
          document.getElementById('blacker')?.classList.toggle('show');
          document.getElementById('spotclose')?.classList.toggle('show');
        }
        document.addEventListener('DOMContentLoaded', function() {
          var el = document.getElementById('spotclose');
          if (el) el.onclick = showFullscreen;
        });
      `}</Script>

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
              <button type="button" className="btn-primary black bg-lightgrey" id="login-submit-btn">LOG IN</button>
            </div>
          </div>
        </div>
      </div>

      <Script id="site-init" strategy="afterInteractive">{`
        document.addEventListener("keydown", function(e) {
          if (e.key === "Escape") {
            document.getElementById("colly")?.classList.toggle("fullscreen");
            document.getElementById("blacker")?.classList.toggle("show");
            document.getElementById("spotclose")?.classList.toggle("show");
          }
        });

        async function loginUser() {
          const nick = document.getElementById("login-nick").value;
          const pass = document.getElementById("login-password").value;
          try {
            const { csrfToken } = await (await fetch("/api/auth/csrf")).json();
            const res = await fetch("/api/auth/callback/credentials", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ login: nick, password: pass, csrfToken, redirect: "false" }),
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const el = document.getElementById("login-results");
              el.innerHTML = '<div class="alert alert-danger animate__animated animate__shakeX">authentication failed</div>';
              setTimeout(function() { el.innerHTML = ""; }, 3000);
            }
          } catch {}
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

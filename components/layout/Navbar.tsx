import Link from "next/link";
import type { Session } from "next-auth";
import SearchForm from "@/components/layout/SearchForm";
import UnreadBadge from "@/components/layout/UnreadBadge";
import LogoutButton from "@/components/layout/LogoutButton";
import NotificationBell from "@/components/layout/NotificationBell";
import ModerationBadge from "@/components/admin/ModerationBadge";

export type NavbarProps = {
  session: Session | null;
};

export default function Navbar({ session }: NavbarProps) {
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.rank === "Admin";

  return (
    <div
      className="navbar navbar-expand-lg fixed-top bg-blue m-0 p-0"
      style={{ height: "21px" }}
    >
      <div className="container-fluid m-md-0 p-md-0">
        <Link prefetch={false} href="/" className="navbar-brand ascii white">
          aSCIIaRENA
        </Link>
        <a
          className="navbar-toggler ascii"
          data-bs-toggle="collapse"
          data-bs-target="#navbarResponsive"
          aria-controls="navbarResponsive"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          mENU
        </a>
        <div
          className="collapse navbar-collapse justify-content-start"
          id="navbarResponsive"
        >
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-bs-toggle="dropdown"
                href="/collys"
                id="collys-dropdown"
              >
                COLLYS v
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="collys-dropdown">
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=name">By Name</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=filename">By Filename</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=artists">By Artist</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=crews">By Crew</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=cdate&sort_order=D">By Release Date</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=timestamp&sort_order=D">By Upload Date</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/collys?sort_by=uploader">By Uploader</Link>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-bs-toggle="dropdown"
                href="/mags"
                id="mags-dropdown"
              >
                MAGS v
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="mags-dropdown">
                <Link prefetch={false} className="dropdown-item ascii" href="/mags?sort_by=name">By Name</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/mags?sort_by=filename">By Filename</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/mags?sort_by=author">By Author</Link>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-bs-toggle="dropdown"
                href="/apps"
                id="apps-dropdown"
              >
                APPS v
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="apps-dropdown">
                <Link prefetch={false} className="dropdown-item ascii" href="/apps?sort_by=name">By Name</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/apps?sort_by=filename">By Filename</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/apps?sort_by=author">By Author</Link>
              </div>
            </li>

            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/artists">ARTiSTS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/crews">CREWS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/bbs">BOARDS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/requests">REQUESTS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/polls">POLLS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/stats">STATS</Link></li>
            <li className="nav-item"><Link prefetch={false} className="nav-link ascii apr-1" href="/about">ABOUT</Link></li>
            <li className="nav-item"><a className="nav-link ascii apr-1" href="https://hippoplayer.se">WORKBENCH</a></li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii"
                style={{ paddingRight: "8px" }}
                data-bs-toggle="dropdown"
                href="/submit"
                id="submit-dropdown"
              >
                SUBMiT v
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="submit-dropdown">
                <Link prefetch={false} className="dropdown-item ascii" href="/submit">Colly</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#crew">Crew</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#artist">Artist</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#bbs">BBS</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#app">ASCII App</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#ascii_mag">ASCII Mag</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#request">Request</Link>
                <Link prefetch={false} className="dropdown-item ascii" href="/submit#sitelogo">aSCIIaRENA Logo</Link>
              </div>
            </li>

          </ul>

          {/* Right-side items — menu-right gives position:absolute;right:0 from site.css */}
          <ul className="navbar-nav menu-right">
            <li className="nav-item d-none d-lg-block">
              <SearchForm compact />
            </li>

            {!isLoggedIn && (
              <li className="nav-item">
                <a
                  className="nav-link ascii yellow apr-1"
                  data-bs-toggle="modal"
                  style={{ paddingRight: "8px" }}
                  href="#login"
                >
                  LOGiN
                </a>
              </li>
            )}

            {isLoggedIn && session?.user?.id && (
              <li className="nav-item">
                <NotificationBell userId={parseInt(session.user.id)} />
              </li>
            )}

            {isLoggedIn && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle ascii yellow"
                  style={{ paddingRight: "8px" }}
                  data-bs-toggle="dropdown"
                  href="#"
                  id="account-dropdown"
                >
                  ACCOUNT v
                </a>
                <div className="dropdown-menu dropdown-menu-end ascii" aria-labelledby="account-dropdown">
                  <Link prefetch={false} className="dropdown-item ascii" href="/messages">Chat<UnreadBadge userId={session?.user?.id} /></Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/settings">Settings</Link>
                  <LogoutButton />
                </div>
              </li>
            )}

            {isLoggedIn && isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle ascii yellow"
                  style={{ paddingRight: "8px" }}
                  data-bs-toggle="dropdown"
                  href="/admin"
                  id="admin-dropdown"
                >
                  ADMiN v<ModerationBadge />
                </a>
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-fix bg-red ascii" aria-labelledby="admin-dropdown">
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin">Dashboard</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/users">Users</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/users/inactive">Inactive Users</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/artists">Artists</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/crews">Crews</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/logos">Logos</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/content">Apps &amp; Mags</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/bbs">BBS</Link>
                  <Link prefetch={false} className="dropdown-item ascii" href="/admin/requests">Requests</Link>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

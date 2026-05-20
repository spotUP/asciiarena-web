import type { Session } from "next-auth";

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
        <a href="/" style={{ color: "#fff" }} className="navbar-brand ascii">
          aSCIIaRENA
        </a>
        <a
          className="navbar-toggler ascii"
          data-toggle="collapse"
          data-target="#navbarResponsive"
          aria-controls="navbarResponsive"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          mENU
        </a>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarResponsive"
        >
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-toggle="dropdown"
                href="/collys"
                id="collys-dropdown"
              >
                COLLYS<span className="caret" style={{ paddingRight: "8px" }}></span>
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="collys-dropdown">
                <a className="dropdown-item ascii" href="/collys?sort_by=name">
                  By Name
                  <span style={{ paddingLeft: "7px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=filename">
                  By Filename
                  <span style={{ paddingLeft: "4px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=artists">
                  By Artist
                  <span style={{ paddingLeft: "10px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=crews">
                  By Crew
                  <span style={{ paddingLeft: "10px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=cdate&sort_order=D">
                  By Release Date
                  <span style={{ fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=timestamp&sort_order=D">
                  By Upload Date
                  <span style={{ paddingLeft: "8px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/collys?sort_by=uploader">
                  By Uploader
                  <span style={{ paddingLeft: "13px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;
                  </span>
                </a>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-toggle="dropdown"
                href="/mags"
                id="mags-dropdown"
              >
                MAGS<span className="caret" style={{ paddingRight: "8px" }}></span>
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="mags-dropdown">
                <a className="dropdown-item ascii" href="/mags?sort_by=name">
                  By Name
                  <span style={{ paddingLeft: "7px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/mags?sort_by=filename">
                  By Filename
                  <span style={{ paddingLeft: "4px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/mags?sort_by=author">
                  By Author
                  <span style={{ paddingLeft: "10px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii apr-1"
                data-toggle="dropdown"
                href="/apps"
                id="apps-dropdown"
              >
                APPS<span className="caret" style={{ paddingRight: "8px" }}></span>
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="apps-dropdown">
                <a className="dropdown-item ascii" href="/apps?sort_by=name">
                  By Name
                  <span style={{ paddingLeft: "7px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/apps?sort_by=filename">
                  By Filename
                  <span style={{ paddingLeft: "4px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
                <a className="dropdown-item ascii" href="/apps?sort_by=author">
                  By Author
                  <span style={{ paddingLeft: "10px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                </a>
              </div>
            </li>

            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/artists">
                ARTiSTS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/crews">
                CREWS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/bbs">
                BBS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/requests">
                REQUESTS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/about">
                ABOUT
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="/styleeditor">
                ASCII STYLE DESIGNER
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link ascii apr-1" href="https://hippoplayer.se">
                WORKBENCH
              </a>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle ascii"
                style={{ paddingRight: "8px" }}
                data-toggle="dropdown"
                href="/submit"
                id="submit-dropdown"
              >
                SUBMiT<span className="caret" style={{ paddingRight: "8px" }}></span>
              </a>
              <div className="dropdown-menu ascii" aria-labelledby="submit-dropdown">
                <a className="dropdown-item ascii" href="/submit">
                  Colly<span style={{ paddingLeft: "7px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#crew">
                  Crew<span style={{ paddingLeft: "4px" }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#artist">
                  Artist<span style={{ paddingLeft: "10px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#bbs">
                  BBS<span style={{ fontSize: "16px" }}>&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#app">
                  ASCII App<span style={{ fontSize: "16px" }}>&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#ascii_mag">
                  ASCII Mag<span style={{ fontSize: "16px" }}>&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#request">
                  Request<span style={{ fontSize: "16px" }}>&nbsp;</span>
                </a>
                <a className="dropdown-item ascii" href="/submit#sitelogo">
                  aSCIIaRENA Logo<span style={{ fontSize: "16px" }}>&nbsp;</span>
                </a>
              </div>
            </li>

            <ul className="nav navbar-nav menu-right">
              {!isLoggedIn && (
                <li className="nav-item">
                  <a
                    className="nav-link ascii yellow apr-1"
                    data-toggle="modal"
                    style={{ paddingRight: "8px" }}
                    href="#login"
                  >
                    LOGiN
                  </a>
                </li>
              )}

              {isLoggedIn && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle ascii yellow"
                    style={{ paddingRight: "8px" }}
                    data-toggle="dropdown"
                    href="#"
                    id="account-dropdown"
                  >
                    ACCOUNT<span className="caret" style={{ paddingRight: "8px" }}></span>
                  </a>
                  <div className="dropdown-menu ascii" aria-labelledby="account-dropdown">
                    <a className="dropdown-item ascii" href="/messages">
                      Messages
                      <span style={{ paddingLeft: "4px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                        &nbsp;&nbsp;&nbsp;
                      </span>
                    </a>
                    <a className="dropdown-item ascii" href="/settings">
                      Settings
                      <span style={{ paddingLeft: "4px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                        &nbsp;&nbsp;&nbsp;
                      </span>
                    </a>
                    <form action="/api/auth/signout" method="POST">
                      <button type="submit" className="dropdown-item ascii">
                        Logout
                        <span style={{ paddingLeft: "7px", fontSize: "16px", fontFamily: "Monaco, monospace" }}>
                          &nbsp;
                        </span>
                      </button>
                    </form>
                  </div>
                </li>
              )}

              {isLoggedIn && isAdmin && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle ascii yellow"
                    style={{ paddingRight: "8px" }}
                    data-toggle="dropdown"
                    href="/admin"
                    id="admin-dropdown"
                  >
                    ADMiN<span className="caret" style={{ paddingRight: "8px" }}></span>
                  </a>
                  <div
                    className="dropdown-menu dropdown-menu-fix bg-red ascii"
                    aria-labelledby="admin-dropdown"
                  >
                    <a className="dropdown-item ascii" href="/admin#colly">
                      Edit Colly<span style={{ paddingLeft: "7px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#app">
                      Edit App<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#ascii_mag">
                      Edit Mag<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#crew">
                      Edit Crew<span style={{ paddingLeft: "4px" }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#artist">
                      Edit Artist<span style={{ paddingLeft: "10px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#edituser">
                      Edit User<span style={{ fontSize: "16px" }}>&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#sitelogo">
                      Edit Logo<span style={{ paddingLeft: "8px" }}>&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#bbs">
                      Edit BBS<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#request">
                      Edit Requests<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#playlist">
                      Edit Playlists<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                    <a className="dropdown-item ascii" href="/admin#broken">
                      Broken Collys<span style={{ paddingLeft: "13px" }}>&nbsp;&nbsp;&nbsp;</span>
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Script from "next/script";
import { getSession as auth } from "@/lib/session";
import SiteLayout from "@/components/layout/SiteLayout";

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") notFound();

  const tabs = [
    { id: "broken",   label: "Broken Collys" },
    { id: "colly",    label: "Edit Colly" },
    { id: "artist",   label: "Edit Artist" },
    { id: "crew",     label: "Edit Crew" },
    { id: "edituser", label: "Edit User" },
    { id: "sitelogo", label: "Edit Logo" },
    { id: "app",      label: "Edit App" },
    { id: "ascii_mag",label: "Edit Mag" },
    { id: "bbs",       label: "Edit BBS" },
    { id: "request",  label: "Edit Requests" },
    { id: "playlist", label: "Edit Playlists" },
  ];

  return (
    <SiteLayout title="ADMiN">
      <ul className="nav nav-tabs bg-secondary" id="admin-tabs" style={{ marginBottom: 0, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <li key={t.id} className="nav-item bg-secondary">
            <a className="nav-link bg-secondary" href={`#${t.id}`}
              style={{ cursor: "pointer", padding: "6px 10px" }}>
              {t.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Broken Collys */}
      <div id="tab-broken" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div className="row amb-1">
          <div className="col-4 white">FILENAME</div>
          <div className="col-4 white">COMMENT</div>
          <div className="col-4 white">ACTIONS</div>
        </div>
        <div id="broken-list"></div>
      </div>

      {/* Edit Colly */}
      <div id="tab-colly" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="colly-search" style={{ maxWidth: "300px" }} placeholder="Search by name or filename..." />
          <input type="button" className="btn-big" id="colly-search-btn" value="Search" />
        </div>
        <div id="colly-results"></div>
      </div>

      {/* Edit Artist */}
      <div id="tab-artist" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="artist-search" style={{ maxWidth: "300px" }} placeholder="Search by nick..." />
          <input type="button" className="btn-big" id="artist-search-btn" value="Search" />
        </div>
        <div id="artist-results"></div>
      </div>

      {/* Edit Crew */}
      <div id="tab-crew" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="crew-search" style={{ maxWidth: "300px" }} placeholder="Search by name..." />
          <input type="button" className="btn-big" id="crew-search-btn" value="Search" />
        </div>
        <div id="crew-results"></div>
      </div>

      {/* Edit User */}
      <div id="tab-edituser" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="user-search" style={{ maxWidth: "300px" }} placeholder="Search by nick..." />
          <input type="button" className="btn-big" id="user-search-btn" value="Search" />
        </div>
        <div id="user-results"></div>
      </div>

      {/* Edit Logo */}
      <div id="tab-sitelogo" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ marginBottom: "8px" }}>
          <textarea id="logo-ascii" className="form-control" rows={8} style={{ fontFamily: "TopazPlus_a1200, monospace", whiteSpace: "pre" }} placeholder="Paste ASCII logo here..." />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <input type="button" className="btn-big" id="logo-add-btn" value="Add Logo" />
          <span id="logo-add-msg" className="apl-1"></span>
        </div>
        <div id="logo-list"></div>
      </div>

      {/* Edit App */}
      <div id="tab-app" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="app-search" style={{ maxWidth: "300px" }} placeholder="Search by name or filename..." />
          <input type="button" className="btn-big" id="app-search-btn" value="Search" />
        </div>
        <div id="app-results"></div>
      </div>

      {/* Edit Mag */}
      <div id="tab-ascii_mag" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="mag-search" style={{ maxWidth: "300px" }} placeholder="Search by name or filename..." />
          <input type="button" className="btn-big" id="mag-search-btn" value="Search" />
        </div>
        <div id="mag-results"></div>
      </div>

      {/* Edit BBS */}
      <div id="tab-bbs" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="bbs-search" style={{ maxWidth: "300px" }} placeholder="Search by name or sysop..." />
          <input type="button" className="btn-big" id="bbs-search-btn" value="Search" />
        </div>
        <div id="bbs-results"></div>
      </div>

      {/* Edit Requests */}
      <div id="tab-request" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <div style={{ marginBottom: "8px" }}>
          <a href="/requests"><input type="button" className="btn-big" value="Browse Requests" readOnly /></a>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="text" className="form-control" id="req-search" style={{ maxWidth: "300px" }} placeholder="Search by title..." />
          <input type="button" className="btn-big" id="req-search-btn" value="Search" />
        </div>
        <div id="req-results"></div>
      </div>

      {/* Edit Playlists */}
      <div id="tab-playlist" className="admin-tab" style={{ display: "none", padding: "8px" }}>
        <a href="/playlists"><input type="button" className="btn-big" value="Go to Playlists" readOnly /></a>
      </div>

      <Script id="admin-init" strategy="afterInteractive">{`
        function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
        function gel(id) { return document.getElementById(id); }

        function showTab(id) {
          document.querySelectorAll(".admin-tab").forEach(function(t) { t.style.display = "none"; });
          const tab = gel("tab-" + id); if (tab) tab.style.display = "";
          document.querySelectorAll("#admin-tabs .nav-link").forEach(function(l) { l.classList.remove("active"); });
          const active = document.querySelector('#admin-tabs .nav-link[href="#' + id + '"]');
          if (active) active.classList.add("active");
        }

        function adminMsg(target, msg, ok) {
          const el = typeof target === "string" ? document.querySelector(target) : target;
          if (!el) return;
          el.textContent = msg;
          el.style.color = ok ? "#55ff55" : "#ff5555";
          setTimeout(function() { el.textContent = ""; }, 3000);
        }

        function activateHash() {
          const hash = window.location.hash.replace("#", "") || "broken";
          showTab(hash);
          if (hash === "broken") loadBroken();
          if (hash === "sitelogo") loadLogos();
        }
        window.addEventListener("hashchange", activateHash);
        activateHash();

        // ── Broken Collys ──────────────────────────────────────────────
        async function loadBroken() {
          const rows = await (await fetch("/api/admin/collys?broken=1")).json();
          const list = gel("broken-list"); if (!list) return;
          if (!rows.length) { list.innerHTML = '<div class="lightgrey">No broken collys reported.</div>'; return; }
          list.innerHTML = rows.map(function(r) {
            return '<div class="row amb-1" data-id="' + r.id + '">' +
              '<div class="col-4 text-truncate"><a class="magenta" href="/release/' + encodeURIComponent(r.filename) + '">' + esc(r.filename) + '</a></div>' +
              '<div class="col-4 lightgrey">' + esc(r.broken_comment || "") + '</div>' +
              '<div class="col-4" style="display:flex;gap:4px">' +
                '<input type="button" class="btn-big broken-fix" value="Mark Fixed" data-id="' + r.id + '" />' +
                '<input type="button" class="btn-big broken-delete" value="Delete" data-id="' + r.id + '" />' +
              '</div></div>';
          }).join("");
        }

        // ── Collys ─────────────────────────────────────────────────────
        async function searchEntity(url, renderFn, resultId) {
          const rows = await (await fetch(url)).json();
          const el = gel(resultId); if (!el) return;
          el.innerHTML = rows.length ? renderFn(rows) : '<div class="lightgrey">No results.</div>';
        }

        function collyRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-3 text-truncate"><a class="magenta" href="/release/' + encodeURIComponent(r.filename) + '">' + esc(r.filename) + '</a></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-name" value="' + esc(r.name || "") + '" placeholder="Name" /></div>' +
            '<div class="col-1"><input type="number" class="form-control edit-year" value="' + (r.year || "") + '" placeholder="Year" style="width:70px" /></div>' +
            '<div class="col-1"><input type="text" class="form-control edit-type" value="' + esc(r.type || "") + '" placeholder="Type" style="width:70px" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big colly-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big colly-delete" value="Del" data-id="' + r.id + '" />' +
            '</div></div>';
        }

        function bindSearch(searchId, btnId, url, renderFn, resultId) {
          const btn = gel(btnId); const input = gel(searchId);
          if (btn) btn.addEventListener("click", function() {
            const q = input ? input.value : ""; if (!q) return;
            searchEntity(url + encodeURIComponent(q), renderFn, resultId);
          });
          if (input) input.addEventListener("keydown", function(e) { if (e.key === "Enter" && btn) btn.click(); });
        }

        function artistRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="/artist/' + encodeURIComponent(r.artisturl) + '">' + esc(r.nick) + '</a></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-active" value="' + esc(r.active || "") + '" placeholder="active/ex-member" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-country" value="' + esc(r.country || "") + '" placeholder="Country" /></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-www" value="' + esc(r.www || "") + '" placeholder="Website" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big artist-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big artist-delete" value="Del" data-id="' + r.id + '" />' +
            '</div></div>';
        }

        function crewRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="/crew/' + encodeURIComponent(r.crewurl) + '">' + esc(r.name) + '</a></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-name" value="' + esc(r.name || "") + '" placeholder="Name" /></div>' +
            '<div class="col-1"><input type="text" class="form-control edit-acronym" value="' + esc(r.acronym || "") + '" placeholder="Tag" style="width:60px" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-active" value="' + esc(r.active || "") + '" placeholder="active/ex" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-www" value="' + esc(r.www || "") + '" placeholder="Website" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big crew-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big crew-delete" value="Del" data-id="' + r.id + '" />' +
            '</div></div>';
        }

        const RANKS = ["","Inactive","Member","Senior Member","Uploader","Admin"];
        function userRow(r) {
          const rankOpts = RANKS.map(function(rk) {
            return '<option value="' + rk + '"' + (r.rank === rk ? " selected" : "") + '>' + (rk || "(none)") + '</option>';
          }).join("");
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-3 text-truncate"><a class="magenta" href="/member/' + encodeURIComponent(r.nickurl) + '">' + esc(r.nick) + '</a></div>' +
            '<div class="col-2"><select class="form-select edit-rank">' + rankOpts + '</select></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-crew" value="' + esc(r.crew || "") + '" placeholder="Crew" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big user-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big user-delete" value="Del" data-id="' + r.id + '" />' +
            '</div></div>';
        }

        bindSearch("colly-search", "colly-search-btn", "/api/admin/collys?q=", function(rows) { return rows.map(collyRow).join(""); }, "colly-results");
        bindSearch("artist-search", "artist-search-btn", "/api/admin/artists?q=", function(rows) { return rows.map(artistRow).join(""); }, "artist-results");
        bindSearch("crew-search", "crew-search-btn", "/api/admin/crews?q=", function(rows) { return rows.map(crewRow).join(""); }, "crew-results");
        bindSearch("user-search", "user-search-btn", "/api/admin/users?q=", function(rows) { return rows.map(userRow).join(""); }, "user-results");

        // ── Logos ──────────────────────────────────────────────────────
        async function loadLogos() {
          const rows = await (await fetch("/api/admin/logos")).json();
          const list = gel("logo-list"); if (!list) return;
          list.innerHTML = rows.length ? rows.map(function(r) {
            return '<div class="row amb-1 logo-row" data-id="' + r.id + '">' +
              '<div class="col-10"><pre style="font-family:TopazPlus_a1200,monospace;font-size:11px;color:#ff55ff;white-space:pre;overflow:hidden;max-height:80px">' + esc(r.ascii) + '</pre></div>' +
              '<div class="col-2"><input type="button" class="btn-big logo-delete" value="Delete" data-id="' + r.id + '" /></div>' +
              '</div>';
          }).join("") : '<div class="lightgrey">No logos.</div>';
        }

        const logoAddBtn = gel("logo-add-btn");
        if (logoAddBtn) logoAddBtn.addEventListener("click", async function() {
          const ascii = gel("logo-ascii"); if (!ascii || !ascii.value.trim()) return;
          await fetch("/api/admin/logos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ascii: ascii.value }) });
          ascii.value = ""; adminMsg("#logo-add-msg", "Added!", true); loadLogos();
        });

        // ── Apps / Mags ────────────────────────────────────────────────
        function appMagRow(r, adminApi, detailPath) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="' + detailPath + '/' + encodeURIComponent(r.filename) + '">' + esc(r.filename) + '</a></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-name" value="' + esc(r.name || "") + '" placeholder="Name" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-author" value="' + esc(r.author || "") + '" placeholder="Author" /></div>' +
            '<div class="col-1"><input type="number" class="form-control edit-year" value="' + (r.year || "") + '" placeholder="Year" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big appmag-save" data-id="' + r.id + '" data-api="' + adminApi + '" value="Save" />' +
              '<input type="button" class="btn-big appmag-delete" data-id="' + r.id + '" data-api="' + adminApi + '" value="Del" />' +
            '</div></div>';
        }

        function bindAppMagSearch(searchId, btnId, resultsId, listApi, adminApi, detailPath) {
          const btn = gel(btnId); const input = gel(searchId);
          if (btn) btn.addEventListener("click", async function() {
            const q = input ? input.value : ""; if (!q) return;
            const rows = await (await fetch(listApi + "?filter=" + encodeURIComponent(q) + "&pagesize=30")).json();
            const el = gel(resultsId); if (!el) return;
            el.innerHTML = rows.length ? rows.map(function(r) { return appMagRow(r, adminApi, detailPath); }).join("") : '<div class="lightgrey">No results.</div>';
          });
          if (input) input.addEventListener("keydown", function(e) { if (e.key === "Enter" && btn) btn.click(); });
        }
        bindAppMagSearch("app-search", "app-search-btn", "app-results", "/api/apps", "/api/admin/apps", "/application");
        bindAppMagSearch("mag-search", "mag-search-btn", "mag-results", "/api/mags", "/api/admin/mags", "/magazine");

        // ── BBS ────────────────────────────────────────────────────────
        function bbsRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate white">' + esc(r.name || "") + '</div>' +
            '<div class="col-2"><input type="text" class="form-control edit-sysop" value="' + esc(r.sysop || "") + '" placeholder="Sysop" /></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-address" value="' + esc(r.address || "") + '" placeholder="Address" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-software" value="' + esc(r.software || "") + '" placeholder="Software" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big bbs-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big bbs-delete" value="Del" data-id="' + r.id + '" />' +
            '</div></div>';
        }
        bindSearch("bbs-search", "bbs-search-btn", "/api/admin/bbs?q=", function(rows) { return rows.map(bbsRow).join(""); }, "bbs-results");

        // ── Requests ───────────────────────────────────────────────────
        const reqBtn = gel("req-search-btn"); const reqInput = gel("req-search");
        async function doReqSearch() {
          const q = reqInput ? reqInput.value : ""; if (!q) return;
          const rows = await (await fetch("/api/requests?filter=" + encodeURIComponent(q) + "&pagesize=30&viewmode=4")).json();
          const el = gel("req-results"); if (!el) return;
          if (!rows.length) { el.innerHTML = '<div class="lightgrey">No results.</div>'; return; }
          el.innerHTML = rows.map(function(r) {
            return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
              '<div class="col-5 text-truncate"><a class="magenta" href="/requests/' + r.id + '">' + esc(r.title || "") + '</a></div>' +
              '<div class="col-3 lightgrey">' + esc(r.user || "") + '</div>' +
              '<div class="col-2 lightgrey">' + (r.time || "") + '</div>' +
              '<div class="col-2"><input type="button" class="btn-big req-delete" data-id="' + r.id + '" value="Delete" /></div>' +
              '</div>';
          }).join("");
        }
        if (reqBtn) reqBtn.addEventListener("click", doReqSearch);
        if (reqInput) reqInput.addEventListener("keydown", function(e) { if (e.key === "Enter") doReqSearch(); });

        // ── Delegated click handlers ───────────────────────────────────
        document.addEventListener("click", async function(e) {
          const t = e.target;

          if (t.classList.contains("broken-fix")) {
            await fetch("/api/admin/collys", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id), broken: 0, broken_comment: null }) });
            loadBroken();
          } else if (t.classList.contains("broken-delete")) {
            if (!confirm("Delete this colly permanently?")) return;
            await fetch("/api/admin/collys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            loadBroken();
          } else if (t.classList.contains("colly-save")) {
            const row = t.closest(".entity-row");
            await fetch("/api/admin/collys", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), name: row.querySelector(".edit-name").value, year: parseInt(row.querySelector(".edit-year").value) || null, type: row.querySelector(".edit-type").value }) });
            adminMsg("#colly-results", "Saved!", true);
          } else if (t.classList.contains("colly-delete")) {
            if (!confirm("Delete this colly permanently? Files will be removed.")) return;
            await fetch("/api/admin/collys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("artist-save")) {
            const row = t.closest(".entity-row");
            await fetch("/api/admin/artists", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), active: row.querySelector(".edit-active").value, country: row.querySelector(".edit-country").value, www: row.querySelector(".edit-www").value }) });
            adminMsg("#artist-results", "Saved!", true);
          } else if (t.classList.contains("artist-delete")) {
            if (!confirm("Delete artist and all crew memberships?")) return;
            await fetch("/api/admin/artists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("crew-save")) {
            const row = t.closest(".entity-row");
            await fetch("/api/admin/crews", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), name: row.querySelector(".edit-name").value, acronym: row.querySelector(".edit-acronym").value, active: row.querySelector(".edit-active").value, www: row.querySelector(".edit-www").value }) });
            adminMsg("#crew-results", "Saved!", true);
          } else if (t.classList.contains("crew-delete")) {
            if (!confirm("Delete crew?")) return;
            await fetch("/api/admin/crews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("user-save")) {
            const row = t.closest(".entity-row");
            await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), rank: row.querySelector(".edit-rank").value, crew: row.querySelector(".edit-crew").value }) });
            adminMsg("#user-results", "Saved!", true);
          } else if (t.classList.contains("user-delete")) {
            if (!confirm("Delete user account permanently?")) return;
            await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("logo-delete")) {
            if (!confirm("Delete this logo?")) return;
            await fetch("/api/admin/logos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            loadLogos();
          } else if (t.classList.contains("appmag-save")) {
            const row = t.closest(".entity-row");
            await fetch(t.dataset.api, { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), name: row.querySelector(".edit-name").value, author: row.querySelector(".edit-author").value, year: parseInt(row.querySelector(".edit-year").value) || null }) });
            const resultsEl = row.closest("[id$=-results]");
            adminMsg(resultsEl, "Saved!", true);
          } else if (t.classList.contains("appmag-delete")) {
            if (!confirm("Delete this entry?")) return;
            await fetch(t.dataset.api, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("bbs-save")) {
            const row = t.closest(".entity-row");
            await fetch("/api/admin/bbs", { method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: parseInt(t.dataset.id), sysop: row.querySelector(".edit-sysop").value, address: row.querySelector(".edit-address").value, software: row.querySelector(".edit-software").value }) });
            adminMsg("#bbs-results", "Saved!", true);
          } else if (t.classList.contains("bbs-delete")) {
            if (!confirm("Delete this BBS?")) return;
            await fetch("/api/admin/bbs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: parseInt(t.dataset.id) }) });
            t.closest(".entity-row").remove();
          } else if (t.classList.contains("req-delete")) {
            if (!confirm("Delete this request and all its comments?")) return;
            await fetch("/api/requests/" + t.dataset.id, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
            t.closest(".entity-row").remove();
          }
        });
      `}</Script>
    </SiteLayout>
  );
}

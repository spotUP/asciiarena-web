import { notFound } from "next/navigation";
import Script from "next/script";
import { auth } from "@/lib/auth";
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
        function showTab(id) {
          $(".admin-tab").hide();
          $("#tab-" + id).show();
          $("#admin-tabs .nav-link").removeClass("active");
          $('#admin-tabs .nav-link[href="#' + id + '"]').addClass("active");
        }

        function adminMsg(selector, msg, ok) {
          $(selector).text(msg).css("color", ok ? "#55ff55" : "#ff5555");
          setTimeout(function() { $(selector).text(""); }, 3000);
        }

        // Hash-based tab navigation
        function activateHash() {
          var hash = window.location.hash.replace("#", "") || "broken";
          showTab(hash);
          if (hash === "broken") loadBroken();
          if (hash === "sitelogo") loadLogos();
        }
        $(window).on("hashchange", activateHash);
        activateHash();

        // ── Broken Collys ──────────────────────────────────────────────
        function loadBroken() {
          $.getJSON("/api/admin/collys?broken=1", function(rows) {
            if (!rows.length) { $("#broken-list").html('<div class="lightgrey">No broken collys reported.</div>'); return; }
            var html = "";
            rows.forEach(function(r) {
              html += '<div class="row amb-1" data-id="' + r.id + '">' +
                '<div class="col-4 text-truncate"><a class="magenta" href="/release/' + encodeURIComponent(r.filename) + '">' + $("<div>").text(r.filename).html() + '</a></div>' +
                '<div class="col-4 lightgrey">' + $("<div>").text(r.broken_comment || "").html() + '</div>' +
                '<div class="col-4" style="display:flex;gap:4px">' +
                  '<input type="button" class="btn-big broken-fix" value="Mark Fixed" data-id="' + r.id + '" />' +
                  '<input type="button" class="btn-big broken-delete" value="Delete" data-id="' + r.id + '" />' +
                '</div>' +
                '</div>';
            });
            $("#broken-list").html(html);
          });
        }
        $(document).on("click", ".broken-fix", function() {
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/collys", contentType: "application/json",
            data: JSON.stringify({ id: id, broken: 0, broken_comment: null }),
            success: function() { loadBroken(); }
          });
        });
        $(document).on("click", ".broken-delete", function() {
          var id = $(this).data("id");
          if (!confirm("Delete this colly permanently?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/collys", contentType: "application/json",
            data: JSON.stringify({ id: id }),
            success: function() { loadBroken(); }
          });
        });

        // ── Collys ─────────────────────────────────────────────────────
        function searchEntity(url, renderFn, resultId) {
          $.getJSON(url, function(rows) {
            if (!rows.length) { $("#" + resultId).html('<div class="lightgrey">No results.</div>'); return; }
            $("#" + resultId).html(renderFn(rows));
          });
        }

        function collyRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-3 text-truncate"><a class="magenta" href="/release/' + encodeURIComponent(r.filename) + '">' + $("<div>").text(r.filename).html() + '</a></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-name" value="' + $("<div>").text(r.name || "").html() + '" placeholder="Name" /></div>' +
            '<div class="col-1"><input type="number" class="form-control edit-year" value="' + (r.year || "") + '" placeholder="Year" style="width:70px" /></div>' +
            '<div class="col-1"><input type="text" class="form-control edit-type" value="' + $("<div>").text(r.type || "").html() + '" placeholder="Type" style="width:70px" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big colly-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big colly-delete" value="Del" data-id="' + r.id + '" />' +
            '</div>' +
            '</div>';
        }

        $("#colly-search-btn").on("click", function() {
          var q = $("#colly-search").val();
          if (!q) return;
          searchEntity("/api/admin/collys?q=" + encodeURIComponent(q), function(rows) {
            return rows.map(collyRow).join("");
          }, "colly-results");
        });
        $("#colly-search").on("keydown", function(e) { if (e.which === 13) $("#colly-search-btn").click(); });

        $(document).on("click", ".colly-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/collys", contentType: "application/json",
            data: JSON.stringify({ id: id, name: row.find(".edit-name").val(), year: parseInt(row.find(".edit-year").val()) || null, type: row.find(".edit-type").val() }),
            success: function() { adminMsg("#colly-results", "Saved!", true); }
          });
        });
        $(document).on("click", ".colly-delete", function() {
          var id = $(this).data("id");
          if (!confirm("Delete this colly permanently? Files will be removed.")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/collys", contentType: "application/json",
            data: JSON.stringify({ id: id }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        // ── Artists ────────────────────────────────────────────────────
        function artistRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="/artist/' + encodeURIComponent(r.artisturl) + '">' + $("<div>").text(r.nick).html() + '</a></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-active" value="' + $("<div>").text(r.active || "").html() + '" placeholder="active/ex-member" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-country" value="' + $("<div>").text(r.country || "").html() + '" placeholder="Country" /></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-www" value="' + $("<div>").text(r.www || "").html() + '" placeholder="Website" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big artist-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big artist-delete" value="Del" data-id="' + r.id + '" />' +
            '</div>' +
            '</div>';
        }

        $("#artist-search-btn").on("click", function() {
          var q = $("#artist-search").val();
          if (!q) return;
          searchEntity("/api/admin/artists?q=" + encodeURIComponent(q), function(rows) { return rows.map(artistRow).join(""); }, "artist-results");
        });
        $("#artist-search").on("keydown", function(e) { if (e.which === 13) $("#artist-search-btn").click(); });

        $(document).on("click", ".artist-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/artists", contentType: "application/json",
            data: JSON.stringify({ id: id, active: row.find(".edit-active").val(), country: row.find(".edit-country").val(), www: row.find(".edit-www").val() }),
            success: function() { adminMsg("#artist-results", "Saved!", true); }
          });
        });
        $(document).on("click", ".artist-delete", function() {
          if (!confirm("Delete artist and all crew memberships?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/artists", contentType: "application/json",
            data: JSON.stringify({ id: $(this).data("id") }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        // ── Crews ──────────────────────────────────────────────────────
        function crewRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="/crew/' + encodeURIComponent(r.crewurl) + '">' + $("<div>").text(r.name).html() + '</a></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-name" value="' + $("<div>").text(r.name || "").html() + '" placeholder="Name" /></div>' +
            '<div class="col-1"><input type="text" class="form-control edit-acronym" value="' + $("<div>").text(r.acronym || "").html() + '" placeholder="Tag" style="width:60px" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-active" value="' + $("<div>").text(r.active || "").html() + '" placeholder="active/ex" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-www" value="' + $("<div>").text(r.www || "").html() + '" placeholder="Website" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big crew-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big crew-delete" value="Del" data-id="' + r.id + '" />' +
            '</div>' +
            '</div>';
        }

        $("#crew-search-btn").on("click", function() {
          var q = $("#crew-search").val();
          if (!q) return;
          searchEntity("/api/admin/crews?q=" + encodeURIComponent(q), function(rows) { return rows.map(crewRow).join(""); }, "crew-results");
        });
        $("#crew-search").on("keydown", function(e) { if (e.which === 13) $("#crew-search-btn").click(); });

        $(document).on("click", ".crew-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/crews", contentType: "application/json",
            data: JSON.stringify({ id: id, name: row.find(".edit-name").val(), acronym: row.find(".edit-acronym").val(), active: row.find(".edit-active").val(), www: row.find(".edit-www").val() }),
            success: function() { adminMsg("#crew-results", "Saved!", true); }
          });
        });
        $(document).on("click", ".crew-delete", function() {
          if (!confirm("Delete crew?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/crews", contentType: "application/json",
            data: JSON.stringify({ id: $(this).data("id") }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        // ── Users ──────────────────────────────────────────────────────
        var RANKS = ["","Member","Senior Member","Uploader","Admin"];
        function userRow(r) {
          var rankOpts = RANKS.map(function(rk) {
            return '<option value="' + rk + '"' + (r.rank === rk ? " selected" : "") + '>' + (rk || "(none)") + '</option>';
          }).join("");
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-3 text-truncate"><a class="magenta" href="/member/' + encodeURIComponent(r.nickurl) + '">' + $("<div>").text(r.nick).html() + '</a></div>' +
            '<div class="col-2"><select class="custom-select edit-rank">' + rankOpts + '</select></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-crew" value="' + $("<div>").text(r.crew || "").html() + '" placeholder="Crew" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big user-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big user-delete" value="Del" data-id="' + r.id + '" />' +
            '</div>' +
            '</div>';
        }

        $("#user-search-btn").on("click", function() {
          var q = $("#user-search").val();
          if (!q) return;
          searchEntity("/api/admin/users?q=" + encodeURIComponent(q), function(rows) { return rows.map(userRow).join(""); }, "user-results");
        });
        $("#user-search").on("keydown", function(e) { if (e.which === 13) $("#user-search-btn").click(); });

        $(document).on("click", ".user-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/users", contentType: "application/json",
            data: JSON.stringify({ id: id, rank: row.find(".edit-rank").val(), crew: row.find(".edit-crew").val() }),
            success: function() { adminMsg("#user-results", "Saved!", true); }
          });
        });
        $(document).on("click", ".user-delete", function() {
          if (!confirm("Delete user account permanently?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/users", contentType: "application/json",
            data: JSON.stringify({ id: $(this).data("id") }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        // ── Logos ──────────────────────────────────────────────────────
        function loadLogos() {
          $.getJSON("/api/admin/logos", function(rows) {
            var html = "";
            rows.forEach(function(r) {
              html += '<div class="row amb-1 logo-row" data-id="' + r.id + '">' +
                '<div class="col-10"><pre style="font-family:TopazPlus_a1200,monospace;font-size:11px;color:#ff55ff;white-space:pre;overflow:hidden;max-height:80px">' + $("<div>").text(r.ascii).html() + '</pre></div>' +
                '<div class="col-2"><input type="button" class="btn-big logo-delete" value="Delete" data-id="' + r.id + '" /></div>' +
                '</div>';
            });
            $("#logo-list").html(html || '<div class="lightgrey">No logos.</div>');
          });
        }

        $("#logo-add-btn").on("click", function() {
          var ascii = $("#logo-ascii").val();
          if (!ascii.trim()) return;
          $.ajax({ type: "POST", url: "/api/admin/logos", contentType: "application/json",
            data: JSON.stringify({ ascii: ascii }),
            success: function() { $("#logo-ascii").val(""); adminMsg("#logo-add-msg", "Added!", true); loadLogos(); }
          });
        });

        $(document).on("click", ".logo-delete", function() {
          var id = $(this).data("id");
          if (!confirm("Delete this logo?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/logos", contentType: "application/json",
            data: JSON.stringify({ id: id }),
            success: function() { loadLogos(); }
          });
        });

        // ── Apps / Mags ────────────────────────────────────────────────
        function appMagRow(r, adminApi, detailPath) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate"><a class="magenta" href="' + detailPath + '/' + encodeURIComponent(r.filename) + '">' + $("<div>").text(r.filename).html() + '</a></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-name" value="' + $("<div>").text(r.name || "").html() + '" placeholder="Name" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-author" value="' + $("<div>").text(r.author || "").html() + '" placeholder="Author" /></div>' +
            '<div class="col-1"><input type="number" class="form-control edit-year" value="' + (r.year || "") + '" placeholder="Year" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big appmag-save" data-id="' + r.id + '" data-api="' + adminApi + '" value="Save" />' +
              '<input type="button" class="btn-big appmag-delete" data-id="' + r.id + '" data-api="' + adminApi + '" value="Del" />' +
            '</div>' +
            '</div>';
        }

        function appMagSearch(searchId, btnId, resultsId, listApi, adminApi, detailPath) {
          $("#" + btnId).on("click", function() {
            var q = $("#" + searchId).val();
            if (!q) return;
            $.getJSON(listApi + "?filter=" + encodeURIComponent(q) + "&pagesize=30", function(rows) {
              if (!rows.length) { $("#" + resultsId).html('<div class="lightgrey">No results.</div>'); return; }
              $("#" + resultsId).html(rows.map(function(r) { return appMagRow(r, adminApi, detailPath); }).join(""));
            });
          });
          $("#" + searchId).on("keydown", function(e) { if (e.which === 13) $("#" + btnId).click(); });
        }

        $(document).on("click", ".appmag-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          var api = $(this).data("api");
          $.ajax({ type: "PATCH", url: api, contentType: "application/json",
            data: JSON.stringify({ id: id, name: row.find(".edit-name").val(), author: row.find(".edit-author").val(), year: parseInt(row.find(".edit-year").val()) || null }),
            success: function() { adminMsg(row.closest("[id$=-results]"), "Saved!", true); }
          });
        });
        $(document).on("click", ".appmag-delete", function() {
          if (!confirm("Delete this entry?")) return;
          $.ajax({ type: "DELETE", url: $(this).data("api"), contentType: "application/json",
            data: JSON.stringify({ id: $(this).data("id") }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        appMagSearch("app-search", "app-search-btn", "app-results", "/api/apps", "/api/admin/apps", "/application");
        appMagSearch("mag-search", "mag-search-btn", "mag-results", "/api/mags", "/api/admin/mags", "/magazine");

        // ── BBS ────────────────────────────────────────────────────────
        function bbsRow(r) {
          return '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
            '<div class="col-2 text-truncate white">' + $("<div>").text(r.name || "").html() + '</div>' +
            '<div class="col-2"><input type="text" class="form-control edit-sysop" value="' + $("<div>").text(r.sysop || "").html() + '" placeholder="Sysop" /></div>' +
            '<div class="col-3"><input type="text" class="form-control edit-address" value="' + $("<div>").text(r.address || "").html() + '" placeholder="Address" /></div>' +
            '<div class="col-2"><input type="text" class="form-control edit-software" value="' + $("<div>").text(r.software || "").html() + '" placeholder="Software" /></div>' +
            '<div class="col-2" style="display:flex;gap:4px">' +
              '<input type="button" class="btn-big bbs-save" value="Save" data-id="' + r.id + '" />' +
              '<input type="button" class="btn-big bbs-delete" value="Del" data-id="' + r.id + '" />' +
            '</div>' +
            '</div>';
        }

        $("#bbs-search-btn").on("click", function() {
          var q = $("#bbs-search").val();
          if (!q) return;
          $.getJSON("/api/admin/bbs?q=" + encodeURIComponent(q), function(rows) {
            if (!rows.length) { $("#bbs-results").html('<div class="lightgrey">No results.</div>'); return; }
            $("#bbs-results").html(rows.map(bbsRow).join(""));
          });
        });
        $("#bbs-search").on("keydown", function(e) { if (e.which === 13) $("#bbs-search-btn").click(); });

        $(document).on("click", ".bbs-save", function() {
          var row = $(this).closest(".entity-row");
          var id = $(this).data("id");
          $.ajax({ type: "PATCH", url: "/api/admin/bbs", contentType: "application/json",
            data: JSON.stringify({ id: id, sysop: row.find(".edit-sysop").val(), address: row.find(".edit-address").val(), software: row.find(".edit-software").val() }),
            success: function() { adminMsg("#bbs-results", "Saved!", true); }
          });
        });
        $(document).on("click", ".bbs-delete", function() {
          if (!confirm("Delete this BBS?")) return;
          $.ajax({ type: "DELETE", url: "/api/admin/bbs", contentType: "application/json",
            data: JSON.stringify({ id: $(this).data("id") }),
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });

        // ── Requests ───────────────────────────────────────────────────
        $("#req-search-btn").on("click", function() {
          var q = $("#req-search").val();
          if (!q) return;
          $.getJSON("/api/requests?filter=" + encodeURIComponent(q) + "&pagesize=30&viewmode=4", function(rows) {
            if (!rows.length) { $("#req-results").html('<div class="lightgrey">No results.</div>'); return; }
            var html = "";
            rows.forEach(function(r) {
              html += '<div class="row amb-1 entity-row" data-id="' + r.id + '">' +
                '<div class="col-5 text-truncate"><a class="magenta" href="/requests/' + r.id + '">' + $("<div>").text(r.title || "").html() + '</a></div>' +
                '<div class="col-3 lightgrey">' + $("<div>").text(r.user || "").html() + '</div>' +
                '<div class="col-2 lightgrey">' + (r.time || "") + '</div>' +
                '<div class="col-2"><input type="button" class="btn-big req-delete" data-id="' + r.id + '" value="Delete" /></div>' +
                '</div>';
            });
            $("#req-results").html(html);
          });
        });
        $("#req-search").on("keydown", function(e) { if (e.which === 13) $("#req-search-btn").click(); });

        $(document).on("click", ".req-delete", function() {
          if (!confirm("Delete this request and all its comments?")) return;
          $.ajax({ type: "DELETE", url: "/api/requests/" + $(this).data("id"), contentType: "application/json",
            data: "{}",
            success: function() { $(this).closest(".entity-row").remove(); }.bind(this)
          });
        });
      `}</Script>
    </SiteLayout>
  );
}

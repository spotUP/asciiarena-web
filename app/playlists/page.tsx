import { notFound } from "next/navigation";
import Script from "next/script";
import { auth } from "@/lib/auth";
import SiteLayout from "@/components/layout/SiteLayout";

export default async function PlaylistsPage() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") notFound();

  return (
    <SiteLayout title="HiPPO pLAYLiSTS">
      <div id="playlist-controls" style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
        <input type="button" className="btn-big" id="pl-first" value="|&lt;" />
        <input type="button" className="btn-big" id="pl-prev" value="&lt;" />
        <span id="pl-page-info" className="lightgrey" style={{ minWidth: "80px", textAlign: "center" }}>1 of 1</span>
        <input type="button" className="btn-big" id="pl-next" value="&gt;" />
        <input type="button" className="btn-big" id="pl-last" value="&gt;|" />
        <input type="text" id="pl-filter" className="form-control" style={{ width: "200px" }} placeholder="Search..." />
      </div>

      <div className="row amb-1">
        <div className="col-6"><a className="white" id="sort-title" style={{ cursor: "pointer" }}>TITLE</a></div>
        <div className="col-3"><a className="white" id="sort-genre" style={{ cursor: "pointer" }}>GENRE</a></div>
        <div className="col-3"><a className="white" id="sort-date" style={{ cursor: "pointer" }}>DATE</a></div>
      </div>

      <div id="playlist-list"></div>

      <div className="apt-1">
        <a href="/submit#playlist">
          <input type="button" className="btn-big" value="Add Playlist" readOnly />
        </a>
      </div>

      <Script id="playlists-init" strategy="afterInteractive">{`
        var plPage = 1, plSort = "uploaddate", plAsc = "D", plFilter = "", plMaxPage = 1;
        var plPageSize = 120;

        function loadPlaylists() {
          var url = "/api/playlists?page=" + plPage + "&sort=" + plSort + "&asc=" + plAsc + "&pagesize=" + plPageSize;
          if (plFilter) url += "&filter=" + encodeURIComponent(plFilter);
          $.getJSON(url, function(rows) {
            var total = rows[0] ? rows[0].total_count : 0;
            plMaxPage = Math.max(1, Math.ceil(total / plPageSize));
            $("#pl-page-info").text(plPage + " of " + plMaxPage);
            var html = "";
            rows.forEach(function(r) {
              html += '<div class="row amb-1">' +
                '<div class="col-6 text-truncate"><a class="magenta" href="/assets/playlists/' + encodeURIComponent(r.filename) + '">' + $("<div>").text(r.title).html() + '</a></div>' +
                '<div class="col-3 text-truncate lightgrey">' + $("<div>").text(r.genre).html() + '</div>' +
                '<div class="col-3 lightgrey">' + r.uploaddate + '</div>' +
                '</div>';
            });
            $("#playlist-list").html(html || '<div class="lightgrey apt-1">No playlists found.</div>');
          });
        }

        function setSort(col) {
          if (plSort === col) { plAsc = plAsc === "A" ? "D" : "A"; }
          else { plSort = col; plAsc = "A"; }
          plPage = 1;
          loadPlaylists();
        }

        $("#sort-title").on("click", function() { setSort("title"); });
        $("#sort-genre").on("click", function() { setSort("genre"); });
        $("#sort-date").on("click", function() { setSort("uploaddate"); });
        $("#pl-first").on("click", function() { plPage = 1; loadPlaylists(); });
        $("#pl-prev").on("click", function() { if (plPage > 1) { plPage--; loadPlaylists(); } });
        $("#pl-next").on("click", function() { if (plPage < plMaxPage) { plPage++; loadPlaylists(); } });
        $("#pl-last").on("click", function() { plPage = plMaxPage; loadPlaylists(); });

        var plFilterTimer;
        $("#pl-filter").on("input", function() {
          clearTimeout(plFilterTimer);
          var val = $(this).val();
          plFilterTimer = setTimeout(function() { plFilter = val; plPage = 1; loadPlaylists(); }, 300);
        });

        loadPlaylists();
      `}</Script>
    </SiteLayout>
  );
}

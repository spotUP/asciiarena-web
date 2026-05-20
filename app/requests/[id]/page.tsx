import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import SiteLayout from "@/components/layout/SiteLayout";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<number, string> = {
  0: "Open",
  1: "Closed (Unfulfilled)",
  2: "Closed (Fulfilled)",
};

const STATUS_BADGE: Record<number, string> = {
  0: "bg-primary",
  1: "bg-warning",
  2: "bg-success",
};

function formatTimestamp(ts: number | null): string {
  if (ts == null) return "";
  const d = new Date(ts * 1000);
  const Y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${Y}-${m}-${day}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const req = await prisma.requests.findUnique({ where: { id: parseInt(id) } });
  if (!req) return {};
  return {
    title: `${req.title} | aSCIIaRENA Requests`,
    description: req.description?.slice(0, 160),
  };
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = parseInt(id);

  const req = await prisma.requests.findUnique({ where: { id: requestId } });
  if (!req) notFound();

  const requester = await prisma.users.findUnique({
    where: { id: req.requestedby },
    select: { nick: true },
  });

  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isAdmin = (session?.user as { rank?: string | null })?.rank === "Admin";
  const isOwner = userId !== null && userId === req.requestedby;
  const canChangeStatus = isAdmin || isOwner;

  const statusLabel = STATUS_LABELS[req.status] ?? "Unknown";
  const statusBadge = STATUS_BADGE[req.status] ?? "bg-secondary";

  return (
    <SiteLayout title="REQUEST DETAIL">
      <div className="row apb-1">
        <div className="header col-lg-12">
          <h2 className="ap-1 bg-header">{req.title}</h2>
        </div>
      </div>

      <div className="col-lg-12 pl-0 d-flex align-items-center" style={{ gap: "12px", marginBottom: "8px" }}>
        <span className={`badge ${statusBadge}`}>{statusLabel}</span>
        <span className="lightgrey">by</span>
        <a href={`/member/${requester?.nick ?? ""}`}>{requester?.nick ?? "unknown"}</a>
        <span className="lightgrey">{formatTimestamp(req.timestamp)}</span>
      </div>

      <div className="col-lg-12 pl-0 apb-1">
        <div className="bg-secondary ap-1" style={{ whiteSpace: "pre-wrap" }}>
          {req.description}
        </div>
      </div>

      {canChangeStatus && (
        <div className="col-lg-12 pl-0 apb-1" id="status-controls">
          <span className="lightgrey">Change status: </span>
          {[
            { label: "Open", value: 0 },
            { label: "Close (Unfulfilled)", value: 1 },
            { label: "Close (Fulfilled)", value: 2 },
          ].map((opt) => (
            <button
              key={opt.value}
              className="btn-secondary apr-1"
              data-status={opt.value}
              id={`status-btn-${opt.value}`}
              style={{ marginRight: "4px", cursor: "pointer" }}
            >
              {opt.label}
            </button>
          ))}
          <span id="status-result"></span>
        </div>
      )}

      {/* Comments */}
      <div className="row apt-1 apb-1">
        <h2 className="bg-header">Comments</h2>
      </div>
      <div id="comments-list"></div>

      {session?.user && (
        <div className="col-lg-12 pl-0 apt-1">
          <div className="row apb-1">
            <div className="col-lg-12">
              <textarea
                id="comment-text"
                className="form-control"
                rows={4}
                placeholder="Add a comment..."
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <input
                type="button"
                className="btn-big"
                value="POST COMMENT"
                id="comment-submit"
              />
              <span id="comment-result" className="apl-1"></span>
            </div>
          </div>
        </div>
      )}

      <Script id="request-detail-init" strategy="afterInteractive">{`
        var requestId = ${requestId};
        var currentUserId = ${userId ?? "null"};

        function loadComments() {
          $.getJSON("/api/requests/" + requestId + "/comments", function(data) {
            var html = "";
            if (!data || data.length === 0) {
              html = '<div class="lightgrey col-lg-12 pl-0">No comments yet.</div>';
            } else {
              data.forEach(function(c) {
                html += '<div class="col-lg-12 pl-0 apb-1 bg-secondary ap-1" style="margin-bottom:4px">' +
                  '<div class="d-flex justify-content-between">' +
                  '<a href="/member/' + (c.user || "") + '">' + (c.user || "unknown") + '</a>' +
                  '<span class="lightgrey">' + (c.time || "") + '</span>' +
                  '</div>' +
                  '<div style="white-space:pre-wrap;margin-top:4px">' + $("<div>").text(c.comment || "").html() + '</div>' +
                  (c.filename ? '<div class="apt-1"><span class="lightgrey">Attachment: </span>' + $("<div>").text(c.filename).html() + '</div>' : '') +
                  '</div>';
              });
            }
            $("#comments-list").html(html);
          });
        }

        loadComments();

        $("#comment-submit").on("click", function() {
          var text = $("#comment-text").val();
          if (!text || !text.trim()) return;
          $.ajax({
            type: "POST",
            url: "/api/requests/" + requestId + "/comments",
            contentType: "application/json",
            data: JSON.stringify({ comment: text }),
            success: function() {
              $("#comment-text").val("");
              $("#comment-result").text("Comment posted.").show();
              setTimeout(function() { $("#comment-result").text(""); }, 3000);
              loadComments();
            },
            error: function() {
              $("#comment-result").text("Failed to post comment.");
              setTimeout(function() { $("#comment-result").text(""); }, 3000);
            }
          });
        });

        $("[data-status]").on("click", function() {
          var newStatus = parseInt($(this).data("status"));
          $.ajax({
            type: "PATCH",
            url: "/api/requests/" + requestId,
            contentType: "application/json",
            data: JSON.stringify({ status: newStatus }),
            success: function() {
              window.location.reload();
            },
            error: function() {
              $("#status-result").text("Failed to update status.");
            }
          });
        });
      `}</Script>
    </SiteLayout>
  );
}

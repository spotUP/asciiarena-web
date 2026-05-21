import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";
import RequestDetailClient from "./RequestDetailClient";
import { prisma } from "@/lib/db";
import { getSession as auth } from "@/lib/session";

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

      <RequestDetailClient
        requestId={requestId}
        canChangeStatus={canChangeStatus}
        isLoggedIn={!!session?.user}
      />
    </SiteLayout>
  );
}

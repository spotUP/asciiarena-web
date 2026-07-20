import Link from "next/link";
import type { Metadata } from "next";
import SiteLayout from "@/components/layout/SiteLayout";

export const metadata: Metadata = {
  title: "Activate account | aSCIIaRENA",
};

const MESSAGES: Record<string, { color: string; lines: string[] }> = {
  ok: {
    color: "green",
    lines: [
      "Your account is now active.",
      "You can log in and start posting collys.",
    ],
  },
  already: {
    color: "yellow",
    lines: ["This account is already active. Just log in."],
  },
  invalid: {
    color: "red",
    lines: [
      "This activation link is invalid or has expired.",
      "Activation links are valid for 7 days. Register again or use",
      "the password reminder to receive a fresh link.",
    ],
  },
};

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const msg = MESSAGES[status ?? ""] ?? MESSAGES.invalid;

  return (
    <SiteLayout title="ACTiVATE">
      <div className="container-fluid apt-1 apb-1">
        {msg.lines.map((line, i) => (
          <div key={i} className="row">
            <div className={`col-12 ${msg.color}`}>{line}</div>
          </div>
        ))}
        <div className="row apt-1">
          <div className="col-12">
            <Link className="magenta" href="/login">Go to login</Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

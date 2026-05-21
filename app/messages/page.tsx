import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ sendmsg?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { sendmsg } = await searchParams;
  const initialReceiverId = sendmsg ? parseInt(sendmsg) || null : null;
  return (
    <SiteLayout title="MESSAGES">
      <MessagesClient
        userId={session.user.id ?? ""}
        userNick={session.user.name ?? ""}
        initialReceiverId={initialReceiverId}
      />
    </SiteLayout>
  );
}

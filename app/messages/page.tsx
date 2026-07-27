import { getSession as auth } from "@/lib/session";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ sendmsg?: string; thread?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { sendmsg, thread } = await searchParams;
  const initialReceiverId = sendmsg ? parseInt(sendmsg) || null : null;
  // Message notifications link to /messages?thread=123 (see the POST handler in
  // app/api/messages/route.ts). This param used to be ignored, which is why
  // clicking a notification always dropped you on the bare list.
  const initialThreadId = thread ? parseInt(thread) || null : null;
  return (
    <SiteLayout title="MESSAGES">
      <MessagesClient
        userId={session.user.id ?? ""}
        userNick={session.user.name ?? ""}
        initialReceiverId={initialReceiverId}
        initialThreadId={initialThreadId}
      />
    </SiteLayout>
  );
}

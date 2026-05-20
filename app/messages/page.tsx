import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/layout/SiteLayout";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SiteLayout title="MESSAGES">
      <MessagesClient
        userId={session.user.id ?? ""}
        userNick={session.user.name ?? ""}
      />
    </SiteLayout>
  );
}

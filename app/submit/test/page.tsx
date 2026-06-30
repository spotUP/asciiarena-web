import { redirect } from "next/navigation";

// The tester is now merged into the normal submit flow — picking a file there
// shows the editable preview. Keep this path working by redirecting.
export default function CollyTestPage() {
  redirect("/submit");
}

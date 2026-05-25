import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <form action={async () => {
      "use server";
      await signOut({ redirect: false });
      redirect("/");
    }}>
      <button type="submit" className="dropdown-item ascii">
        Logout
      </button>
    </form>
  );
}

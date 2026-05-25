import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <form action={async () => {
      "use server";
      await signOut({ redirectTo: "/" });
    }}>
      <button type="submit" className="dropdown-item ascii">
        Logout
      </button>
    </form>
  );
}

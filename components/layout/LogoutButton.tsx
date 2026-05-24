"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="dropdown-item ascii"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Logout
    </button>
  );
}

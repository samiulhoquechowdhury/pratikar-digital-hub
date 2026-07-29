"use client";

import Link from "next/link";

import { RequireStaff } from "@/shared/components/RequireStaff";
import { useAuth } from "@/shared/providers/AuthProvider";

function AdminHome() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Pratikar Admin</h1>
      <p>
        Signed in as {user?.name ?? "staff"} ({user?.role}).{" "}
        <button type="button" onClick={logout}>
          Sign out
        </button>
      </p>
      <ul>
        <li>
          <Link href="/templates">Templates</Link>
        </li>
      </ul>
    </main>
  );
}

export default function AdminHomePage() {
  return (
    <RequireStaff>
      <AdminHome />
    </RequireStaff>
  );
}

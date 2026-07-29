"use client";

import Link from "next/link";

import { UserList } from "@/features/users";
import { RequireStaff } from "@/shared/components/RequireStaff";

export default function UsersPage() {
  return (
    <RequireStaff>
      <main>
        <p>
          <Link href="/">← Admin home</Link>
        </p>
        <h1>Users</h1>
        <UserList />
      </main>
    </RequireStaff>
  );
}

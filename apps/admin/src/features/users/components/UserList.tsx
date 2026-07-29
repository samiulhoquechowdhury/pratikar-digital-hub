"use client";

import { Role } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { usersApi, type AdminUser } from "../api/usersApi";

import { useAuth } from "@/shared/providers/AuthProvider";

const ROLES: readonly Role[] = [
  Role.CUSTOMER,
  Role.SUPPORT,
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

export function UserList() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Role changes are SUPER_ADMIN-only on the API; anyone else gets a read-only
  // list rather than controls that always 403.
  const canChangeRoles = currentUser?.role === Role.SUPER_ADMIN;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setUsers(await usersApi.list());
      setError(null);
    } catch {
      setError("Couldn't load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (target: AdminUser, role: Role) => {
    const who = target.email ?? target.phone ?? target.id;
    if (!window.confirm(`Change ${who} from ${target.role} to ${role}?`))
      return;

    setBusyId(target.id);
    setActionError(null);
    try {
      await usersApi.updateRole(target.id, role);
      await load();
    } catch {
      setActionError("Couldn't change that role.");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <p>Loading users…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      {actionError && <p role="alert">{actionError}</p>}
      <table>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Joined</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            return (
              <tr key={user.id}>
                <td>{user.email ?? user.phone ?? user.id}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {canChangeRoles && !isSelf ? (
                    <select
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(e) =>
                        void changeRole(user, e.target.value as Role)
                      }
                      aria-label={`Role for ${user.email ?? user.id}`}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      {user.role}
                      {/* Demoting yourself could leave the system with no
                          super admin and no way to appoint one. */}
                      {isSelf && canChangeRoles && " (you)"}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { Role } from "@pratikar/types";
import {
  Alert,
  Badge,
  EmptyState,
  Loading,
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { usersApi, type AdminUser } from "../api/usersApi";

const ROLES: readonly Role[] = [
  Role.CUSTOMER,
  Role.SUPPORT,
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

/**
 * Staff roles are visually separated from customers. On a list that is mostly
 * customers, the handful of accounts that can refund money or publish content
 * are the ones worth spotting at a glance.
 */
const ROLE_TONE: Record<string, "neutral" | "brand" | "warning"> = {
  [Role.CUSTOMER]: "neutral",
  [Role.SUPPORT]: "brand",
  [Role.CONTENT_MANAGER]: "brand",
  [Role.ADMIN]: "warning",
  [Role.SUPER_ADMIN]: "warning",
};

const LABEL: Record<string, string> = {
  [Role.CUSTOMER]: "Customer",
  [Role.SUPPORT]: "Support",
  [Role.CONTENT_MANAGER]: "Content manager",
  [Role.ADMIN]: "Admin",
  [Role.SUPER_ADMIN]: "Super admin",
};

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

  if (isLoading) return <Loading label="Loading users…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (users.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        description="Accounts are created the first time someone signs in with a code or with Google."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert tone="danger" role="alert">
          {actionError}
        </Alert>
      )}

      {!canChangeRoles && (
        <Alert tone="info">
          Only a Super Admin can change roles. This list is read-only for your
          account.
        </Alert>
      )}

      <Table>
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Joined</TH>
            <TH>Role</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            return (
              <TR key={user.id}>
                <TD>
                  <span className="font-medium">
                    {user.email ?? user.phone ?? user.id}
                  </span>
                  {user.name && (
                    <span className="mt-0.5 block text-xs text-ink-subtle">
                      {user.name}
                    </span>
                  )}
                </TD>
                <TD muted>
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TD>
                <TD>
                  {canChangeRoles && !isSelf ? (
                    <Select
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(e) =>
                        void changeRole(user, e.target.value as Role)
                      }
                      aria-label={`Role for ${user.email ?? user.id}`}
                      className="max-w-[12rem] py-1.5 text-sm"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {LABEL[role] ?? role}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Badge tone={ROLE_TONE[user.role] ?? "neutral"}>
                        {LABEL[user.role] ?? user.role}
                      </Badge>
                      {/* Demoting yourself could leave the system with no
                            super admin and no way to appoint one. */}
                      {isSelf && canChangeRoles && (
                        <span className="text-xs text-ink-subtle">
                          you — can&apos;t change your own role
                        </span>
                      )}
                    </span>
                  )}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

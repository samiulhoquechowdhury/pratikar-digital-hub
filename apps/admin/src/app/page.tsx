"use client";

import { Card, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";

import { AnalyticsDashboard } from "@/features/analytics";
import { RequireStaff } from "@/shared/components/RequireStaff";
import { sectionsFor } from "@/shared/lib/sections";
import { useAuth } from "@/shared/providers/AuthProvider";

/** Mirrors @Roles on GET /admin/analytics. */
const ANALYTICS_ROLES = ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"];

function AdminHome() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const available = sectionsFor(user?.role);

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description="Everything you can manage from here, based on your role."
      />
      <PageBody>
        {ANALYTICS_ROLES.includes(role) && (
          <div className="mb-10">
            <AnalyticsDashboard />
          </div>
        )}
        <h2 className="mb-4 text-xl font-semibold">Manage</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((section) => (
            <li key={section.href}>
              <Card className="h-full p-6 transition-shadow hover:shadow-raised">
                <h3 className="text-lg">
                  <Link
                    href={section.href}
                    className="text-ink hover:text-primary"
                  >
                    {section.label}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {section.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>

        {available.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              Your account ({role || "unknown role"}) doesn&apos;t have access
              to any admin sections. Ask a Super Admin to check your role.
            </p>
          </Card>
        )}
      </PageBody>
    </>
  );
}

export default function AdminHomePage() {
  return (
    <RequireStaff>
      <AdminHome />
    </RequireStaff>
  );
}

"use client";

import { Card, PageBody, PageHeader } from "@pratikar/ui";
import Link from "next/link";

import { RequireStaff } from "@/shared/components/RequireStaff";
import { useAuth } from "@/shared/providers/AuthProvider";

/**
 * Which sections a role can actually use. This mirrors the @Roles decorators
 * on the API controllers — it is presentation only and the API re-checks every
 * call, but showing a Content Manager a Users card that 403s is a worse
 * experience than not showing it.
 */
const SECTIONS = [
  {
    href: "/templates",
    title: "Templates",
    body: "Create and edit document templates, including the field schema customers fill in.",
    roles: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/content-library",
    title: "Content library",
    body: "Publish e-books and checklists, and set their prices.",
    roles: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/courses",
    title: "Courses",
    body: "Manage courses, module order, and access duration.",
    roles: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/reviews",
    title: "Review queue",
    body: "Claim documents awaiting a lawyer review and return them with comments.",
    roles: ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/orders",
    title: "Orders",
    body: "Every order placed, with refunds for Admins and above.",
    roles: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  },
  {
    href: "/users",
    title: "Users",
    body: "Accounts and role changes.",
    roles: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  },
];

function AdminHome() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const available = SECTIONS.filter((section) => section.roles.includes(role));

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description="Everything you can manage from here, based on your role."
      />
      <PageBody>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((section) => (
            <li key={section.href}>
              <Card className="h-full p-6 transition-shadow hover:shadow-raised">
                <h2 className="text-lg">
                  <Link
                    href={section.href}
                    className="text-ink hover:text-primary"
                  >
                    {section.title}
                  </Link>
                </h2>
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

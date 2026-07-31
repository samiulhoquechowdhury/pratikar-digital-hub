"use client";

import Link from "next/link";

import { useAuth } from "@/shared/providers/AuthProvider";

import { useTemplates } from "../hooks/useTemplates";

export function TemplateList() {
  const { user } = useAuth();
  const { templates, isLoading, error } = useTemplates(!!user);

  if (!user) {
    return (
      <p>
        <Link href="/login">Sign in</Link> to browse templates.
      </p>
    );
  }

  if (isLoading) return <p>Loading templates…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (templates.length === 0) return <p>No templates published yet.</p>;

  return (
    <ul>
      {templates.map((template) => (
        <li key={template.id}>
          <Link href={`/documents/${template.id}`}>{template.title}</Link>
        </li>
      ))}
    </ul>
  );
}

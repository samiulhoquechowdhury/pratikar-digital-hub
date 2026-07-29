"use client";

import Link from "next/link";

import { useTemplates } from "../hooks/useTemplates";
import { paiseToRupees } from "../lib/fieldSchema";

export function TemplateList() {
  const { templates, isLoading, error } = useTemplates();

  if (isLoading) return <p>Loading templates…</p>;
  if (error) return <p role="alert">{error}</p>;

  if (templates.length === 0) {
    return (
      <div>
        <p>No templates yet.</p>
        <Link href="/templates/new">Create the first one</Link>
      </div>
    );
  }

  return (
    <div>
      <p>
        <Link href="/templates/new">New template</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            <th scope="col">Fields</th>
            <th scope="col">Price</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id}>
              <td>{template.title}</td>
              <td>{template.category}</td>
              <td>{template.status}</td>
              <td>{template.fieldSchema.length}</td>
              <td>₹{paiseToRupees(template.priceInPaise)}</td>
              <td>
                <Link href={`/templates/${template.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

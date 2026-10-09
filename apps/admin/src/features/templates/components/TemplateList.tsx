"use client";

import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  SkeletonTable,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import Link from "next/link";

import { useTemplates } from "../hooks/useTemplates";
import { paiseToRupees } from "../lib/fieldSchema";

/** DRAFT and ARCHIVED aren't purchasable; PUBLISHED is. Make that obvious. */
const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
} as const;

export function TemplateList() {
  const { templates, isLoading, error } = useTemplates();

  if (isLoading)
    return <SkeletonTable rows={6} columns={7} label="Loading templates…" />;
  if (error)
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );

  if (templates.length === 0) {
    return (
      <EmptyState
        title="No templates yet"
        description="Templates are what customers fill in to generate a document."
        action={
          <ButtonLink href="/templates/new">Create a template</ButtonLink>
        }
      />
    );
  }

  return (
    <Table label="Templates">
      <THead>
        <TR>
          <TH>Title</TH>
          <TH secondary>Category</TH>
          <TH>Status</TH>
          <TH align="right" secondary>
            Fields
          </TH>
          <TH align="right">Price</TH>
          <TH align="right">
            <span className="sr-only">Actions</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {templates.map((template) => (
          <TR key={template.id}>
            <TD>
              <Link
                href={`/templates/${template.id}`}
                className="font-medium text-ink hover:text-primary"
              >
                {template.title}
              </Link>
            </TD>
            <TD secondary muted>
              {template.category}
            </TD>
            <TD>
              <Badge tone={STATUS_TONE[template.status]}>
                {template.status}
              </Badge>
            </TD>
            <TD secondary align="right" muted>
              {template.fieldSchema.length}
            </TD>
            <TD align="right">₹{paiseToRupees(template.priceInPaise)}</TD>
            <TD align="right">
              <Link
                href={`/templates/${template.id}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Edit
              </Link>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

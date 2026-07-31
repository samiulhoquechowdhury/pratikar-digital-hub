"use client";

import type { TemplateStatus } from "@pratikar/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  paiseToRupees,
  rupeesToPaise,
} from "@/features/templates/lib/fieldSchema";

import { coursesApi, type Course, type CourseModule } from "../api/coursesApi";
import { validateModules } from "../lib/modules";

import { ModuleEditor } from "./ModuleEditor";

const STATUSES: readonly TemplateStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function CourseForm({ existing }: { existing?: Course }) {
  const router = useRouter();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(
    existing ? paiseToRupees(existing.priceInPaise) : "",
  );
  const [accessDays, setAccessDays] = useState(
    String(existing?.accessDurationDays ?? 180),
  );
  const [status, setStatus] = useState<TemplateStatus>(
    existing?.status ?? "DRAFT",
  );
  const [modules, setModules] = useState<CourseModule[]>(
    existing?.modules ?? [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<ReturnType<typeof validateModules>>(
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceInPaise = rupeesToPaise(price);
    const accessDurationDays = Number(accessDays);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (priceInPaise === null) {
      setError("Price must be an amount of 0 or more, in rupees.");
      return;
    }
    if (!Number.isInteger(accessDurationDays) || accessDurationDays < 1) {
      setError("Access duration must be a whole number of days, at least 1.");
      return;
    }

    const moduleProblems = validateModules(modules);
    setProblems(moduleProblems);
    if (moduleProblems.length > 0) {
      setError("Fix the module problems below before saving.");
      return;
    }
    // A published course with no modules sells access to nothing.
    if (status === "PUBLISHED" && modules.length === 0) {
      setError("Add at least one module before publishing.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priceInPaise,
        accessDurationDays,
        status,
      };

      const saved = existing
        ? await coursesApi.update(existing.id, payload)
        : await coursesApi.create(payload);

      // Modules are a separate endpoint, so a course is saved first and its
      // modules replaced second. If this second call fails the course still
      // exists — say so rather than implying nothing was saved.
      try {
        await coursesApi.replaceModules(saved.id, modules);
      } catch {
        setError(
          "The course was saved, but its modules could not be updated. Reopen it and try the modules again.",
        );
        setIsSaving(false);
        return;
      }

      router.push(`/courses/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save the course.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="price">Price (₹)</label>
        <input
          id="price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="2499"
        />
      </div>

      <div>
        <label htmlFor="accessDays">Access duration (days)</label>
        <input
          id="accessDays"
          inputMode="numeric"
          value={accessDays}
          onChange={(e) => setAccessDays(e.target.value)}
        />
        {/* Changing this only affects future enrolments — existing rows
            already carry a computed expiresAt. */}
        <small>
          Applies to new enrolments only. Existing customers keep the window
          they enrolled under.
        </small>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TemplateStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <ModuleEditor
        modules={modules}
        problems={problems}
        onChange={setModules}
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : existing ? "Save changes" : "Create course"}
      </button>
    </form>
  );
}

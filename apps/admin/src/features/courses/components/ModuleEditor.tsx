"use client";

import { Button, Field, Input } from "@pratikar/ui";
import Link from "next/link";

import type { CourseModule } from "../api/coursesApi";
import {
  addModule,
  moveModule,
  removeModule,
  updateModule,
  type ModuleProblem,
} from "../lib/modules";

interface Props {
  modules: CourseModule[];
  problems: ModuleProblem[];
  onChange: (next: CourseModule[]) => void;
  /** Absent while creating — a module has no id to author a test against yet. */
  courseId?: string;
}

/**
 * Playback order is list position — the helpers in lib/modules renumber after
 * every move, so there is no `order` input to get out of step with what's on
 * screen. The number badge is the position, and it's read-only on purpose.
 */
export function ModuleEditor({ modules, problems, onChange, courseId }: Props) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-base">Modules</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Listed in playback order. Positions renumber automatically when you
            move a module.
          </p>
        </div>
        <span className="text-sm text-ink-subtle">
          {modules.length} {modules.length === 1 ? "module" : "modules"}
        </span>
      </div>

      {modules.length === 0 ? (
        <p className="mt-5 rounded-card border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
          No modules yet. A course needs at least one before it can be
          published.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {modules.map((module, index) => {
            const moduleProblems = problems.filter((p) => p.index === index);
            const hasProblem = moduleProblems.length > 0;

            return (
              <li
                key={index}
                className={`rounded-card border p-4 ${
                  hasProblem
                    ? "border-danger-border bg-danger-subtle"
                    : "border-line bg-canvas"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-ink-inverse"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-4">
                    <Field label="Title" htmlFor={`module-title-${index}`}>
                      <Input
                        id={`module-title-${index}`}
                        value={module.title}
                        onChange={(e) =>
                          onChange(
                            updateModule(modules, index, {
                              title: e.target.value,
                            }),
                          )
                        }
                        placeholder="Introduction"
                      />
                    </Field>

                    <Field
                      label="Cloudflare Stream video ID"
                      htmlFor={`module-video-${index}`}
                      hint="Without this the module is an empty player for a paying customer."
                    >
                      <Input
                        id={`module-video-${index}`}
                        value={module.videoAssetId}
                        onChange={(e) =>
                          onChange(
                            updateModule(modules, index, {
                              videoAssetId: e.target.value,
                            }),
                          )
                        }
                        placeholder="ea95132c15732412d22c1476fa83f27a"
                        className="font-mono text-sm"
                      />
                    </Field>

                    {/*
                      Only once the module exists server-side: the test is
                      authored against a module id, and an unsaved row hasn't
                      got one. Saving the course first is the prerequisite,
                      which is what the hint says when it isn't available.
                    */}
                    {courseId && module.id ? (
                      <Link
                        href={`/courses/${courseId}/modules/${module.id}/quiz`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                      >
                        <span aria-hidden>✎</span> Edit this lesson&apos;s test
                      </Link>
                    ) : (
                      <p className="text-xs text-ink-subtle">
                        Save the course to add a test to this lesson.
                      </p>
                    )}

                    {hasProblem && (
                      <ul role="alert" className="space-y-1">
                        {moduleProblems.map((p, i) => (
                          <li key={i} className="text-sm text-danger-text">
                            {p.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onChange(moveModule(modules, index, index - 1))
                      }
                      disabled={index === 0}
                      className="rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-ink-muted hover:bg-surface-sunken disabled:opacity-40"
                    >
                      <span className="sr-only">Move up</span>
                      <span aria-hidden>↑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(moveModule(modules, index, index + 1))
                      }
                      disabled={index === modules.length - 1}
                      className="rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-ink-muted hover:bg-surface-sunken disabled:opacity-40"
                    >
                      <span className="sr-only">Move down</span>
                      <span aria-hidden>↓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(removeModule(modules, index))}
                      className="rounded-control border border-danger-border px-2 py-1 text-xs text-danger-text hover:bg-danger-subtle"
                    >
                      <span className="sr-only">Remove module {index + 1}</span>
                      <span aria-hidden>×</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange(addModule(modules))}
        >
          Add module
        </Button>
      </div>
    </div>
  );
}

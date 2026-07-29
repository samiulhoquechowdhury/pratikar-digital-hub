"use client";

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
}

export function ModuleEditor({ modules, problems, onChange }: Props) {
  return (
    <fieldset>
      <legend>Modules</legend>
      <p>
        Listed in playback order — use the move buttons to reorder. Positions
        are renumbered automatically.
      </p>

      {modules.length === 0 && <p>No modules yet.</p>}

      <ol>
        {modules.map((module, index) => {
          const moduleProblems = problems.filter((p) => p.index === index);
          return (
            <li key={index}>
              <label htmlFor={`module-title-${index}`}>Title</label>
              <input
                id={`module-title-${index}`}
                value={module.title}
                onChange={(e) =>
                  onChange(
                    updateModule(modules, index, { title: e.target.value }),
                  )
                }
                placeholder="Introduction"
              />

              <label htmlFor={`module-video-${index}`}>
                Cloudflare Stream video ID
              </label>
              <input
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
              />

              {moduleProblems.length > 0 && (
                <ul role="alert">
                  {moduleProblems.map((p, i) => (
                    <li key={i}>{p.message}</li>
                  ))}
                </ul>
              )}

              <div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(moveModule(modules, index, index - 1))
                  }
                  disabled={index === 0}
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(moveModule(modules, index, index + 1))
                  }
                  disabled={index === modules.length - 1}
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => onChange(removeModule(modules, index))}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={() => onChange(addModule(modules))}>
        Add module
      </button>
    </fieldset>
  );
}

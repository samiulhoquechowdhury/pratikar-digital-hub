"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Icon } from "@/shared/components/Icon";

export interface FaqGroup {
  category: string;
  items: { id: string; question: string; answer: string }[];
}

/**
 * The FAQ, as questions that open to their answer.
 *
 * Each question has its own address (/faq#<id>) — the assistant links to
 * them — so arriving on one opens it and scrolls it into view.
 */
export function FaqList({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      setOpen(id);
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`faq-${group.category}`}>
          <h2 id={`faq-${group.category}`} className="text-2xl font-bold">
            {group.category}
          </h2>
          <ul className="mt-5 space-y-3">
            {group.items.map((item) => {
              const isOpen = open === item.id;
              return (
                <li
                  key={item.id}
                  id={item.id}
                  className={`scroll-mt-36 rounded-2xl border border-line bg-surface transition-shadow ${isOpen ? "shadow-float" : ""}`}
                >
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${item.id}-answer`}
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left font-display text-base font-bold text-ink transition-colors hover:bg-paper"
                    >
                      {item.question}
                      <Icon
                        icon={ChevronDown}
                        className={`shrink-0 text-ink-subtle transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </h3>
                  <div
                    id={`${item.id}-answer`}
                    hidden={!isOpen}
                    className="whitespace-pre-line px-6 pb-6 text-sm leading-relaxed text-ink-muted"
                  >
                    {item.answer}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

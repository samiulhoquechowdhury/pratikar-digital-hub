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
          <h2 id={`faq-${group.category}`} className="text-xl">
            {group.category}
          </h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {group.items.map((item) => {
              const isOpen = open === item.id;
              return (
                <li key={item.id} id={item.id} className="scroll-mt-28">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${item.id}-answer`}
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition-colors hover:bg-surface-sunken"
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
                    className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-ink-muted"
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

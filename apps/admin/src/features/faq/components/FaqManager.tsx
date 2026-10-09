"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SkeletonList,
  Textarea,
} from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { faqApi, type Faq, type FaqInput } from "../api/faqApi";

const BLANK: FaqInput = {
  question: "",
  answer: "",
  category: "",
  order: 0,
  published: false,
};

/**
 * The questions on the site's FAQ page. Published ones are also what the AI
 * assistant answers "how does it work" questions from — so publishing an
 * answer here changes what the assistant says, within a minute.
 */
export function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    input: FaqInput;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setFaqs(await faqApi.all());
    } catch {
      setError("Couldn't load the FAQ.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id) await faqApi.update(editing.id, editing.input);
      else await faqApi.create(editing.input);
      setEditing(null);
      await load();
    } catch {
      setError(
        "Couldn't save. A question needs at least 5 characters, an answer 10, and a category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (faq: Faq) => {
    if (!window.confirm(`Delete "${faq.question}"? This can't be undone.`))
      return;
    setError(null);
    try {
      await faqApi.remove(faq.id);
      await load();
    } catch {
      setError("Couldn't delete that question.");
    }
  };

  const togglePublished = async (faq: Faq) => {
    setError(null);
    try {
      await faqApi.update(faq.id, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        published: !faq.published,
      });
      await load();
    } catch {
      setError("Couldn't change that question.");
    }
  };

  if (!faqs && !error)
    return <SkeletonList rows={5} label="Loading the FAQ…" />;

  const categories = [...new Set((faqs ?? []).map((faq) => faq.category))];
  const set = <K extends keyof FaqInput>(key: K, value: FaqInput[K]) =>
    setEditing((current) =>
      current
        ? { ...current, input: { ...current.input, [key]: value } }
        : current,
    );

  return (
    <div className="space-y-6">
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      {editing ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">
            {editing.id ? "Edit question" : "New question"}
          </h2>
          <form
            className="mt-4 max-w-2xl space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Question" htmlFor="faq-question">
              <Input
                id="faq-question"
                value={editing.input.question}
                maxLength={200}
                onChange={(e) => set("question", e.target.value)}
              />
            </Field>
            <Field
              label="Answer"
              htmlFor="faq-answer"
              hint="Plain text. The AI assistant repeats this wording, so keep it accurate."
            >
              <Textarea
                id="faq-answer"
                rows={6}
                value={editing.input.answer}
                maxLength={3000}
                onChange={(e) => set("answer", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Category"
                htmlFor="faq-category"
                hint="A heading on the FAQ page."
              >
                <Input
                  id="faq-category"
                  list="faq-categories"
                  value={editing.input.category}
                  maxLength={40}
                  onChange={(e) => set("category", e.target.value)}
                />
                <datalist id="faq-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>
              <Field
                label="Position"
                htmlFor="faq-order"
                hint="Lower comes first within its category."
              >
                <Input
                  id="faq-order"
                  type="number"
                  min={0}
                  max={999}
                  value={editing.input.order}
                  onChange={(e) => set("order", Number(e.target.value) || 0)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={editing.input.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              Published — shown on the FAQ page and used by the assistant
            </label>
            <div className="flex gap-3">
              <Button type="submit" loading={saving} loadingLabel="Saving…">
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setEditing({ id: null, input: BLANK })}>
          Add a question
        </Button>
      )}

      {faqs && faqs.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add the questions customers ask most."
        />
      ) : (
        categories.map((category) => (
          <section key={category}>
            <h2 className="text-base font-semibold">{category}</h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {faqs!
                .filter((faq) => faq.category === category)
                .map((faq) => (
                  <li
                    key={faq.id}
                    className="flex flex-wrap items-start gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {faq.question}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">
                        {faq.answer}
                      </p>
                    </div>
                    <Badge tone={faq.published ? "success" : "warning"}>
                      {faq.published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex gap-3 text-sm font-semibold">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() =>
                          setEditing({
                            id: faq.id,
                            input: {
                              question: faq.question,
                              answer: faq.answer,
                              category: faq.category,
                              order: faq.order,
                              published: faq.published,
                            },
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => void togglePublished(faq)}
                      >
                        {faq.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className="text-danger-text hover:underline"
                        onClick={() => void remove(faq)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

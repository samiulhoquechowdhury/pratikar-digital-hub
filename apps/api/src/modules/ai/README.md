AI Document Generator (conversational field collection) and AI Chatbot Assistant (RAG over site content, template catalog, course catalog).

- `knowledge-base/` — **built.** Keeps `KnowledgeBaseDocument` in step with published templates, courses and content items (docs/trd.md 4.6). Voyage AI embeddings, pgvector storage, BullMQ queue `knowledge-base-index`.
- Chatbot retrieval + generation — not yet built (Milestone 4, item 2). Embed the question with `input_type: "query"`, not the document call.
- AI Document Generator — not yet built (Milestone 4, item 3).

AI Document Generator (conversational field collection) and AI Chatbot Assistant (RAG over site content, template catalog, course catalog).

- `knowledge-base/` — **built.** Keeps `KnowledgeBaseDocument` in step with published templates, courses and content items (docs/trd.md 4.6). Voyage AI embeddings, pgvector storage, BullMQ queue `knowledge-base-index`.
- `chat/` — **built.** `POST /ai/chat` (public, 10/min per IP): retrieves from the knowledge base with a query-mode embedding, re-reads each hit's live row (published only, current price), and answers with Claude (`claude-opus-5-5` at low effort, server-side refusal fallback on). Returns only the sources the answer cites. No key → 503 `AI_NOT_CONFIGURED`, and the web chat falls back to its scripted preview.
- AI Document Generator — not yet built (Milestone 4, item 3).

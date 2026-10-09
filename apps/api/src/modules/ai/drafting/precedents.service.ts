import { Injectable, Logger } from "@nestjs/common";

import { docxToText } from "../../../common/office/docx-text";
import { StorageService } from "../../storage/storage.service";
import {
  KnowledgeBaseSearch,
  type FormHit,
} from "../knowledge-base/knowledge-base-search.service";

import type { DraftBrief, DraftReference, Precedent } from "./draft-prompt";

/** At most this many precedents per draft. */
const MAX_PRECEDENTS = 2;

/**
 * A second precedent is used only when it is about as close as the first:
 * "Partnership Deed" 0.585 brings "Co-founder Agreement" 0.543 along, but
 * "Leave and Licence Agreement" 0.545 doesn't bring "Leave Application
 * Form" 0.488.
 */
const SECOND_MARGIN = 0.05;

/**
 * Characters of each precedent sent to the model — about 4,000 tokens. A
 * typical form is well under it; a long one is cut, and the opening, the
 * recitals and the first clauses are what set the style anyway.
 */
const MAX_CHARS = 16_000;

/** Extracted texts kept in memory; a popular form is read once, not per draft. */
const CACHE_SIZE = 100;

/**
 * Finds the library forms a custom draft should be modelled on.
 *
 * The library's forms were written by practising advocates. A draft that
 * follows one — its layout, its recitals, its clause wording — reads like
 * the rest of the catalogue and starts the reviewing advocate on familiar
 * ground. The precedent is a reference for form, never a source of facts.
 *
 * Never throws: with no precedent the draft is written from the model's own
 * knowledge, as it was before this existed.
 */
@Injectable()
export class PrecedentFinder {
  private readonly logger = new Logger(PrecedentFinder.name);
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly search: KnowledgeBaseSearch,
    private readonly storage: StorageService,
  ) {}

  /** The closest forms to what the customer asked for, with their text. */
  async find(brief: DraftBrief): Promise<Precedent[]> {
    if (!this.search.isConfigured) return [];
    try {
      // The document's name, not the customer's details: a form is indexed
      // by what it is, and "flat in Pune, rent 25,000" only dilutes that.
      const hits = await this.search.searchForms(brief.documentType, 4);
      return await this.read(pickPrecedents(hits));
    } catch (error) {
      this.logger.warn(
        `No precedents for "${brief.documentType}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  /**
   * The precedents a draft was first written from, read again for a
   * revision — so a change is made against the same reference, not a new
   * search that might find a different one.
   */
  async load(references: DraftReference[]): Promise<Precedent[]> {
    if (references.length === 0) return [];
    try {
      return await this.read(references);
    } catch (error) {
      this.logger.warn(
        `Couldn't reload precedents: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  private async read(refs: DraftReference[]): Promise<Precedent[]> {
    const precedents: Precedent[] = [];
    for (const ref of refs) {
      const text = await this.textOf(ref.fileUrl);
      if (text.trim()) precedents.push({ ...ref, text });
    }
    return precedents;
  }

  private async textOf(key: string): Promise<string> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const text = docxToText(await this.storage.read(key)).slice(0, MAX_CHARS);
    if (this.cache.size >= CACHE_SIZE) {
      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(key, text);
    return text;
  }
}

/**
 * The best match, and the runner-up only if it is nearly as good. Duplicate
 * titles — the library has a few forms uploaded twice — count once.
 */
export function pickPrecedents(hits: FormHit[]): DraftReference[] {
  const [best] = hits;
  if (!best) return [];
  const seen = new Set<string>();
  return hits
    .filter((hit) => hit.score >= best.score - SECOND_MARGIN)
    .filter((hit) => {
      const title = hit.title.trim().toLowerCase();
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    })
    .slice(0, MAX_PRECEDENTS)
    .map(({ id, title, fileUrl }) => ({ id, title, fileUrl }));
}

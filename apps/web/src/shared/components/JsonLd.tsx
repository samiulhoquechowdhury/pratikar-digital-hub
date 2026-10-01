import { serializeJsonLd } from "../lib/seo";

/**
 * schema.org data for search engines. Rendered on the server into the
 * page's HTML, which is where crawlers read it.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escaped in serializeJsonLd so a "</script>" in a title can't close
      // the tag early.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

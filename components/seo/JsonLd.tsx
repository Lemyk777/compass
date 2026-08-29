import { serializeJsonLd, type JsonLd as JsonLdData } from "@/lib/schema";

// The only place structured data is written into the document.
//
// It is one line of rendering and it exists as a component for one reason: the
// `dangerouslySetInnerHTML` has to happen somewhere, and it should happen once,
// next to the escape that makes it safe, rather than at each of the six call
// sites. React escapes children — that is exactly the problem here, because a
// `<script>` body must not be HTML-escaped or the JSON stops parsing, so the
// raw path is forced. `serializeJsonLd` is what earns it.
//
// A server component with no state and no effects: this renders to static HTML
// and never reaches a client bundle.

export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by `serializeJsonLd`, which is unit-tested against a partner
      // name that tries to close the block. Never pass a raw JSON.stringify.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

// Inline JSON-LD scripts. Render directly in server components; Next.js will
// include them in the static HTML so Google reads structured data on first
// crawl.

type Props<T> = { data: T };

export function JsonLd<T extends object>({ data }: Props<T>) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML to avoid React escaping quotes inside the JSON
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

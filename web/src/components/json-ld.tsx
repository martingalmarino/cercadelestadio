type Structured = Record<string, unknown> | null | undefined | false;

export function JsonLd({ data }: { data: Structured[] }) {
  const graph = data.filter((node): node is Record<string, unknown> => Boolean(node));
  if (graph.length === 0) return null;
  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

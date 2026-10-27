type Structured = Record<string, unknown>;

export function JsonLd({ data }: { data: Structured[] }) {
  const payload = {
    "@context": "https://schema.org",
    "@graph": data,
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

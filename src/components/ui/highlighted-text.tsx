import type { ReactNode } from "react";

export function HighlightedText({
  query,
  text,
}: {
  query: string;
  text: string | null | undefined;
}): ReactNode {
  if (!text || !query.trim()) return text ?? null;

  const normalizedText = text.toLocaleLowerCase();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, start);

  while (matchIndex !== -1) {
    if (matchIndex > start) parts.push(text.slice(start, matchIndex));
    parts.push(
      <mark
        className="rounded-sm bg-amber-200 px-0.5 font-semibold text-stone-950"
        key={matchIndex}
      >
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </mark>,
    );
    start = matchIndex + normalizedQuery.length;
    matchIndex = normalizedText.indexOf(normalizedQuery, start);
  }

  if (!parts.length) return text;
  if (start < text.length) parts.push(text.slice(start));
  return parts;
}

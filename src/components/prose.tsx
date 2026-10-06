import { Fragment } from "react";

/** Paragraphs split on blank lines, ``` fenced code blocks, and `backticks` as inline code. */
export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/```[^\n]*\n([\s\S]*?)```/);
  return (
    <div className={`space-y-4 text-[17px] leading-relaxed ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="overflow-x-auto rounded-2xl bg-ink p-4 text-sm leading-relaxed text-white">
            <code>{part.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          part
            .split(/\n\s*\n/)
            .filter((p) => p.trim())
            .map((p, j) => (
              <p key={`${i}-${j}`} className="whitespace-pre-line">
                <InlineCode text={p.trim()} />
              </p>
            ))
        ),
      )}
    </div>
  );
}

export function InlineCode({ text }: { text: string }) {
  return text.split(/(`[^`\n]+`)/).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

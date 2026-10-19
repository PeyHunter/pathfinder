// PROTOTYPE: throwaway. Inline SVG glyphs; each has a viewBox so CSS can size it in cap units.
import type { Status } from "@/lib/progress";

type P = { className?: string };
const svg = (d: React.ReactNode, className?: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
    {d}
  </svg>
);

export const Star = ({ className }: P) =>
  svg(<path fill="currentColor" d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5L7 14.3l-5.3-5 7.2-.9z" />, className);

export const Play = ({ className }: P) => svg(<path fill="currentColor" d="M7 3.5v17a1 1 0 0 0 1.5.9l13-8.5a1 1 0 0 0 0-1.8l-13-8.5A1 1 0 0 0 7 3.5z" />, className);

export const Bang = ({ className }: P) =>
  svg(
    <>
      <rect x="9.5" y="2.5" width="5" height="13" rx="2.5" fill="currentColor" />
      <circle cx="12" cy="20" r="2.6" fill="currentColor" />
    </>,
    className,
  );

export const Lock = ({ className }: P) =>
  svg(
    <>
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="3.5" y="10" width="17" height="12" rx="3" fill="currentColor" />
    </>,
    className,
  );

export const Ring = ({ className }: P) => svg(<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="3.5" />, className);

export const Half = ({ className }: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M12 6a6 6 0 0 1 0 12z" fill="currentColor" />
    </>,
    className,
  );

export const Check = ({ className }: P) =>
  svg(<path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />, className);

/** The next step always shows ▶; otherwise the glyph follows the stored or derived status. */
export function StatusGlyph({ status, next, className }: { status: Status; next: boolean; className?: string }) {
  if (next) return <Play className={className} />;
  switch (status) {
    case "mastered":
      return <Star className={className} />;
    case "needs_review":
      return <Bang className={className} />;
    case "locked":
      return <Lock className={className} />;
    case "in_progress":
      return <Half className={className} />;
    default:
      return <Ring className={className} />;
  }
}

export const levelLabel: Record<Status, string> = {
  mastered: "Mastered",
  needs_review: "Needs review",
  in_progress: "In progress",
  available: "Open",
  locked: "Locked (hint only)",
};

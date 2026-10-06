import type { Status } from "@/lib/progress";

// "locked" only means prerequisites aren't mastered yet; concepts stay open, so it reads as not started.
const LOOK: Record<Status, { label: string; dot: string; text: string }> = {
  mastered: { label: "Mastered", dot: "bg-success", text: "text-success" },
  in_progress: { label: "In progress", dot: "bg-accent", text: "text-accent" },
  needs_review: { label: "Review", dot: "bg-warn", text: "text-warn" },
  available: { label: "Not started", dot: "bg-line", text: "text-ink-3" },
  locked: { label: "Not started", dot: "bg-line", text: "text-ink-3" },
};

export function StatusBadge({ status }: { status: Status }) {
  const l = LOOK[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${l.text}`}>
      <span className={`h-2 w-2 rounded-full ${l.dot}`} />
      {l.label}
    </span>
  );
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line/50" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

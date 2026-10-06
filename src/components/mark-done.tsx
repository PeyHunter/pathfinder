"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Status } from "@/lib/progress";

/** "I understand this concept": marks it done without the quiz, or undoes that. */
export function MarkDone({
  pathId,
  slug,
  status,
  onChange,
  className = "",
}: {
  pathId: number;
  slug: string;
  status: Status;
  onChange?: (status: Status) => void;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = status === "mastered";

  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/paths/${pathId}/concepts/${slug}/done`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !done }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("Couldn’t save that. Is the server running?");
    const body: { status: Status } = await res.json();
    onChange?.(body.status);
    // Progress bars and "Continue" are worked out on the server, so let it recount.
    router.refresh();
  }

  return (
    <div className={`text-[14px] ${className}`}>
      {done ? (
        <span className="text-success">
          ✓ You understand this.{" "}
          <button onClick={toggle} disabled={busy} className="text-link hover:underline disabled:opacity-40">
            Undo
          </button>
        </span>
      ) : (
        <button
          onClick={toggle}
          disabled={busy}
          className="rounded-full border border-line px-3 py-1 text-ink-2 transition-colors hover:border-success hover:text-success disabled:opacity-40"
        >
          {busy ? "Saving…" : "I understand this concept · mark as done"}
        </button>
      )}
      {error && <p className="mt-1 text-danger">{error}</p>}
    </div>
  );
}

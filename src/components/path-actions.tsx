"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Rename / Delete for one path. After deleting, goes home (or refreshes if already there). */
export function PathActions({ id, title, className = "" }: { id: number; title: string; className?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(init: RequestInit) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/paths/${id}`, init).catch(() => null);
    setBusy(false);
    if (res?.ok) return true;
    const body = await res?.json().catch(() => null);
    setError(body?.error ?? "That didn’t work. Is the server running?");
    return false;
  }

  async function save() {
    const ok = await call({ method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: name }) });
    if (ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${title}”? Its progress and quiz answers are deleted too. This can’t be undone.`)) return;
    if (await call({ method: "DELETE" })) {
      router.push("/");
      router.refresh();
    }
  }

  if (editing)
    return (
      <form
        className={`flex flex-wrap items-center gap-2 text-[15px] ${className}`}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          autoFocus
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line px-3 py-1.5 outline-none focus:border-accent"
        />
        <button type="submit" disabled={busy || !name.trim()} className="text-link hover:underline disabled:opacity-40">
          Save
        </button>
        <button type="button" onClick={() => (setEditing(false), setName(title))} className="text-ink-3 hover:underline">
          Cancel
        </button>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>
    );

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm ${className}`}>
      <button onClick={() => setEditing(true)} className="text-link hover:underline">
        Rename
      </button>
      <button onClick={remove} disabled={busy} className="text-danger hover:underline disabled:opacity-40">
        Delete
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

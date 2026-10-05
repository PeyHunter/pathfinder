"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Section } from "@/components/ui";

export default function NewPath() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [level, setLevel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/paths", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ raw, level }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.push(`/paths/${data.id}`);
  }

  return (
    <Section narrow className="animate-rise">
      <h1 className="text-5xl font-semibold">New path</h1>
      <p className="mt-4 text-[21px] text-ink-2 leading-snug">
        Paste everything you want to learn. Typos, Danish, duplicates and half-sentences are all fine.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <label className="block">
          <span className="text-[17px] font-semibold">What do you want to learn?</span>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            placeholder="Namespace, Helm charts, SSH-nøgler, Daemon – a background process…"
            className="mt-3 w-full resize-y rounded-2xl border border-line bg-canvas px-5 py-4 text-[17px] leading-relaxed outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </label>

        <label className="block">
          <span className="text-[17px] font-semibold">What do you already know?</span>
          <span className="ml-2 text-ink-3">Optional</span>
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="e.g. I can use a browser, but I've never used a terminal."
            className="mt-3 w-full rounded-2xl border border-line bg-canvas px-5 py-3.5 text-[17px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </label>

        {error && <p className="text-danger">{error}</p>}
        <Button type="submit" disabled={busy || !raw.trim()}>{busy ? "Starting…" : "Continue"}</Button>
      </form>
    </Section>
  );
}

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "plain";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-accent text-accent hover:bg-accent hover:text-white",
  plain: "text-link hover:underline px-0",
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[15px] font-normal transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

/** Full-width band, alternating white / mist like apple.com sections. */
export function Section({
  tone = "white",
  narrow = false,
  className = "",
  children,
}: {
  tone?: "white" | "mist";
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={tone === "mist" ? "bg-mist" : "bg-canvas"}>
      <div className={`mx-auto ${narrow ? "max-w-[692px]" : "max-w-[980px]"} px-5 py-16 md:py-24 ${className}`}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[17px] font-semibold text-warn mb-2">{children}</p>;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-[var(--radius-card)] bg-canvas p-6 shadow-card ${className}`}>{children}</div>;
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center animate-rise">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-accent" />
      <p className="text-[21px] text-ink-2">{label}</p>
    </div>
  );
}

// PROTOTYPE: throwaway. Data contract every visual variant renders from (read-only, no mutations).
import type { PathProgress } from "@/lib/learning-service";
import type { PathView, listPaths } from "@/lib/path-service";

export type HomePath = ReturnType<typeof listPaths>[number] & { progress: PathProgress | null };
export type HomeProps = { paths: HomePath[] };

/** Only "ready" paths reach a variant; other states keep the real PathScreen. */
export type PathProps = { path: PathView; progress: PathProgress };

export type Variant = {
  key: string;
  name: string;
  Home: (p: HomeProps) => React.ReactNode;
  Path: (p: PathProps) => React.ReactNode;
};

export const statusLabel = {
  normalizing: "Reading your list",
  awaiting_confirmation: "Needs your input",
  generating: "Building",
  ready: "Ready",
  failed: "Something went wrong",
} as const;

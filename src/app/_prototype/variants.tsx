// PROTOTYPE: throwaway. Four visual directions for Home and the path overview, picked by ?variant=.
// Plan: 4 variants of "/" and "/paths/[id]" (ready state), switchable via ?variant=, on the existing routes.
import { PrototypeSwitcher } from "./switcher";
import type { Variant } from "./types";
import { variant as trail } from "./trail";
import { variant as editorial } from "./editorial";
import { variant as console_ } from "./console";
import { variant as arcade } from "./arcade";

export const VARIANTS: Variant[] = [trail, editorial, console_, arcade];

export async function pickVariant(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const raw = (await searchParams).variant;
  const key = typeof raw === "string" ? raw : "";
  return VARIANTS.find((v) => v.key === key) ?? null;
}

export function Switcher({ current }: { current: string }) {
  return <PrototypeSwitcher variants={VARIANTS.map(({ key, name }) => ({ key, name }))} current={current} />;
}

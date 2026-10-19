// PROTOTYPE: throwaway. "Mission control": a dark operator console for Home and the path overview.
import type { Variant } from "../types";
import { Home } from "./home";
import { Path } from "./path";

export const variant: Variant = { key: "console", name: "Mission control", Home, Path };

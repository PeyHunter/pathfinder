import fs from "node:fs";
import path from "node:path";

/** Loads prompts/<name>.md and fills {{placeholders}}. Read on every call so edits apply without a restart. */
export function loadPrompt(name: string, vars: Record<string, string>): string {
  const template = fs.readFileSync(path.join(process.cwd(), "prompts", `${name}.md`), "utf8");
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`Prompt "${name}" uses {{${key}}} but no value was given`);
    return vars[key];
  });
}

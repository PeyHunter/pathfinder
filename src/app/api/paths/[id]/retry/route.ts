import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import { paths } from "@/db/schema";
import { runBuild, runNormalize } from "@/lib/path-service";

// Resumes a failed path from the step that failed.
export async function POST(_: Request, ctx: RouteContext<"/api/paths/[id]/retry">) {
  const id = Number((await ctx.params).id);
  const path = db.select().from(paths).where(eq(paths.id, id)).get();
  if (!path || path.status !== "failed") return Response.json({ error: "Only failed paths can be retried" }, { status: 409 });

  const buildFailed = path.normalizedJson && path.resolutionsJson;
  db.update(paths)
    .set({ status: buildFailed ? "generating" : "normalizing", error: null })
    .where(eq(paths.id, id))
    .run();
  after(() => (buildFailed ? runBuild(id) : runNormalize(id)));
  return Response.json({ ok: true }, { status: 202 });
}

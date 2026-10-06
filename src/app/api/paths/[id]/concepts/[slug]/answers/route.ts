import { z } from "zod";
import { gradeAnswers } from "@/lib/learning-service";
import { MAX_ANSWER_CHARS } from "@/lib/limits";

const Body = z.object({ answers: z.array(z.string().trim().min(1).max(MAX_ANSWER_CHARS)).min(1) });

// Grading takes a few seconds, so this answers synchronously instead of polling.
export async function POST(request: Request, ctx: RouteContext<"/api/paths/[id]/concepts/[slug]/answers">) {
  const { id, slug } = await ctx.params;
  const body = Body.safeParse(await request.json());
  if (!body.success)
    return Response.json({ error: `Answer every question (up to ${MAX_ANSWER_CHARS} characters each).` }, { status: 400 });
  try {
    return Response.json(await gradeAnswers(Number(id), slug, body.data.answers));
  } catch (e) {
    console.error(`[grade ${id}/${slug}]`, e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

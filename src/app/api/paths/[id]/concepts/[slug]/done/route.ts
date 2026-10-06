import { z } from "zod";
import { markConceptDone } from "@/lib/learning-service";

const Body = z.object({ done: z.boolean() });

// "I understand this concept": mark it done (or undo that) without taking the quiz.
export async function POST(request: Request, ctx: RouteContext<"/api/paths/[id]/concepts/[slug]/done">) {
  const { id, slug } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Send { done: true } or { done: false }." }, { status: 400 });
  const status = markConceptDone(Number(id), slug, body.data.done);
  if (!status) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ status });
}

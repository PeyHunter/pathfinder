import { z } from "zod";
import { changeQuizLevel } from "@/lib/learning-service";

const Body = z.object({ direction: z.enum(["harder", "easier"]) });

// Writing 2-3 questions takes a few seconds, so this answers synchronously like grading does.
export async function POST(request: Request, ctx: RouteContext<"/api/paths/[id]/concepts/[slug]/questions">) {
  const { id, slug } = await ctx.params;
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Say whether the questions should be harder or easier." }, { status: 400 });
  try {
    return Response.json(await changeQuizLevel(Number(id), slug, body.data.direction));
  } catch (e) {
    console.error(`[questions ${id}/${slug}]`, e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

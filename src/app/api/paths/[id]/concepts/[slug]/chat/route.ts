import { z } from "zod";
import { askTutor } from "@/lib/learning-service";
import { MAX_CHAT_CHARS } from "@/lib/limits";

const Body = z.object({ question: z.string().trim().min(1).max(MAX_CHAT_CHARS) });

export async function POST(request: Request, ctx: RouteContext<"/api/paths/[id]/concepts/[slug]/chat">) {
  const { id, slug } = await ctx.params;
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: `Write a question (up to ${MAX_CHAT_CHARS} characters).` }, { status: 400 });
  try {
    return Response.json({ reply: await askTutor(Number(id), slug, body.data.question) });
  } catch (e) {
    console.error(`[tutor ${id}/${slug}]`, e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

import { after } from "next/server";
import { z } from "zod";
import { runBuild, startBuild } from "@/lib/path-service";
import { Resolution } from "@/lib/schemas";

const Body = z.object({ resolutions: z.array(Resolution) });

export async function POST(request: Request, ctx: RouteContext<"/api/paths/[id]/confirm">) {
  const id = Number((await ctx.params).id);
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.message }, { status: 400 });
  try {
    startBuild(id, body.data.resolutions);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 409 });
  }
  after(() => runBuild(id));
  return Response.json({ ok: true }, { status: 202 });
}

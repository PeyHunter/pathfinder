import { z } from "zod";
import { deletePath, getPathGraph, renamePath } from "@/lib/path-service";

export async function GET(_: Request, ctx: RouteContext<"/api/paths/[id]">) {
  const { id } = await ctx.params;
  const graph = getPathGraph(Number(id));
  if (!graph) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(graph);
}

const Rename = z.object({ title: z.string().trim().min(1).max(120) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/paths/[id]">) {
  const { id } = await ctx.params;
  const body = Rename.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Give the path a name (up to 120 characters)." }, { status: 400 });
  if (!renamePath(Number(id), body.data.title)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, ctx: RouteContext<"/api/paths/[id]">) {
  const { id } = await ctx.params;
  if (!deletePath(Number(id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

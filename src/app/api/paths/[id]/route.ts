import { getPathGraph } from "@/lib/path-service";

export async function GET(_: Request, ctx: RouteContext<"/api/paths/[id]">) {
  const { id } = await ctx.params;
  const graph = getPathGraph(Number(id));
  if (!graph) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(graph);
}

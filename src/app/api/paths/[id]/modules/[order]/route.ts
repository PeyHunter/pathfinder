import { after } from "next/server";
import { claimModuleContent, getModuleView, runModuleContent } from "@/lib/learning-service";

export async function GET(_: Request, ctx: RouteContext<"/api/paths/[id]/modules/[order]">) {
  const { id, order } = await ctx.params;
  const view = getModuleView(Number(id), Number(order));
  if (!view) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(view);
}

// Starts generating the module's lessons unless they exist or are already being written.
export async function POST(_: Request, ctx: RouteContext<"/api/paths/[id]/modules/[order]">) {
  const { id, order } = await ctx.params;
  if (!getModuleView(Number(id), Number(order))) return Response.json({ error: "Not found" }, { status: 404 });
  const moduleId = claimModuleContent(Number(id), Number(order));
  if (moduleId !== null) after(() => runModuleContent(moduleId));
  return Response.json({ started: moduleId !== null }, { status: 202 });
}

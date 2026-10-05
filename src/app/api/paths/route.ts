import { after } from "next/server";
import { z } from "zod";
import { createPath, listPaths, runNormalize } from "@/lib/path-service";

const Body = z.object({ raw: z.string().trim().min(1), level: z.string().default("") });

export async function GET() {
  return Response.json(listPaths());
}

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Paste at least one concept." }, { status: 400 });
  const id = createPath(body.data.raw, body.data.level);
  after(() => runNormalize(id));
  return Response.json({ id }, { status: 202 });
}

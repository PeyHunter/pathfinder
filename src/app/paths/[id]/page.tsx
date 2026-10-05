import { notFound } from "next/navigation";
import { getPathGraph } from "@/lib/path-service";
import PathScreen from "./path-screen";

export const dynamic = "force-dynamic";

export default async function PathPage({ params }: PageProps<"/paths/[id]">) {
  const { id } = await params;
  const path = getPathGraph(Number(id));
  if (!path) notFound();
  return <PathScreen initial={path} />;
}

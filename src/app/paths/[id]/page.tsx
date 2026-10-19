import { notFound } from "next/navigation";
import { getPathProgress } from "@/lib/learning-service";
import { getPathGraph } from "@/lib/path-service";
import { pickVariant, Switcher } from "../../_prototype/variants";
import PathScreen from "./path-screen";

export const dynamic = "force-dynamic";

export default async function PathPage({ params, searchParams }: PageProps<"/paths/[id]">) {
  const { id } = await params;
  const path = getPathGraph(Number(id));
  if (!path) notFound();
  const progress = path.status === "ready" ? getPathProgress(path.id) : null;
  // PROTOTYPE: ?variant= swaps in a visual direction for ready paths; other states keep the real screen.
  const v = await pickVariant(searchParams);
  if (v && progress)
    return (
      <>
        <v.Path path={path} progress={progress} />
        <Switcher current={v.key} />
      </>
    );
  return (
    <>
      <PathScreen initial={path} progress={progress} />
      <Switcher current="" />
    </>
  );
}

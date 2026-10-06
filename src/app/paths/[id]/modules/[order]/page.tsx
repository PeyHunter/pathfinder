import { notFound } from "next/navigation";
import { after } from "next/server";
import { claimModuleContent, getModuleView, runModuleContent } from "@/lib/learning-service";
import ModuleScreen from "./module-screen";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: PageProps<"/paths/[id]/modules/[order]">) {
  const { id, order } = await params;
  const view = getModuleView(Number(id), Number(order));
  if (!view) notFound();
  // Lessons are written the first time a module is opened, and never again after that.
  if (view.contentStatus === "none") {
    const moduleId = claimModuleContent(view.pathId, view.order);
    if (moduleId !== null) after(() => runModuleContent(moduleId));
    // Show the spinner (and poll) straight away instead of an empty module.
    return <ModuleScreen initial={{ ...view, contentStatus: "generating" }} />;
  }
  return <ModuleScreen initial={view} />;
}

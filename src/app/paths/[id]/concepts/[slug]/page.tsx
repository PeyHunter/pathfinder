import { notFound, redirect } from "next/navigation";
import { openConcept } from "@/lib/learning-service";
import ConceptScreen from "./concept-screen";

export const dynamic = "force-dynamic";

export default async function ConceptPage({ params }: PageProps<"/paths/[id]/concepts/[slug]">) {
  const { id, slug } = await params;
  const view = openConcept(Number(id), slug);
  if (!view) notFound();
  // Lessons are written per module, so send the learner there to have them written first.
  if (!view.lesson) redirect(`/paths/${id}/modules/${view.module.order}`);
  return <ConceptScreen initial={view} />;
}

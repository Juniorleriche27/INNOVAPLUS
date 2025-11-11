// Redirect /opportunities/[id] -> /projects/[id]
import { redirect } from "next/navigation";

export default function OpportunityDetailsAlias({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}`);
}


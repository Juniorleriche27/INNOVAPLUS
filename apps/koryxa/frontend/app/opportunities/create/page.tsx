// Redirect /opportunities/create -> /projects/new
import { redirect } from "next/navigation";

export default function CreateOpportunityAlias() {
  redirect("/projects/new");
}


// Redirect /opportunities -> /projects (alias route)
import { redirect } from "next/navigation";

export default function OpportunitiesAlias() {
  redirect("/projects");
}


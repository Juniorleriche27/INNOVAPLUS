import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cockpit Entreprise | KORYXA",
};

export default function EntrepriseCockpitPage() {
  redirect("/entreprise/demandes");
}

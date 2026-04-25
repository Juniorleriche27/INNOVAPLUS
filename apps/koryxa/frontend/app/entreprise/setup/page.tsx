import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Setup Entreprise | KORYXA",
};

export default function EntrepriseSetupPage() {
  redirect("/entreprise");
}

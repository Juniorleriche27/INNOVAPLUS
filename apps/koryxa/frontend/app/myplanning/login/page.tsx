import { redirect } from "next/navigation";

export default function MyPlanningLoginPage() {
  redirect("/login?redirect=/myplanning/app");
}


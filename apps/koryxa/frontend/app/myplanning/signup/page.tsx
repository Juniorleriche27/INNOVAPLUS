import { redirect } from "next/navigation";

export default function MyPlanningSignupPage() {
  redirect("/signup?redirect=/myplanning/app");
}


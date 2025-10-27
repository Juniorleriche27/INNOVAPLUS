export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  const session = cookies().get("innova_session")?.value;
  if (session) {
    redirect("/me/recommendations");
  }
  return <SignupClient />;
}

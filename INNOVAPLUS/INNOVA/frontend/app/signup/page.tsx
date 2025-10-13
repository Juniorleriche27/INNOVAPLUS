export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  const jar = cookies();
  const access = jar.get("innova_access")?.value;
  if (access) {
    redirect("/me/recommendations");
  }
  return <SignupClient />;
}

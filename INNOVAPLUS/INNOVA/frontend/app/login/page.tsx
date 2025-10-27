export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  const session = cookies().get("innova_session")?.value;
  if (session) redirect("/me/recommendations");
  return <LoginClient />;
}

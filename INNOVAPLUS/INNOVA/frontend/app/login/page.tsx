export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  const access = cookies().get("innova_access")?.value;
  if (access) redirect("/me/recommendations");
  return <LoginClient />;
}

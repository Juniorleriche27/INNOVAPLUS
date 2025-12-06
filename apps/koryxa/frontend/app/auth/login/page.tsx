import { redirect } from "next/navigation";

export default function AuthLoginPage(): null {
  redirect("/login");
  return null;
}

import { redirect } from "next/navigation";

export default function AuthRegisterPage(): null {
  redirect("/signup");
  return null;
}

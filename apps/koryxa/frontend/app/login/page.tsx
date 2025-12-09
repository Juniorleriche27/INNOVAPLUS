export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import LoginClient from "./LoginClient";

// Simplified server component to avoid server-side fetch failures on login.
// Auth check + redirect are handled client-side in LoginClient via AuthProvider.
export default function LoginPage() {
  return <LoginClient />;
}

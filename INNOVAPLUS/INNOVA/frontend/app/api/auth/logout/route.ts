import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const store = cookies();
  store.delete("innova_access");
  store.delete("innova_refresh");
  return NextResponse.json({ ok: true });
}

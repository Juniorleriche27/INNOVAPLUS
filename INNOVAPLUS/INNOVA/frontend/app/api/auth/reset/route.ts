import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse<{ ok: boolean }>> {
  return NextResponse.json({ ok: true });
}

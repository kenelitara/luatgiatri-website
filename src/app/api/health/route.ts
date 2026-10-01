import { NextResponse } from "next/server";

// Minimal readiness stub — Task 3 turns this into a real Postgres check.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
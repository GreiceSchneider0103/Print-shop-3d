import { NextRequest, NextResponse } from "next/server";

import { runFullSync } from "@/lib/sync/run";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summaries = await runFullSync();
  const hasError = summaries.some((s) => s.status === "ERROR");

  return NextResponse.json({ summaries }, { status: hasError ? 207 : 200 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

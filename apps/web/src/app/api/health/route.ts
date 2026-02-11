import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  return NextResponse.json({
    status: "ok",
    service: "grandmas-kitchen-web",
    timestamp: new Date().toISOString(),
    requestId,
  });
}

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    eventName?: string;
    eventProps?: Record<string, unknown>;
  };

  const eventName = body.eventName?.trim();
  if (!eventName) {
    return NextResponse.json({ error: "eventName is required" }, { status: 400 });
  }

  const pool = getPool();
  const userResult = await pool.query<{ id: string }>(
    `select id from users where email = $1 limit 1`,
    [email],
  );

  const userId = userResult.rows[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await pool.query(
    `
      insert into analytics_events (id, user_id, event_name, event_props)
      values ($1, $2, $3, $4::jsonb)
    `,
    [randomUUID(), userId, eventName, JSON.stringify(body.eventProps ?? {})],
  );

  return NextResponse.json({ ok: true });
}

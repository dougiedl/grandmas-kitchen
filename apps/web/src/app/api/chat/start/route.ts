import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";
import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { personaId?: string };
  const persona = LAUNCH_PERSONAS.find((item) => item.id === body.personaId);

  if (!persona) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  const pool = getPool();
  const userResult = await pool.query(
    `
      insert into users (id, email, display_name)
      values ($1, $2, $3)
      on conflict (email)
      do update set display_name = coalesce(excluded.display_name, users.display_name)
      returning id
    `,
    [randomUUID(), email, session.user?.name ?? null],
  );

  const userId = userResult.rows[0]?.id as string;
  const threadId = randomUUID();

  await pool.query(
    `insert into conversation_threads (id, user_id, persona_id) values ($1, $2, $3)`,
    [threadId, userId, persona.id],
  );

  const greeting = `I am ${persona.name}. Tell me what ingredients you have and what you are craving.`;

  await pool.query(
    `insert into messages (id, thread_id, role, content, parsed_entities) values ($1, $2, 'assistant', $3, $4)`,
    [randomUUID(), threadId, greeting, JSON.stringify({ type: "greeting" })],
  );

  return NextResponse.json({ threadId, persona });
}

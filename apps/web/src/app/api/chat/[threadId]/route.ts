import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const pool = getPool();

  const threadResult = await pool.query(
    `
      select t.id, t.persona_id, p.name as persona_name, p.cuisine
      from conversation_threads t
      join users u on u.id = t.user_id
      left join grandma_personas p on p.id = t.persona_id
      where t.id = $1 and u.email = $2
      limit 1
    `,
    [threadId, email],
  );

  if (!threadResult.rows[0]) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messagesResult = await pool.query(
    `
      select id, role, content, parsed_entities, created_at
      from messages
      where thread_id = $1
      order by created_at asc
    `,
    [threadId],
  );

  return NextResponse.json({
    thread: threadResult.rows[0],
    messages: messagesResult.rows,
  });
}

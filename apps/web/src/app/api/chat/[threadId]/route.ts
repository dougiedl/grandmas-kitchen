import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type PgLikeError = {
  code?: string;
};

function isSchemaCompatibilityError(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") {
    return false;
  }
  const error = cause as PgLikeError;
  return error.code === "42P01" || error.code === "42703";
}

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

  const threadResult = await (async () => {
    try {
      return await pool.query(
        `
          select
            t.id,
            t.persona_id,
            p.name as persona_name,
            p.cuisine,
            tss.selected_style_id,
            tss.inferred_style_id,
            tss.confidence as style_confidence,
            tss.reasoning_tags as style_reasoning_tags,
            sc.label as selected_style_label,
            sc.cuisine as selected_style_cuisine,
            sc.region as selected_style_region
          from conversation_threads t
          join users u on u.id = t.user_id
          left join grandma_personas p on p.id = t.persona_id
          left join thread_style_state tss on tss.thread_id = t.id
          left join style_catalog sc on sc.id = tss.selected_style_id
          where t.id = $1 and u.email = $2
          limit 1
        `,
        [threadId, email],
      );
    } catch (cause) {
      if (!isSchemaCompatibilityError(cause)) {
        throw cause;
      }

      return pool.query(
        `
          select
            t.id,
            t.persona_id,
            p.name as persona_name,
            p.cuisine,
            null::text as selected_style_id,
            null::text as inferred_style_id,
            null::double precision as style_confidence,
            null::text[] as style_reasoning_tags,
            null::text as selected_style_label,
            null::text as selected_style_cuisine,
            null::text as selected_style_region
          from conversation_threads t
          join users u on u.id = t.user_id
          left join grandma_personas p on p.id = t.persona_id
          where t.id = $1 and u.email = $2
          limit 1
        `,
        [threadId, email],
      );
    }
  })();

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

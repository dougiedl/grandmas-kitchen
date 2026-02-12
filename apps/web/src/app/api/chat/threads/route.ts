import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query(
    `
      select
        t.id,
        t.persona_id,
        p.name as persona_name,
        p.cuisine,
        coalesce(max(m.created_at), t.created_at) as last_activity,
        (
          array_agg(m.content order by m.created_at desc)
          filter (where m.content is not null)
        )[1] as last_message
      from conversation_threads t
      join users u on u.id = t.user_id
      left join grandma_personas p on p.id = t.persona_id
      left join messages m on m.thread_id = t.id
      where u.email = $1
      group by t.id, t.persona_id, p.name, p.cuisine, t.created_at
      order by last_activity desc
      limit 20
    `,
    [email],
  );

  return NextResponse.json({ threads: result.rows });
}

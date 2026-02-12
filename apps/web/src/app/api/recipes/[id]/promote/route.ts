import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pool = getPool();

  const sourceResult = await pool.query<{
    id: string;
    user_id: string;
    thread_id: string | null;
  }>(
    `
      select r.id, r.user_id, r.thread_id
      from recipes r
      join users u on u.id = r.user_id
      where r.id = $1 and u.email = $2
      limit 1
    `,
    [id, email],
  );

  const source = sourceResult.rows[0];
  if (!source) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (source.thread_id) {
    await pool.query(
      `
        update recipes
        set is_promoted = (id = $1)
        where user_id = $2 and thread_id is not distinct from $3
      `,
      [source.id, source.user_id, source.thread_id],
    );
  } else {
    await pool.query(
      `update recipes set is_promoted = true where id = $1 and user_id = $2`,
      [source.id, source.user_id],
    );
  }

  await pool.query(
    `update recipes set is_favorite = true where id = $1 and user_id = $2`,
    [source.id, source.user_id],
  );

  return NextResponse.json({
    id: source.id,
    isPromoted: true,
  });
}

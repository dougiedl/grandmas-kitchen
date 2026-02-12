import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { isFavorite?: boolean };

  if (typeof body.isFavorite !== "boolean") {
    return NextResponse.json({ error: "isFavorite boolean is required" }, { status: 400 });
  }

  const pool = getPool();
  const result = await pool.query(
    `
      update recipes r
      set is_favorite = $1
      from users u
      where r.id = $2 and r.user_id = u.id and u.email = $3
      returning r.id, r.is_favorite
    `,
    [body.isFavorite, id, email],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: result.rows[0].id,
    isFavorite: result.rows[0].is_favorite,
  });
}

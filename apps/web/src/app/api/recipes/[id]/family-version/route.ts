import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type Payload = {
  note?: string;
};

type SourceRecipeRow = {
  id: string;
  user_id: string;
  thread_id: string | null;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
  recipe_json: Record<string, unknown>;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Payload;
  const note = body.note?.trim() ?? "";
  const { id } = await params;

  const pool = getPool();
  const sourceResult = await pool.query<SourceRecipeRow>(
    `
      select r.id, r.user_id, r.thread_id, r.title, r.cuisine, r.servings, r.total_minutes, r.recipe_json
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

  const recipeJson = {
    ...source.recipe_json,
    familyVersion: {
      note: note || null,
      createdAt: new Date().toISOString(),
      sourceRecipeId: source.id,
    },
  };

  const newRecipeId = randomUUID();
  const title = source.title.includes("Family Version") ? source.title : `${source.title} (Family Version)`;

  await pool.query(
    `
      insert into recipes (
        id,
        user_id,
        thread_id,
        title,
        cuisine,
        servings,
        total_minutes,
        is_favorite,
        recipe_json
      )
      values ($1, $2, $3, $4, $5, $6, $7, true, $8::jsonb)
    `,
    [
      newRecipeId,
      source.user_id,
      source.thread_id,
      title,
      source.cuisine,
      source.servings,
      source.total_minutes,
      JSON.stringify(recipeJson),
    ],
  );

  await pool.query(
    `
      insert into analytics_events (id, user_id, event_name, event_props)
      values ($1, $2, 'recipe_family_version_saved', $3::jsonb)
    `,
    [
      randomUUID(),
      source.user_id,
      JSON.stringify({ sourceRecipeId: source.id, familyRecipeId: newRecipeId, hasNote: Boolean(note) }),
    ],
  );

  return NextResponse.json({ recipeId: newRecipeId });
}

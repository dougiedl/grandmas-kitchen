import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

const ALLOWED_CATEGORIES = ["too_salty", "too_bland", "too_long", "too_spicy", "other"] as const;

type FeedbackCategory = (typeof ALLOWED_CATEGORIES)[number];

function parseCategory(value: unknown): FeedbackCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  return (ALLOWED_CATEGORIES as readonly string[]).includes(value) ? (value as FeedbackCategory) : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { category?: string; note?: string };
  const category = parseCategory(body.category);

  if (!category) {
    return NextResponse.json({ error: "Invalid feedback category" }, { status: 400 });
  }

  const note = body.note?.trim();
  const pool = getPool();
  const recipeResult = await pool.query<{
    recipe_id: string;
    user_id: string;
  }>(
    `
      select r.id as recipe_id, u.id as user_id
      from recipes r
      join users u on u.email = $2
      where r.id = $1
      limit 1
    `,
    [id, email],
  );

  const row = recipeResult.rows[0];
  if (!row) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const feedbackId = randomUUID();
  await pool.query(
    `
      insert into recipe_feedback (id, recipe_id, user_id, category, note)
      values ($1, $2, $3, $4, $5)
    `,
    [feedbackId, row.recipe_id, row.user_id, category, note ?? null],
  );

  await pool.query(
    `
      insert into analytics_events (id, user_id, event_name, event_props)
      values ($1, $2, 'recipe_feedback_submitted', $3::jsonb)
    `,
    [randomUUID(), row.user_id, JSON.stringify({ recipeId: row.recipe_id, category })],
  );

  return NextResponse.json({ id: feedbackId, category });
}

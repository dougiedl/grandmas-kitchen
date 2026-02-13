import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";
import { checkRateLimit } from "@/lib/security/rate-limit";

type ConfirmRequest = {
  threadId?: string;
  selectedStyleId?: string;
  inferredStyleId?: string | null;
  confidence?: number | null;
  reasoningTags?: string[];
  accepted?: boolean;
};

type SelectedStyleRow = {
  id: string;
  label: string;
  cuisine: string;
  region: string | null;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ConfirmRequest;
  const threadId = body.threadId?.trim();
  const selectedStyleId = body.selectedStyleId?.trim();
  const inferredStyleId = body.inferredStyleId?.trim() || null;
  const reasoningTags = Array.isArray(body.reasoningTags) ? body.reasoningTags.slice(0, 12) : [];
  const accepted = typeof body.accepted === "boolean" ? body.accepted : true;
  const confidence =
    typeof body.confidence === "number" && Number.isFinite(body.confidence)
      ? Math.max(0, Math.min(body.confidence, 1))
      : null;

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  if (!selectedStyleId) {
    return NextResponse.json({ error: "selectedStyleId is required" }, { status: 400 });
  }

  const pool = getPool();
  const userResult = await pool.query<{ id: string }>(
    `
      insert into users (id, email, display_name)
      values ($1, $2, $3)
      on conflict (email)
      do update set display_name = coalesce(excluded.display_name, users.display_name)
      returning id
    `,
    [randomUUID(), email, session.user?.name ?? null],
  );
  const userId = userResult.rows[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unable to resolve user" }, { status: 500 });
  }

  const limiter = checkRateLimit({
    request,
    userKey: userId,
    routeKey: "style_confirm",
    max: 80,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait and try again." }, { status: 429 });
  }

  const threadResult = await pool.query<{ id: string }>(
    `
      select t.id
      from conversation_threads t
      join users u on u.id = t.user_id
      where t.id = $1 and u.email = $2
      limit 1
    `,
    [threadId, email],
  );

  if (!threadResult.rows[0]) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const selectedStyleResult = await pool.query<SelectedStyleRow>(
    `
      select id, label, cuisine, region
      from style_catalog
      where id = $1 and active = true
      limit 1
    `,
    [selectedStyleId],
  );
  const selectedStyle = selectedStyleResult.rows[0];
  if (!selectedStyle) {
    return NextResponse.json({ error: "Invalid selectedStyleId" }, { status: 400 });
  }

  if (inferredStyleId) {
    const inferredResult = await pool.query(
      `
        select id
        from style_catalog
        where id = $1 and active = true
        limit 1
      `,
      [inferredStyleId],
    );
    if (!inferredResult.rows[0]) {
      return NextResponse.json({ error: "Invalid inferredStyleId" }, { status: 400 });
    }
  }

  await pool.query(
    `
      insert into thread_style_state (thread_id, inferred_style_id, selected_style_id, confidence, reasoning_tags, confirmed_at, updated_at)
      values ($1, $2, $3, $4, $5, now(), now())
      on conflict (thread_id)
      do update set
        inferred_style_id = excluded.inferred_style_id,
        selected_style_id = excluded.selected_style_id,
        confidence = excluded.confidence,
        reasoning_tags = excluded.reasoning_tags,
        confirmed_at = now(),
        updated_at = now()
    `,
    [threadId, inferredStyleId, selectedStyleId, confidence, reasoningTags],
  );

  await pool.query(
    `
      insert into style_inference_events (
        id, user_id, thread_id, inferred_style_id, selected_style_id, confidence, accepted, event_props
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      randomUUID(),
      userId,
      threadId,
      inferredStyleId,
      selectedStyleId,
      confidence,
      accepted,
      JSON.stringify({
        reasoningTags,
        source: "style_confirm_api",
      }),
    ],
  );

  return NextResponse.json({
    ok: true,
    selectedStyle,
    threadStyleState: {
      threadId,
      inferredStyleId,
      selectedStyleId,
      confidence,
      reasoningTags,
    },
  });
}

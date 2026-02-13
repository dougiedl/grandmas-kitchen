import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";
import { checkRateLimit } from "@/lib/security/rate-limit";

type InferRequest = {
  threadId?: string | null;
  message?: string;
  currentStyleId?: string | null;
};

type StyleRow = {
  id: string;
  cuisine: string;
  region: string | null;
  label: string;
  aliases: string[] | null;
};

type StyleCandidate = {
  id: string;
  label: string;
  cuisine: string;
  region: string | null;
  score: number;
  confidence: number;
  tags: Set<string>;
};

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function boundedConfidence(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0.35;
  }
  return Math.max(0.35, Math.min(0.98, raw));
}

function matchesPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) {
    return false;
  }
  return text.includes(normalizedPhrase);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as InferRequest;
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
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
    routeKey: "style_infer",
    max: 60,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait and try again." }, { status: 429 });
  }

  const stylesResult = await pool.query<StyleRow>(
    `
      select id, cuisine, region, label, aliases
      from style_catalog
      where active = true
      order by cuisine asc, label asc
    `,
  );

  if (stylesResult.rows.length === 0) {
    return NextResponse.json({ error: "No active styles found" }, { status: 400 });
  }

  const text = normalizeText(message);
  const tokens = tokenize(text);

  let preferenceRows: Array<{ style_id: string; weight: string }> = [];
  try {
    const preferenceResult = await pool.query<{ style_id: string; weight: string }>(
      `
        select style_id, to_char(sum(weight), 'FM999999.00') as weight
        from user_style_preferences
        where user_id = $1
        group by style_id
      `,
      [userId],
    );
    preferenceRows = preferenceResult.rows;
  } catch {
    preferenceRows = [];
  }
  const preferenceBoost = new Map<string, number>(
    preferenceRows.map((row) => [row.style_id, Number.parseFloat(row.weight)]),
  );

  const candidates: StyleCandidate[] = stylesResult.rows.map((style) => {
    const tags = new Set<string>();
    let score = 0;

    const cuisineText = normalizeText(style.cuisine);
    const regionText = normalizeText(style.region ?? "");
    const labelText = normalizeText(style.label);
    const aliases = (style.aliases ?? []).map((alias) => normalizeText(alias));

    for (const alias of aliases) {
      if (matchesPhrase(text, alias)) {
        score += alias.split(" ").length >= 2 ? 6 : 4;
        tags.add(alias);
      }
    }

    if (cuisineText && matchesPhrase(text, cuisineText)) {
      score += 4;
      tags.add(style.cuisine.toLowerCase());
    }

    if (regionText && matchesPhrase(text, regionText)) {
      score += 5;
      tags.add(regionText);
    }

    for (const token of tokens) {
      if (labelText.includes(token)) {
        score += 1.25;
        tags.add(token);
      }
      if (regionText.includes(token)) {
        score += 1.5;
        tags.add(token);
      }
      if (cuisineText.includes(token)) {
        score += 1.25;
        tags.add(token);
      }
    }

    if (body.currentStyleId && body.currentStyleId === style.id) {
      score += 0.5;
      tags.add("current-style-context");
    }

    const prefWeight = preferenceBoost.get(style.id);
    if (Number.isFinite(prefWeight)) {
      const bounded = Math.max(-4, Math.min(prefWeight as number, 12));
      score += bounded * 0.4;
      if (bounded > 0) {
        tags.add("profile-history");
      }
    }

    return {
      id: style.id,
      label: style.label,
      cuisine: style.cuisine,
      region: style.region,
      score,
      confidence: 0,
      tags,
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  const topBucket = candidates.slice(0, 5);
  const totalTop = topBucket.reduce((sum, item) => sum + Math.max(item.score, 0), 0);

  const primaryConfidence =
    totalTop > 0
      ? boundedConfidence(0.45 + Math.max(top.score, 0) / totalTop * 0.5)
      : 0.4;
  top.confidence = primaryConfidence;

  const alternatives = candidates
    .slice(1, 4)
    .map((item) => {
      const confidence =
        totalTop > 0
          ? boundedConfidence(0.22 + Math.max(item.score, 0) / totalTop * 0.35)
          : 0.25;

      return {
        id: item.id,
        label: item.label,
        cuisine: item.cuisine,
        region: item.region,
        confidence: Number(confidence.toFixed(2)),
      };
    });

  const reasoningTags = [...top.tags].slice(0, 8);

  await pool.query(
    `
      insert into style_inference_events (
        id, user_id, thread_id, input_excerpt, inferred_style_id, selected_style_id, confidence, accepted, event_props
      )
      values ($1, $2, $3, $4, $5, null, $6, null, $7::jsonb)
    `,
    [
      randomUUID(),
      userId,
      body.threadId ?? null,
      message.slice(0, 280),
      top.id,
      Number(primaryConfidence.toFixed(2)),
      JSON.stringify({
        alternatives: alternatives.map((item) => ({ id: item.id, confidence: item.confidence })),
        reasoningTags,
        currentStyleId: body.currentStyleId ?? null,
      }),
    ],
  );

  return NextResponse.json({
    primaryStyle: {
      id: top.id,
      label: top.label,
      cuisine: top.cuisine,
      region: top.region,
      confidence: Number(primaryConfidence.toFixed(2)),
    },
    alternatives,
    reasoningTags,
  });
}

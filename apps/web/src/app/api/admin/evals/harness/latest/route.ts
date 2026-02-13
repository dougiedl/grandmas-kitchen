import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getPool } from "@/lib/db/pool";
import { parseConversationScore } from "@/lib/evals/conversation-eval";
import type { EvalResultRow, EvalRunRow, EvalRunSummary } from "@/lib/evals/types";

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = getPool();

  const runResult = await pool.query<EvalRunRow>(
    `
      select id, model_name, total_cases, completed_cases, avg_total_score::text, started_at::text, finished_at::text
      from eval_runs
      order by started_at desc
      limit 1
    `,
  );

  const run = runResult.rows[0];
  if (!run) {
    return NextResponse.json({ run: null });
  }

  const resultRows = await pool.query<EvalResultRow>(
    `
      select
        r.id,
        r.run_id,
        r.case_id,
        r.total_score::text,
        r.realism_score::text,
        r.structure_score::text,
        r.grandma_score::text,
        r.speed_alignment_score::text,
        r.notes,
        r.output_recipe_json,
        c.slug,
        c.cuisine,
        c.persona_name,
        c.prompt,
        c.tags
      from eval_results r
      join eval_prompt_cases c on c.id = r.case_id
      where r.run_id = $1
      order by r.total_score desc
    `,
    [run.id],
  );

  const rows = resultRows.rows;
  const isInProgress = run.finished_at === null || run.completed_cases < run.total_cases;
  const avg = run.avg_total_score ? toNumber(run.avg_total_score) : 0;
  const worstScore = rows.length > 0 ? Math.min(...rows.map((row) => toNumber(row.total_score))) : 0;
  const weakAuthenticityCount = rows.filter((row) => (row.notes ?? "").includes("authenticity_weak")).length;
  const weakAuthRate = rows.length > 0 ? weakAuthenticityCount / rows.length : 1;
  const conversationScores = rows
    .map((row) => parseConversationScore(row.notes))
    .filter((value): value is number => value !== null);
  const averageConversationScore =
    conversationScores.length > 0
      ? Math.round((conversationScores.reduce((sum, value) => sum + value, 0) / conversationScores.length) * 100) /
        100
      : 0;
  const weakConversationContextCount = rows.filter((row) =>
    (row.notes ?? "").includes("conversation_context_weak"),
  ).length;
  const weakConversationTroubleshootCount = rows.filter((row) =>
    (row.notes ?? "").includes("conversation_troubleshoot_weak"),
  ).length;
  const weakContextRate = rows.length > 0 ? weakConversationContextCount / rows.length : 1;
  const weakTroubleshootRate = rows.length > 0 ? weakConversationTroubleshootCount / rows.length : 1;

  const cuisineMap = new Map<string, { total: number; sum: number; weakAuthenticityCount: number }>();
  for (const row of rows) {
    const current = cuisineMap.get(row.cuisine) ?? { total: 0, sum: 0, weakAuthenticityCount: 0 };
    current.total += 1;
    current.sum += toNumber(row.total_score);
    if ((row.notes ?? "").includes("authenticity_weak")) {
      current.weakAuthenticityCount += 1;
    }
    cuisineMap.set(row.cuisine, current);
  }

  const cuisineBreakdown = [...cuisineMap.entries()].map(([cuisine, value]) => ({
    cuisine,
    avgScore: Math.round((value.sum / Math.max(value.total, 1)) * 100) / 100,
    weakAuthenticityCount: value.weakAuthenticityCount,
    totalCases: value.total,
  }));

  const diagnosticsMap = new Map<string, number>();
  for (const row of rows) {
    const notes = row.notes ?? "";
    if (notes.startsWith("generation_error:")) {
      diagnosticsMap.set(notes, (diagnosticsMap.get(notes) ?? 0) + 1);
    }
  }
  const diagnostics = [...diagnosticsMap.entries()]
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count);

  const gateReasons: string[] = [];
  if (isInProgress) {
    gateReasons.push(`Run in progress (${run.completed_cases}/${run.total_cases} complete).`);
  } else {
    if (avg < 82) {
      gateReasons.push(`Average score below threshold (got ${avg.toFixed(2)}, need >= 82.00).`);
    }
    if (worstScore < 68) {
      gateReasons.push(`Worst-case score below floor (got ${worstScore.toFixed(2)}, need >= 68.00).`);
    }
    if (weakAuthRate > 0.2) {
      gateReasons.push(`Authenticity weak rate too high (${(weakAuthRate * 100).toFixed(1)}%, need <= 20%).`);
    }
    if (conversationScores.length === 0) {
      gateReasons.push("Conversation quality probes missing (rerun harness).");
    } else {
      if (averageConversationScore < 80) {
        gateReasons.push(
          `Conversation score below threshold (got ${averageConversationScore.toFixed(2)}, need >= 80.00).`,
        );
      }
      if (weakContextRate > 0.25) {
        gateReasons.push(
          `Conversation context retention weak rate too high (${(weakContextRate * 100).toFixed(1)}%, need <= 25%).`,
        );
      }
      if (weakTroubleshootRate > 0.25) {
        gateReasons.push(
          `Conversation troubleshooting weak rate too high (${(weakTroubleshootRate * 100).toFixed(1)}%, need <= 25%).`,
        );
      }
    }
  }

  const summary: EvalRunSummary = {
    run: {
      id: run.id,
      modelName: run.model_name,
      totalCases: run.total_cases,
      completedCases: run.completed_cases,
      avgTotalScore: run.avg_total_score ? toNumber(run.avg_total_score) : null,
      startedAt: run.started_at,
      finishedAt: run.finished_at,
    },
    gate: {
      status: isInProgress ? "pending" : gateReasons.length === 0 ? "pass" : "fail",
      reasons: gateReasons,
    },
    conversationQuality: {
      avgScore: averageConversationScore,
      scoredCases: conversationScores.length,
      weakContextCount: weakConversationContextCount,
      weakTroubleshootCount: weakConversationTroubleshootCount,
      totalCases: rows.length,
    },
    cuisineBreakdown,
    diagnostics,
    topCases: rows.slice(0, 5).map((row) => ({
      slug: row.slug,
      cuisine: row.cuisine,
      personaName: row.persona_name,
      totalScore: toNumber(row.total_score),
      notes: row.notes ?? "",
    })),
    bottomCases: [...rows]
      .sort((a, b) => toNumber(a.total_score) - toNumber(b.total_score))
      .slice(0, 5)
      .map((row) => ({
        slug: row.slug,
        cuisine: row.cuisine,
        personaName: row.persona_name,
        totalScore: toNumber(row.total_score),
        notes: row.notes ?? "",
      })),
  };

  return NextResponse.json(summary);
}

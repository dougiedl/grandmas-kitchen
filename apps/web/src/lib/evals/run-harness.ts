import { randomUUID } from "crypto";
import { generateRecipe } from "@/lib/chat/generate-recipe";
import { getPool } from "@/lib/db/pool";
import { scoreRecipe } from "@/lib/evals/score-recipe";
import type { EvalPromptCaseRow, EvalResultRow, EvalRunSummary } from "@/lib/evals/types";

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

export async function runEvalHarness(startedByUserId?: string): Promise<EvalRunSummary> {
  const pool = getPool();

  const casesResult = await pool.query<EvalPromptCaseRow>(
    `
      select id, slug, cuisine, persona_name, prompt, tags
      from eval_prompt_cases
      where active = true
      order by slug asc
    `,
  );

  const cases = casesResult.rows;
  if (cases.length === 0) {
    throw new Error("No active eval cases found. Seed cases first.");
  }

  const runId = randomUUID();
  const modelName = process.env.OPENAI_API_KEY
    ? process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
    : "mock-fallback";

  await pool.query(
    `
      insert into eval_runs (id, started_by_user_id, model_name, total_cases, completed_cases)
      values ($1, $2, $3, $4, 0)
    `,
    [runId, startedByUserId ?? null, modelName, cases.length],
  );

  const scores: number[] = [];

  for (const evalCase of cases) {
    const recipe = await generateRecipe({
      personaName: evalCase.persona_name,
      cuisine: evalCase.cuisine,
      prompt: evalCase.prompt,
    });

    const score = scoreRecipe({ prompt: evalCase.prompt, recipe });
    scores.push(score.totalScore);

    await pool.query(
      `
        insert into eval_results (
          id,
          run_id,
          case_id,
          total_score,
          realism_score,
          structure_score,
          grandma_score,
          speed_alignment_score,
          notes,
          output_recipe_json
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      `,
      [
        randomUUID(),
        runId,
        evalCase.id,
        score.totalScore,
        score.realismScore,
        score.structureScore,
        score.grandmaScore,
        score.speedAlignmentScore,
        score.notes || null,
        JSON.stringify(recipe),
      ],
    );
  }

  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100) / 100
      : null;

  await pool.query(
    `
      update eval_runs
      set completed_cases = $2,
          avg_total_score = $3,
          finished_at = now()
      where id = $1
    `,
    [runId, cases.length, avgScore],
  );

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
    [runId],
  );

  const rows = resultRows.rows;
  const avg = avgScore ?? 0;
  const worstScore = rows.length > 0 ? Math.min(...rows.map((row) => toNumber(row.total_score))) : 0;
  const weakAuthenticityCount = rows.filter((row) => (row.notes ?? "").includes("authenticity_weak")).length;
  const weakAuthRate = rows.length > 0 ? weakAuthenticityCount / rows.length : 1;

  const cuisineMap = new Map<string, { total: number; sum: number; weakAuthenticityCount: number }>();
  for (const row of rows) {
    const key = row.cuisine;
    const current = cuisineMap.get(key) ?? { total: 0, sum: 0, weakAuthenticityCount: 0 };
    current.total += 1;
    current.sum += toNumber(row.total_score);
    if ((row.notes ?? "").includes("authenticity_weak")) {
      current.weakAuthenticityCount += 1;
    }
    cuisineMap.set(key, current);
  }

  const cuisineBreakdown = [...cuisineMap.entries()].map(([cuisine, value]) => ({
    cuisine,
    avgScore: Math.round((value.sum / Math.max(value.total, 1)) * 100) / 100,
    weakAuthenticityCount: value.weakAuthenticityCount,
    totalCases: value.total,
  }));

  const gateReasons: string[] = [];
  if (avg < 82) {
    gateReasons.push(`Average score below threshold (got ${avg.toFixed(2)}, need >= 82.00).`);
  }
  if (worstScore < 68) {
    gateReasons.push(`Worst-case score below floor (got ${worstScore.toFixed(2)}, need >= 68.00).`);
  }
  if (weakAuthRate > 0.2) {
    gateReasons.push(`Authenticity weak rate too high (${(weakAuthRate * 100).toFixed(1)}%, need <= 20%).`);
  }

  const topCases = rows.slice(0, 5).map((row) => ({
    slug: row.slug,
    cuisine: row.cuisine,
    personaName: row.persona_name,
    totalScore: toNumber(row.total_score),
    notes: row.notes ?? "",
  }));

  const bottomCases = [...rows]
    .sort((a, b) => toNumber(a.total_score) - toNumber(b.total_score))
    .slice(0, 5)
    .map((row) => ({
      slug: row.slug,
      cuisine: row.cuisine,
      personaName: row.persona_name,
      totalScore: toNumber(row.total_score),
      notes: row.notes ?? "",
    }));

  return {
    run: {
      id: runId,
      modelName,
      totalCases: cases.length,
      completedCases: cases.length,
      avgTotalScore: avgScore,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    },
    gate: {
      status: gateReasons.length === 0 ? "pass" : "fail",
      reasons: gateReasons,
    },
    cuisineBreakdown,
    topCases,
    bottomCases,
  };
}

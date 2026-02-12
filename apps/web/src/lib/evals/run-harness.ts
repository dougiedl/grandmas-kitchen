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
  let completedCases = 0;

  for (const evalCase of cases) {
    try {
      const recipe = await generateRecipe({
        personaName: evalCase.persona_name,
        cuisine: evalCase.cuisine,
        prompt: evalCase.prompt,
        useSemanticRerank: false,
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
    } catch (error) {
      const fallbackRecipe = {
        title: `${evalCase.cuisine} Eval Fallback`,
        cuisine: evalCase.cuisine,
        servings: 4,
        totalMinutes: 45,
        ingredients: [
          { amount: "2 tbsp", item: "olive oil" },
          { amount: "1 cup", item: "onion and garlic" },
          { amount: "1.5 cups", item: "tomato or stock base" },
        ],
        steps: [
          "Cook aromatics gently.",
          "Simmer with base until cohesive.",
        ],
        grandmaTips: ["Taste and adjust seasoning before serving."],
      };

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
          values ($1, $2, $3, 0, 0, 0, 0, 0, $4, $5::jsonb)
        `,
        [
          randomUUID(),
          runId,
          evalCase.id,
          `generation_error: ${error instanceof Error ? error.message : "unknown_error"}`,
          JSON.stringify(fallbackRecipe),
        ],
      );
      scores.push(0);
    } finally {
      completedCases += 1;
      await pool.query(
        `update eval_runs set completed_cases = $2 where id = $1`,
        [runId, completedCases],
      );
    }
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
    [runId, completedCases, avgScore],
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
      completedCases,
      avgTotalScore: avgScore,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    },
    gate: {
      status: gateReasons.length === 0 ? "pass" : "fail",
      reasons: gateReasons,
    },
    cuisineBreakdown,
    diagnostics,
    topCases,
    bottomCases,
  };
}

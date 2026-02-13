import type { Recipe } from "@/lib/chat/recipe-schema";

export type EvalPromptCaseRow = {
  id: string;
  slug: string;
  cuisine: string;
  persona_name: string;
  prompt: string;
  tags: string[];
};

export type EvalRunRow = {
  id: string;
  model_name: string | null;
  total_cases: number;
  completed_cases: number;
  avg_total_score: string | null;
  started_at: string;
  finished_at: string | null;
};

export type EvalResultRow = {
  id: string;
  run_id: string;
  case_id: string;
  total_score: string;
  realism_score: string;
  structure_score: string;
  grandma_score: string;
  speed_alignment_score: string;
  notes: string | null;
  output_recipe_json: Recipe;
  slug: string;
  cuisine: string;
  persona_name: string;
  prompt: string;
  tags: string[];
};

export type EvalRunSummary = {
  run: {
    id: string;
    modelName: string | null;
    totalCases: number;
    completedCases: number;
    avgTotalScore: number | null;
    startedAt: string;
    finishedAt: string | null;
  };
  gate: {
    status: "pass" | "fail" | "pending";
    reasons: string[];
  };
  conversationQuality: {
    avgScore: number;
    scoredCases: number;
    weakContextCount: number;
    weakTroubleshootCount: number;
    totalCases: number;
  };
  cuisineBreakdown: Array<{
    cuisine: string;
    avgScore: number;
    weakAuthenticityCount: number;
    totalCases: number;
  }>;
  diagnostics: Array<{
    error: string;
    count: number;
  }>;
  topCases: Array<{
    slug: string;
    cuisine: string;
    personaName: string;
    totalScore: number;
    notes: string;
  }>;
  bottomCases: Array<{
    slug: string;
    cuisine: string;
    personaName: string;
    totalScore: number;
    notes: string;
  }>;
};

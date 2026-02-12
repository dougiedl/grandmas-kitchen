import { randomUUID } from "crypto";
import type { Pool } from "pg";

export type RegionalSignal = {
  key: string;
  label: string;
  cuisine: string;
  confidence: number;
};

export type PersonalizationContext = {
  regionalStyle?: string;
  preferenceNotes: string[];
};

type SignalRule = {
  key: string;
  label: string;
  cuisine: string;
  confidence: number;
  patterns: RegExp[];
};

const SIGNAL_RULES: SignalRule[] = [
  { key: "it_sicilian", label: "Sicilian", cuisine: "Italian", confidence: 0.95, patterns: [/\bsicilian\b/i, /\bsicily\b/i] },
  { key: "it_neapolitan", label: "Neapolitan", cuisine: "Italian", confidence: 0.95, patterns: [/\bneapolitan\b/i, /\bnapoli\b/i, /\bnaples\b/i] },
  { key: "it_ny_american", label: "Italian-American (New York)", cuisine: "Italian", confidence: 0.95, patterns: [/\bitalian-?american\b/i, /\bnew york\b/i, /\bnyc\b/i, /\bred sauce\b/i] },
  { key: "it_roman", label: "Roman", cuisine: "Italian", confidence: 0.8, patterns: [/\broman\b/i, /\broma\b/i] },
  { key: "mx_oaxacan", label: "Oaxacan", cuisine: "Mexican", confidence: 0.95, patterns: [/\boaxacan\b/i, /\boaxaca\b/i] },
  { key: "mx_yucatecan", label: "Yucatecan", cuisine: "Mexican", confidence: 0.85, patterns: [/\byucatan\b/i, /\byucatecan\b/i] },
  { key: "gr_cretan", label: "Cretan", cuisine: "Greek", confidence: 0.8, patterns: [/\bcretan\b/i, /\bcrete\b/i] },
  { key: "es_basque", label: "Basque", cuisine: "Spanish", confidence: 0.85, patterns: [/\bbasque\b/i] },
  { key: "es_valencian", label: "Valencian", cuisine: "Spanish", confidence: 0.85, patterns: [/\bvalencian\b/i, /\bvalencia\b/i] },
  { key: "fr_provencal", label: "Provencal", cuisine: "French", confidence: 0.85, patterns: [/\bprovencal\b/i, /\bprovence\b/i] },
  { key: "lb_beirut", label: "Beirut-Style", cuisine: "Lebanese", confidence: 0.8, patterns: [/\bbeirut\b/i] },
];

function normalizeCuisine(cuisine: string): string {
  const lower = cuisine.trim().toLowerCase();
  if (lower.includes("ital")) return "Italian";
  if (lower.includes("mex")) return "Mexican";
  if (lower.includes("greek")) return "Greek";
  if (lower.includes("span")) return "Spanish";
  if (lower.includes("french")) return "French";
  if (lower.includes("leban")) return "Lebanese";
  return cuisine;
}

export function extractRegionalSignals(prompt: string, cuisine: string): RegionalSignal[] {
  const normalizedCuisine = normalizeCuisine(cuisine);
  const matches = SIGNAL_RULES.filter((rule) => {
    if (rule.cuisine !== normalizedCuisine) {
      return false;
    }

    return rule.patterns.some((pattern) => pattern.test(prompt));
  });

  return matches.map((match) => ({
    key: match.key,
    label: match.label,
    cuisine: match.cuisine,
    confidence: match.confidence,
  }));
}

export async function persistSignals(params: {
  pool: Pool;
  userId: string;
  threadId?: string | null;
  cuisine: string;
  source: string;
  signals: RegionalSignal[];
}) {
  const { pool, userId, threadId, cuisine, source, signals } = params;
  if (signals.length === 0) {
    return;
  }

  for (const signal of signals) {
    await pool.query(
      `
        insert into user_preference_signals (id, user_id, thread_id, cuisine, signal_key, signal_label, confidence, source)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [randomUUID(), userId, threadId ?? null, cuisine, signal.key, signal.label, signal.confidence, source],
    );
  }
}

export async function loadPersonalizationContext(params: {
  pool: Pool;
  userId: string;
  cuisine: string;
  prompt?: string;
}): Promise<PersonalizationContext> {
  const { pool, userId, cuisine, prompt } = params;
  const normalizedCuisine = normalizeCuisine(cuisine);
  const promptSignals = prompt ? extractRegionalSignals(prompt, normalizedCuisine) : [];

  const dominantSignalResult = await pool.query<{
    signal_label: string;
    score: string;
  }>(
    `
      select signal_label, to_char(sum(confidence), 'FM999999.00') as score
      from user_preference_signals
      where user_id = $1 and cuisine = $2 and created_at > now() - interval '180 days'
      group by signal_label
      order by sum(confidence) desc, max(created_at) desc
      limit 1
    `,
    [userId, normalizedCuisine],
  );

  const dominant = dominantSignalResult.rows[0]?.signal_label;

  const regionalStyle = promptSignals[0]?.label ?? dominant;
  const preferenceNotes: string[] = [];

  if (promptSignals.length > 0) {
    preferenceNotes.push(`Current prompt suggests: ${promptSignals.map((signal) => signal.label).join(", ")}.`);
  }

  if (dominant) {
    preferenceNotes.push(`Returning preference trend: ${dominant}.`);
  }

  return {
    regionalStyle,
    preferenceNotes,
  };
}

export async function upsertTasteProfile(params: {
  pool: Pool;
  userId: string;
  lastPersonaId?: string | null;
  lastCuisine?: string | null;
  lastRegionalStyle?: string | null;
  incrementGenerations?: boolean;
}) {
  const {
    pool,
    userId,
    lastPersonaId,
    lastCuisine,
    lastRegionalStyle,
    incrementGenerations = false,
  } = params;

  await pool.query(
    `
      insert into user_taste_profiles (user_id, last_persona_id, last_cuisine, last_regional_style, total_generations, updated_at)
      values ($1, $2, $3, $4, $5, now())
      on conflict (user_id)
      do update set
        last_persona_id = coalesce(excluded.last_persona_id, user_taste_profiles.last_persona_id),
        last_cuisine = coalesce(excluded.last_cuisine, user_taste_profiles.last_cuisine),
        last_regional_style = coalesce(excluded.last_regional_style, user_taste_profiles.last_regional_style),
        total_generations = user_taste_profiles.total_generations + $6,
        updated_at = now()
    `,
    [
      userId,
      lastPersonaId ?? null,
      lastCuisine ?? null,
      lastRegionalStyle ?? null,
      incrementGenerations ? 1 : 0,
      incrementGenerations ? 1 : 0,
    ],
  );
}

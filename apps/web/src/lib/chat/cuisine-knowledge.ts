import { createHash } from "crypto";
import { getPool } from "@/lib/db/pool";
import type { RegenerationStyle } from "@/lib/chat/recipe-schema";
import frenchPack from "@/lib/knowledge/packs/french.v1.json";
import greekPack from "@/lib/knowledge/packs/greek.v1.json";
import italianPack from "@/lib/knowledge/packs/italian.v1.json";
import jamaicanPack from "@/lib/knowledge/packs/jamaican.v1.json";
import japanesePack from "@/lib/knowledge/packs/japanese.v1.json";
import koreanPack from "@/lib/knowledge/packs/korean.v1.json";
import lebanesePack from "@/lib/knowledge/packs/lebanese.v1.json";
import mexicanPack from "@/lib/knowledge/packs/mexican.v1.json";
import persianPack from "@/lib/knowledge/packs/persian.v1.json";
import russianPack from "@/lib/knowledge/packs/russian.v1.json";
import spanishPack from "@/lib/knowledge/packs/spanish.v1.json";
import chinesePack from "@/lib/knowledge/packs/chinese.v1.json";
import indianPack from "@/lib/knowledge/packs/indian.v1.json";
import puertoRicanPack from "@/lib/knowledge/packs/puerto-rican.v1.json";
import dominicanPack from "@/lib/knowledge/packs/dominican.v1.json";
import filipinoPack from "@/lib/knowledge/packs/filipino.v1.json";
import jewishPack from "@/lib/knowledge/packs/jewish.v1.json";
import westAfricanPack from "@/lib/knowledge/packs/west-african.v1.json";

type KnowledgeSnippet = {
  id: string;
  tags: string[];
  text: string;
};

type CuisineKnowledgePack = {
  id: string;
  version: string;
  cuisine: string;
  personas: string[];
  pantryAnchors: string[];
  techniqueRules: string[];
  flavorPairings: string[];
  signatureDishes: string[];
  substitutions: string[];
  donts: string[];
  snippets: KnowledgeSnippet[];
};

type KnowledgeInput = {
  cuisine: string;
  personaName: string;
  prompt: string;
  regionalStyle?: string;
  regenerationStyle?: RegenerationStyle;
  useSemanticRerank?: boolean;
};

export type KnowledgeContext = {
  cuisine: string;
  personaName: string;
  packId: string;
  packVersion: string;
  selectedSnippets: string[];
  selectedSnippetIds: string[];
  pantryAnchors: string[];
  techniqueRules: string[];
  flavorPairings: string[];
  signatureDishes: string[];
  substitutions: string[];
  donts: string[];
};

const PACKS: CuisineKnowledgePack[] = [
  italianPack as CuisineKnowledgePack,
  mexicanPack as CuisineKnowledgePack,
  greekPack as CuisineKnowledgePack,
  spanishPack as CuisineKnowledgePack,
  frenchPack as CuisineKnowledgePack,
  lebanesePack as CuisineKnowledgePack,
  persianPack as CuisineKnowledgePack,
  chinesePack as CuisineKnowledgePack,
  indianPack as CuisineKnowledgePack,
  japanesePack as CuisineKnowledgePack,
  jamaicanPack as CuisineKnowledgePack,
  russianPack as CuisineKnowledgePack,
  puertoRicanPack as CuisineKnowledgePack,
  dominicanPack as CuisineKnowledgePack,
  koreanPack as CuisineKnowledgePack,
  filipinoPack as CuisineKnowledgePack,
  jewishPack as CuisineKnowledgePack,
  westAfricanPack as CuisineKnowledgePack,
];

const HOME_STYLE_PACK: CuisineKnowledgePack = {
  id: "home-style-v1",
  version: "2026-02-12",
  cuisine: "Home Style",
  personas: ["Grandma"],
  pantryAnchors: ["olive oil", "onion", "garlic", "tomato or broth", "fresh herbs"],
  techniqueRules: ["Build aromatics first.", "Simmer until cohesive.", "Taste and adjust before serving."],
  flavorPairings: ["tomato + herbs", "garlic + onion"],
  signatureDishes: ["family stew", "comfort soup", "pantry skillet"],
  substitutions: ["Use pantry equivalents where needed."],
  donts: ["Avoid overcomplicated restaurant-only steps."],
  snippets: [{ id: "home-weeknight", tags: ["weeknight", "quick"], text: "Use one-pan flow when speed is requested." }],
};

function normalizeCuisine(cuisine: string): string {
  const lower = cuisine.trim().toLowerCase();
  if (lower.includes("ital")) return "Italian";
  if (lower.includes("mex")) return "Mexican";
  if (lower.includes("greek")) return "Greek";
  if (lower.includes("span")) return "Spanish";
  if (lower.includes("french")) return "French";
  if (lower.includes("leban")) return "Lebanese";
  if (lower.includes("pers")) return "Persian";
  if (lower.includes("chin")) return "Chinese";
  if (lower.includes("ind")) return "Indian";
  if (lower.includes("japan")) return "Japanese";
  if (lower.includes("jama")) return "Jamaican";
  if (lower.includes("russ")) return "Russian";
  if (lower.includes("puerto")) return "Puerto Rican";
  if (lower.includes("dominican")) return "Dominican";
  if (lower.includes("korean")) return "Korean";
  if (lower.includes("filip")) return "Filipino";
  if (lower.includes("jewish") || lower.includes("ashken")) return "Jewish";
  if (lower.includes("west african") || lower.includes("nigerian") || lower.includes("ghanaian")) return "West African";
  return "Home Style";
}

function inferTags(input: KnowledgeInput): string[] {
  const text = `${input.prompt} ${input.regionalStyle ?? ""}`.toLowerCase();
  const tags = new Set<string>();

  if (text.includes("quick") || text.includes("30") || text.includes("weeknight")) tags.add("weeknight");
  if (text.includes("comfort") || text.includes("sunday") || text.includes("nostalg")) tags.add("comfort");
  if (text.includes("sunday")) tags.add("sunday");
  if (text.includes("kid")) tags.add("kid-friendly");
  if (text.includes("mild")) tags.add("mild");
  if (text.includes("fish") || text.includes("seafood")) tags.add("seafood");
  if (text.includes("sicilian")) tags.add("sicilian");
  if (text.includes("neapolitan") || text.includes("naples")) tags.add("neapolitan");
  if (text.includes("italian-american") || text.includes("new york")) tags.add("italian-american");
  if (text.includes("oaxacan")) tags.add("oaxacan");
  if (text.includes("valencian") || text.includes("valencia")) tags.add("valencian");
  if (text.includes("russian") || text.includes("babushka") || text.includes("pelmeni") || text.includes("borscht")) tags.add("russian");
  if (text.includes("puerto rican") || text.includes("boricua") || text.includes("asopao")) tags.add("puerto-rican");
  if (text.includes("dominican") || text.includes("sancocho") || text.includes("la bandera")) tags.add("dominican");
  if (text.includes("korean") || text.includes("kimchi") || text.includes("jjigae") || text.includes("halmeoni")) tags.add("korean");
  if (text.includes("filipino") || text.includes("adobo") || text.includes("sinigang") || text.includes("lola")) tags.add("filipino");
  if (text.includes("jewish") || text.includes("bubbe") || text.includes("brisket") || text.includes("kugel")) tags.add("jewish");
  if (text.includes("west african") || text.includes("jollof") || text.includes("egusi") || text.includes("groundnut")) tags.add("west-african");
  if (input.regenerationStyle === "faster") tags.add("weeknight");
  if (input.regenerationStyle === "traditional") tags.add("sunday");

  if (tags.size === 0) tags.add("comfort");

  return [...tags];
}

function scoreSnippetLexical(snippet: KnowledgeSnippet, tags: string[], prompt: string): number {
  let score = 0;
  for (const tag of tags) {
    if (snippet.tags.includes(tag)) score += 3;
  }

  const promptWords = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);

  for (const word of promptWords) {
    if (snippet.text.toLowerCase().includes(word)) score += 1;
  }

  return score;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function embeddingKey(model: string, text: string): string {
  return createHash("sha256").update(`${model}::${text}`).digest("hex");
}

async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
  const key = embeddingKey(model, text);

  try {
    const pool = getPool();
    const cached = await pool.query<{ embedding: number[] }>(
      `select embedding from knowledge_embedding_cache where key = $1 and model = $2 limit 1`,
      [key, model],
    );

    const hit = cached.rows[0]?.embedding;
    if (Array.isArray(hit) && hit.length > 0) {
      return hit;
    }
  } catch {
    // Continue without DB cache.
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
      return null;
    }

    try {
      const pool = getPool();
      await pool.query(
        `
          insert into knowledge_embedding_cache (key, model, text_value, embedding)
          values ($1, $2, $3, $4::jsonb)
          on conflict (key)
          do update set embedding = excluded.embedding, text_value = excluded.text_value, updated_at = now()
        `,
        [key, model, text, JSON.stringify(vector)],
      );
    } catch {
      // Non-blocking cache write.
    }

    return vector;
  } catch {
    return null;
  }
}

async function rerankByEmbedding(query: string, snippets: Array<{ snippet: KnowledgeSnippet; lexicalScore: number }>) {
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) {
    return snippets
      .sort((a, b) => b.lexicalScore - a.lexicalScore)
      .map((entry) => entry.snippet);
  }

  const maxLexical = Math.max(...snippets.map((item) => item.lexicalScore), 1);
  const scored: Array<{ snippet: KnowledgeSnippet; score: number }> = [];

  for (const entry of snippets) {
    const snippetEmbedding = await getEmbedding(entry.snippet.text);
    const semantic = snippetEmbedding ? Math.max(0, cosineSimilarity(queryEmbedding, snippetEmbedding)) : 0;
    const lexicalNorm = entry.lexicalScore / maxLexical;
    const score = lexicalNorm * 0.55 + semantic * 0.45;
    scored.push({ snippet: entry.snippet, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((item) => item.snippet);
}

export async function buildKnowledgeContext(input: KnowledgeInput): Promise<KnowledgeContext> {
  const cuisine = normalizeCuisine(input.cuisine);
  const pack = PACKS.find((item) => item.cuisine === cuisine) ?? HOME_STYLE_PACK;
  const tags = inferTags(input);

  const lexicalCandidates = pack.snippets.map((snippet) => ({
    snippet,
    lexicalScore: scoreSnippetLexical(snippet, tags, input.prompt),
  }));

  const shortlisted = lexicalCandidates
    .sort((a, b) => b.lexicalScore - a.lexicalScore)
    .slice(0, Math.min(10, lexicalCandidates.length));

  const reranked =
    input.useSemanticRerank === false
      ? shortlisted
          .sort((a, b) => b.lexicalScore - a.lexicalScore)
          .map((item) => item.snippet)
      : await rerankByEmbedding(
          [input.prompt, input.regionalStyle ? `Regional style: ${input.regionalStyle}` : "", `Cuisine: ${pack.cuisine}`]
            .filter(Boolean)
            .join("\n"),
          shortlisted,
        );

  const selectedSnippets = reranked.slice(0, 4).map((snippet) => snippet.text);
  const selectedSnippetIds = reranked.slice(0, 4).map((snippet) => snippet.id);

  return {
    cuisine: pack.cuisine,
    personaName: input.personaName,
    packId: pack.id,
    packVersion: pack.version,
    selectedSnippets,
    selectedSnippetIds,
    pantryAnchors: pack.pantryAnchors,
    techniqueRules: pack.techniqueRules,
    flavorPairings: pack.flavorPairings,
    signatureDishes: pack.signatureDishes,
    substitutions: pack.substitutions,
    donts: pack.donts,
  };
}

export function formatKnowledgeForPrompt(context: KnowledgeContext): string {
  return [
    `Cuisine knowledge pack id: ${context.packId}`,
    `Cuisine knowledge pack version: ${context.packVersion}`,
    `Cuisine knowledge pack: ${context.cuisine}`,
    `Pantry anchors: ${context.pantryAnchors.join("; ")}`,
    `Technique rules: ${context.techniqueRules.join("; ")}`,
    `Flavor pairings: ${context.flavorPairings.join("; ")}`,
    `Signature dishes: ${context.signatureDishes.join("; ")}`,
    `Substitutions: ${context.substitutions.join("; ")}`,
    `Avoid: ${context.donts.join("; ")}`,
    `Top matched memory snippets: ${context.selectedSnippets.join(" | ")}`,
  ].join("\n");
}

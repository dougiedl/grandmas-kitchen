#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PROMPTS_PATH = path.join(ROOT, "scripts", "kitchen-background-prompts.json");
const OUTPUT_DIR = path.join(ROOT, "apps", "web", "public", "backgrounds");
const ENV_LOCAL_PATH = path.join(ROOT, "apps", "web", ".env.local");

function parseArgs(argv) {
  const args = {
    size: "1536x1024",
    quality: "high",
    archive: false,
    archiveTag: null,
    model: "gpt-image-1",
    force: false,
    ids: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--archive") args.archive = true;
    else if (arg === "--size" && argv[i + 1]) args.size = argv[++i];
    else if (arg === "--quality" && argv[i + 1]) args.quality = argv[++i];
    else if (arg === "--model" && argv[i + 1]) args.model = argv[++i];
    else if (arg === "--tag" && argv[i + 1]) args.archiveTag = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--ids" && argv[i + 1]) {
      args.ids = argv[++i]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return args;
}

function parseDotEnv(content) {
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  try {
    const envLocal = await fs.readFile(ENV_LOCAL_PATH, "utf8");
    const parsed = parseDotEnv(envLocal);
    return parsed.OPENAI_API_KEY || null;
  } catch {
    return null;
  }
}

async function generateOne({ apiKey, model, prompt, size, quality }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
      }),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI images generation failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const base64 = data?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("OpenAI response missing image payload (b64_json)");
  }

  return Buffer.from(base64, "base64");
}

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function generateWithRetry(params, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await generateOne(params);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const delayMs = 1200 * attempt;
        console.warn(`[generate] transient failure (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms`);
        await wait(delayMs);
      }
    }
  }
  throw lastError;
}

function currentDateTag() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = await loadApiKey();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to apps/web/.env.local or export it in your shell.",
    );
  }

  const promptConfigRaw = await fs.readFile(PROMPTS_PATH, "utf8");
  const promptConfig = JSON.parse(promptConfigRaw);
  const baseStyle = promptConfig.baseStyle;
  const cuisines = (args.ids
    ? promptConfig.cuisines.filter((cuisine) => args.ids.includes(cuisine.id))
    : promptConfig.cuisines);

  if (cuisines.length === 0) {
    throw new Error("No cuisines selected. Use --ids with valid values from prompts JSON.");
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const tag = args.archiveTag || currentDateTag();
  const archiveDir = path.join(OUTPUT_DIR, "archive", tag);
  if (args.archive) {
    await fs.mkdir(archiveDir, { recursive: true });
  }

  const failures = [];
  for (const cuisine of cuisines) {
    const outputFile = path.join(OUTPUT_DIR, `${cuisine.id}-kitchen.png`);
    if (!args.force && await fileExists(outputFile)) {
      console.log(`[generate] skip existing ${cuisine.id}-kitchen.png`);
      continue;
    }

    const fullPrompt = `${baseStyle}\n\nCuisine scene requirement: ${cuisine.prompt}`;
    console.log(`[generate] ${cuisine.id}-kitchen.png`);

    try {
      const imageBuffer = await generateWithRetry({
        apiKey,
        model: args.model,
        prompt: fullPrompt,
        size: args.size,
        quality: args.quality,
      });

      await fs.writeFile(outputFile, imageBuffer);
      if (args.archive) {
        const archiveFile = path.join(archiveDir, `${cuisine.id}-kitchen.png`);
        await fs.writeFile(archiveFile, imageBuffer);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      failures.push({ id: cuisine.id, reason });
      console.error(`[generate] failed ${cuisine.id}-kitchen.png: ${reason}`);
    }
  }

  if (failures.length > 0) {
    console.error("[generate] completed with failures:");
    for (const failure of failures) {
      console.error(`- ${failure.id}: ${failure.reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("[generate] completed");
}

main().catch((error) => {
  console.error(`[generate] failed: ${error.message}`);
  process.exitCode = 1;
});

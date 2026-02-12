"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { RegenerationStyle } from "@/lib/chat/recipe-schema";

type VersionOption = {
  id: string;
  label: string;
};

type RecipeExportData = {
  title: string;
  cuisine: string;
  servings: string;
  totalMinutes: string;
  ingredients: Array<{ amount: string; item: string }>;
  steps: string[];
  grandmaTips: string[];
};

function toExportText(data: RecipeExportData): string {
  const ingredients = data.ingredients.map((item) => `- ${item.amount} ${item.item}`).join("\n");
  const steps = data.steps.map((step, idx) => `${idx + 1}. ${step}`).join("\n");
  const tips = data.grandmaTips.map((tip) => `- ${tip}`).join("\n");

  return [
    data.title,
    `${data.cuisine} | ${data.servings} servings | ${data.totalMinutes} min`,
    "",
    "Ingredients",
    ingredients,
    "",
    "Steps",
    steps,
    "",
    "Grandma Tips",
    tips,
  ].join("\n");
}

export function RecipeDetailActions({
  recipeId,
  compareId,
  compareIsPromoted,
  versions,
  exportData,
}: {
  recipeId: string;
  compareId?: string;
  compareIsPromoted?: boolean;
  versions: VersionOption[];
  exportData: RecipeExportData;
}) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportText = useMemo(() => toExportText(exportData), [exportData]);

  async function trackEvent(eventName: string, eventProps?: Record<string, unknown>) {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, eventProps }),
      });
    } catch {
      // Non-blocking analytics
    }
  }

  function onCompareChange(nextCompareId: string) {
    const target = nextCompareId ? `/recipes/${recipeId}?compare=${nextCompareId}` : `/recipes/${recipeId}`;
    router.push(target);
  }

  function onPrint() {
    void trackEvent("recipe_print_clicked", { recipeId });
    window.print();
  }

  function onExport() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    void trackEvent("recipe_export_txt_clicked", { recipeId });
  }

  async function onRegenerate(style?: RegenerationStyle) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regenerationStyle: style,
          instruction: instruction.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Regeneration failed");
      }

      const data = (await response.json()) as { recipeId: string };
      await trackEvent("recipe_regenerated_from_detail_client", {
        sourceRecipeId: recipeId,
        newRecipeId: data.recipeId,
        regenerationStyle: style ?? null,
      });
      router.push(`/recipes/${data.recipeId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Regeneration failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function onPromoteCompared() {
    if (!compareId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${compareId}/promote`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Promotion failed");
      }

      await trackEvent("recipe_promoted", {
        sourceRecipeId: recipeId,
        promotedRecipeId: compareId,
      });
      router.push(`/recipes/${compareId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Promotion failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSaveFamilyVersion() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/family-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: instruction.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Unable to save family version");
      }

      const data = (await response.json()) as { recipeId: string };
      await trackEvent("recipe_family_version_saved_client", {
        sourceRecipeId: recipeId,
        familyRecipeId: data.recipeId,
        hasNote: Boolean(instruction.trim()),
      });
      router.push(`/recipes/${data.recipeId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save family version");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="detail-actions">
      <div className="detail-actions-row">
        <button type="button" onClick={onPrint}>
          Print Card
        </button>
        <a className="detail-link-btn" href={`/api/recipes/${recipeId}/card`} target="_blank" rel="noreferrer">
          Open Print Card
        </a>
        <button type="button" onClick={onExport}>
          Export TXT
        </button>
        <a className="detail-link-btn" href={`/recipes/${recipeId}/versions`}>
          Full Timeline
        </a>
      </div>

      <div className="detail-actions-row">
        <label>
          Compare with:
          <select
            value={compareId ?? ""}
            onChange={(event) => onCompareChange(event.target.value)}
          >
            <option value="">No comparison</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="detail-actions-row detail-actions-stack">
        <label htmlFor="regen-instruction">Regenerate notes</label>
        <textarea
          id="regen-instruction"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="e.g. make this dairy-free and easier for weeknights"
          rows={3}
        />
      </div>

      <div className="detail-actions-row">
        <button type="button" disabled={isLoading} onClick={() => onRegenerate(undefined)}>
          Regenerate
        </button>
        <button type="button" disabled={isLoading} onClick={() => onRegenerate("faster")}>Faster</button>
        <button type="button" disabled={isLoading} onClick={() => onRegenerate("traditional")}>Traditional</button>
        <button type="button" disabled={isLoading} onClick={() => onRegenerate("vegetarian")}>Vegetarian</button>
        <button type="button" disabled={isLoading} onClick={onSaveFamilyVersion}>
          Save As Family Version
        </button>
        {compareId ? (
          <button type="button" disabled={isLoading || compareIsPromoted} onClick={onPromoteCompared}>
            {compareIsPromoted ? "Compared Version Promoted" : "Promote Compared Version"}
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

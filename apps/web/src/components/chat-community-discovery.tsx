"use client";

import { useEffect, useMemo, useState } from "react";
import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

type TrendRow = {
  cuisine: string;
  title: string;
  recipe_count: string;
  avg_total_minutes: number | null;
  last_created_at: string;
};

type Props = {
  activeCuisine: string | null;
  onUsePrompt: (prompt: string) => void;
};

export function ChatCommunityDiscovery({ activeCuisine, onUsePrompt }: Props) {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string>(activeCuisine ?? "");

  const cuisineOptions = useMemo(
    () => [...new Set(LAUNCH_PERSONAS.map((persona) => persona.cuisine))],
    [],
  );

  useEffect(() => {
    if (!activeCuisine) {
      return;
    }

    setSelectedCuisine(activeCuisine);
  }, [activeCuisine]);

  useEffect(() => {
    async function loadTrends() {
      setIsLoading(true);
      setError(null);
      try {
        const query = selectedCuisine ? `?cuisine=${encodeURIComponent(selectedCuisine)}&limit=9` : "?limit=9";
        const response = await fetch(`/api/discovery/trending${query}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Unable to load community recipes (status ${response.status})`);
        }

        const data = (await response.json()) as { trends: TrendRow[] };
        setRows(data.trends);

        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: "chat_community_discovery_viewed",
            eventProps: {
              selectedCuisine: selectedCuisine || null,
              rowCount: data.trends.length,
              source: "chat_page",
            },
          }),
        });
      } catch (cause) {
        setRows([]);
        setError(cause instanceof Error ? cause.message : "Unable to load community recipe trends");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTrends();
  }, [selectedCuisine]);

  async function onCookLikeThis(row: TrendRow) {
    const prompt = `I want to cook a ${row.cuisine.toLowerCase()} family-style dish inspired by ${row.title}. Keep it nostalgic, practical, and true to grandma-style home cooking.`;
    onUsePrompt(prompt);

    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "chat_community_discovery_used",
          eventProps: {
            cuisine: row.cuisine,
            title: row.title,
            source: "chat_page",
          },
        }),
      });
    } catch {
      // Non-blocking analytics
    }
  }

  return (
    <section className="community-strip">
      <h3>What Families Are Cooking</h3>
      <p>Anonymous inspiration from recent grandma-inspired meals. No identities are shown.</p>

      <div className="community-filters">
        <button
          type="button"
          className={selectedCuisine === "" ? "home-culture-dot home-culture-dot-active" : "home-culture-dot"}
          onClick={() => setSelectedCuisine("")}
        >
          All Cuisines
        </button>
        {cuisineOptions.map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            className={selectedCuisine === cuisine ? "home-culture-dot home-culture-dot-active" : "home-culture-dot"}
            onClick={() => setSelectedCuisine(cuisine)}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading community recipes...</p> : null}
      {!isLoading && rows.length === 0 ? <p>No recent trends yet for this cuisine. Try another filter.</p> : null}

      <div className="community-grid">
        {rows.map((row) => (
          <article key={`${row.cuisine}-${row.title}`} className="community-card">
            <strong>{row.title}</strong>
            <p>{row.cuisine}</p>
            <p>{row.recipe_count} recent cooks</p>
            <p>{row.avg_total_minutes ? `~${row.avg_total_minutes} min` : "Time varies"}</p>
            <div className="community-card-actions">
              <button type="button" onClick={() => onCookLikeThis(row)}>
                Cook a Version Like This
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

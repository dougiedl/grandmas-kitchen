"use client";

import { useEffect } from "react";

type Trend = {
  cuisine: string;
  title: string;
  recipe_count: string;
};

export function CommunityTrendsClient({ rows }: { rows: Trend[] }) {
  useEffect(() => {
    async function track() {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: "community_trends_viewed",
            eventProps: {
              rowCount: rows.length,
              cuisines: [...new Set(rows.map((row) => row.cuisine))],
              source: "recipes_page",
            },
          }),
        });
      } catch {
        // Non-blocking analytics
      }
    }

    void track();
  }, [rows]);

  return (
    <section className="community-strip">
      <h3>Community Kitchen Trends</h3>
      <p>Anonymized snapshots of what cooks with similar cuisines are making this month.</p>
      <div className="community-grid">
        {rows.map((row) => (
          <article key={`${row.cuisine}-${row.title}`} className="community-card">
            <strong>{row.title}</strong>
            <p>{row.cuisine}</p>
            <p>{row.recipe_count} recent cooks</p>
          </article>
        ))}
      </div>
    </section>
  );
}

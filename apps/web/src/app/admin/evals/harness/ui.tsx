"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvalRunSummary } from "@/lib/evals/types";

type ApiError = { error?: string };

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export function EvalHarnessClient() {
  const [summary, setSummary] = useState<EvalRunSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/evals/harness/latest", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(data.error ?? `Failed to load latest harness run (${response.status})`);
      }

      const data = (await response.json()) as EvalRunSummary | { run: null };
      setSummary("run" in data && data.run ? (data as EvalRunSummary) : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load eval harness");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  async function seedCases() {
    setIsSeeding(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/evals/harness/seed", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(data.error ?? `Failed to seed eval cases (${response.status})`);
      }

      const data = (await response.json()) as { seeded: number };
      setNotice(`Seeded ${data.seeded} baseline cases.`);
      await loadLatest();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to seed cases");
    } finally {
      setIsSeeding(false);
    }
  }

  async function runHarness() {
    setIsRunning(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/evals/harness/run", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(data.error ?? `Failed to run eval harness (${response.status})`);
      }

      const data = (await response.json()) as EvalRunSummary;
      setSummary(data);
      setNotice("Eval harness completed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to run eval harness");
    } finally {
      setIsRunning(false);
    }
  }

  const runState = useMemo(() => {
    if (!summary) {
      return "No eval run yet.";
    }

    const avg = summary.run.avgTotalScore === null ? "-" : summary.run.avgTotalScore.toFixed(2);
    return `Model ${summary.run.modelName ?? "-"} | ${summary.run.completedCases}/${summary.run.totalCases} cases | Avg ${avg}`;
  }, [summary]);

  return (
    <section>
      <h2>Eval Harness</h2>
      <p>Seed baseline test prompts and run quality scoring against current recipe generation logic.</p>

      <div className="detail-actions-row">
        <button type="button" onClick={seedCases} disabled={isSeeding || isRunning}>
          {isSeeding ? "Seeding..." : "Seed Baseline Cases"}
        </button>
        <button type="button" onClick={runHarness} disabled={isRunning || isSeeding}>
          {isRunning ? "Running..." : "Run Harness"}
        </button>
        <button type="button" onClick={() => void loadLatest()} disabled={isLoading || isRunning || isSeeding}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {notice ? <p>{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="alerts-panel">
        <strong>Latest run:</strong> {runState}
        {summary ? (
          <>
            <p>
              Started {formatDateTime(summary.run.startedAt)} | Finished {formatDateTime(summary.run.finishedAt)}
            </p>
            <p>
              Release gate: <strong className={summary.gate.status === "pass" ? "readiness-pass" : "readiness-fail"}>
                {summary.gate.status.toUpperCase()}
              </strong>
            </p>
            {summary.gate.reasons.length > 0 ? (
              <ul>
                {summary.gate.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p>All eval thresholds satisfied.</p>
            )}
          </>
        ) : null}
      </div>

      {summary ? (
        <div className="admin-grid">
          <article className="admin-card">
            <h3>Cuisine Breakdown</h3>
            <ul>
              {summary.cuisineBreakdown.map((item) => (
                <li key={item.cuisine}>
                  {item.cuisine}: avg {item.avgScore.toFixed(2)}, weak authenticity {item.weakAuthenticityCount}/
                  {item.totalCases}
                </li>
              ))}
            </ul>
          </article>
          <article className="admin-card">
            <h3>Top Cases</h3>
            <ul>
              {summary.topCases.map((item) => (
                <li key={item.slug}>
                  {item.slug} ({item.cuisine}) - {item.totalScore.toFixed(2)}
                  {item.notes ? ` | ${item.notes}` : ""}
                </li>
              ))}
            </ul>
          </article>

          <article className="admin-card">
            <h3>Bottom Cases</h3>
            <ul>
              {summary.bottomCases.map((item) => (
                <li key={item.slug}>
                  {item.slug} ({item.cuisine}) - {item.totalScore.toFixed(2)}
                  {item.notes ? ` | ${item.notes}` : ""}
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}
    </section>
  );
}

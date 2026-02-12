"use client";

import Link from "next/link";
import type { LaunchPersona } from "@/lib/personas/launch-personas";

type Props = {
  persona: LaunchPersona;
  copyVersion: string;
};

export function PersonaCardLink({ persona, copyVersion }: Props) {
  async function trackSelection() {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "home_persona_selected",
          eventProps: {
            personaId: persona.id,
            personaName: persona.name,
            cuisine: persona.cuisine,
            copyVersion,
            source: "home_persona_card",
          },
        }),
      });
    } catch {
      // Non-blocking analytics
    }
  }

  return (
    <Link className="persona-card-link" href={`/chat?persona=${persona.id}`} onClick={() => void trackSelection()}>
      <article className="persona-card">
        <h4>{persona.name}</h4>
        <p className="persona-cuisine">{persona.cuisine}</p>
        <p>{persona.summary}</p>
        <div className="chip-row">
          {persona.signatures.map((signature) => (
            <span className="chip" key={signature}>
              {signature}
            </span>
          ))}
        </div>
        <span className="persona-cta">Start Cooking with {persona.name}</span>
      </article>
    </Link>
  );
}

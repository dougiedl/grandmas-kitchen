import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ signin?: string }>;
}) {
  const params = await searchParams;
  const shouldPromptSignIn = params?.signin === "1";

  return (
    <section>
      <h2>Welcome Home</h2>
      <p>
        Grandma's Kitchen turns ingredients, cravings, and family memories into grandma-inspired
        recipes.
      </p>
      {shouldPromptSignIn ? (
        <p className="signin-prompt">
          Please sign in to continue to protected areas like Chat, Profile, and Recipes.
        </p>
      ) : null}
      <p>This Sprint 1 shell is ready for Google OAuth, personas, and recipe chat.</p>
      <h3>Choose Your Grandma Style</h3>
      <div className="persona-grid">
        {LAUNCH_PERSONAS.map((persona) => (
          <article key={persona.id} className="persona-card">
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
          </article>
        ))}
      </div>
    </section>
  );
}

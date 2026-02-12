import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";
import { PersonaCardLink } from "@/components/persona-card-link";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ signin?: string }>;
}) {
  const params = await searchParams;
  const shouldPromptSignIn = params?.signin === "1";
  const cuisines = [...new Set(LAUNCH_PERSONAS.map((persona) => persona.cuisine))];
  const copyVersion = "ux-conversion-v1";

  return (
    <section className="home-hero home-hero-rotating">
      <p className="section-kicker">Nostalgia-first recipe companion</p>
      <h2>Welcome Home</h2>
      <p className="lead-text">
        Turn ingredients, cravings, and family food memories into recipes that feel like home.
      </p>
      <div className="chip-row">
        {cuisines.map((cuisine) => (
          <span className="chip" key={cuisine}>
            {cuisine}
          </span>
        ))}
      </div>
      {shouldPromptSignIn ? (
        <p className="signin-prompt">
          Sign in to start your personalized grandma chat and save recipes.
        </p>
      ) : null}
      <p>Pick a grandma style below, or jump to Chat and describe your own background in your own words.</p>
      <div className="onboarding-strip">
        <article className="onboarding-step">
          <strong>1. Pick a Grandma</strong>
          <p>Choose the cuisine and family voice you want to cook with first.</p>
        </article>
        <article className="onboarding-step">
          <strong>2. Share Your Memory</strong>
          <p>Add ingredients, craving, and regional cues like Sicilian, Oaxacan, or Persian.</p>
        </article>
        <article className="onboarding-step">
          <strong>3. Save Family Versions</strong>
          <p>Save your best variants as family editions to cook again and pass down.</p>
        </article>
      </div>
      <h3>Choose Your Grandma Style</h3>
      <div className="persona-grid">
        {LAUNCH_PERSONAS.map((persona) => (
          <PersonaCardLink key={persona.id} persona={persona} copyVersion={copyVersion} />
        ))}
      </div>
    </section>
  );
}

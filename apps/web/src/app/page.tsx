import { HomeCultureHero } from "@/components/home-culture-hero";
import { PersonaCardLink } from "@/components/persona-card-link";
import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ signin?: string }>;
}) {
  const params = await searchParams;
  const shouldPromptSignIn = params?.signin === "1";
  const featuredPersonas = LAUNCH_PERSONAS.filter((persona) => persona.featured !== false);
  const cuisines = [...new Set(featuredPersonas.map((persona) => persona.cuisine))];
  const copyVersion = "ux-conversion-v1";

  return (
    <section>
      <HomeCultureHero cuisines={cuisines} shouldPromptSignIn={shouldPromptSignIn} />

      <section className="home-hero">
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
          {featuredPersonas.map((persona) => (
            <PersonaCardLink key={persona.id} persona={persona} copyVersion={copyVersion} />
          ))}
        </div>
      </section>
    </section>
  );
}

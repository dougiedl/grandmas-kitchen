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
        <div className="home-welcome-grid">
          <article className="home-welcome-card">
            <strong>For Every Background</strong>
            <p>
              Whether your grandma was from Naples, San Juan, Seoul, Kingston, Beirut, or beyond, start with your
              memory and we&apos;ll guide the style.
            </p>
          </article>
          <article className="home-welcome-card">
            <strong>Memory-First Chat</strong>
            <p>
              Don&apos;t worry about perfect ingredient names. Describe what it tasted like, what she called it, and when
              your family made it.
            </p>
          </article>
          <article className="home-welcome-card">
            <strong>Refine As You Cook</strong>
            <p>
              Ask for swaps, fixes, and next steps in real time. The assistant should keep context and coach like a
              real kitchen conversation.
            </p>
          </article>
        </div>

        <div className="onboarding-strip">
          <article className="onboarding-step">
            <strong>1. Share a Food Memory</strong>
            <p>Describe the dish, the occasion, and what made it feel like home.</p>
          </article>
          <article className="onboarding-step">
            <strong>2. Add What You Have</strong>
            <p>List ingredients, dietary needs, and any regional clues you remember.</p>
          </article>
          <article className="onboarding-step">
            <strong>3. Keep The Family Version</strong>
            <p>Save your best version and keep refining it for future Sunday dinners.</p>
          </article>
        </div>

        <h3>Popular Grandma Styles</h3>
        <div className="persona-grid">
          {featuredPersonas.map((persona) => (
            <PersonaCardLink key={persona.id} persona={persona} copyVersion={copyVersion} />
          ))}
        </div>
      </section>
    </section>
  );
}

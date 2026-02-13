"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  cuisines: string[];
  shouldPromptSignIn: boolean;
};

type CultureDetail = {
  cuisine: string;
  line: string;
};

const CULTURE_DETAILS: CultureDetail[] = [
  { cuisine: "Italian", line: "Sunday gravy, simmered slowly, with a bustling family table." },
  { cuisine: "Mexican", line: "Toasted chiles, warm tortillas, and stories shared across generations." },
  { cuisine: "Greek", line: "Olive oil, lemon, and herbs on a bright coastal home table." },
  { cuisine: "Spanish", line: "Saffron, garlic, and rustic stews meant for sharing." },
  { cuisine: "French", line: "Butter, herbs, and patient stovetop technique in a cozy kitchen." },
  { cuisine: "Lebanese", line: "Mezze platters, citrus, and all-day hospitality from the heart." },
  { cuisine: "Persian", line: "Saffron rice, bright herbs, and layered sweet-savory depth." },
  { cuisine: "Chinese", line: "Wok hei aromas, ginger-scallion comfort, and bustling family dinners." },
  { cuisine: "Indian", line: "Tempered spices, masala warmth, and deeply comforting home plates." },
  { cuisine: "Japanese", line: "Balanced umami, seasonal ingredients, and gentle home-kitchen rhythm." },
  { cuisine: "Jamaican", line: "Island spice, allspice depth, and joyful Sunday-pot togetherness." },
];

function cultureClass(cuisine: string): string {
  const text = cuisine.toLowerCase();
  if (text.includes("ital")) return "home-culture-italian";
  if (text.includes("mex")) return "home-culture-mexican";
  if (text.includes("greek")) return "home-culture-greek";
  if (text.includes("span")) return "home-culture-spanish";
  if (text.includes("french")) return "home-culture-french";
  if (text.includes("leban")) return "home-culture-lebanese";
  if (text.includes("pers")) return "home-culture-persian";
  if (text.includes("chin")) return "home-culture-chinese";
  if (text.includes("ind")) return "home-culture-indian";
  if (text.includes("japan")) return "home-culture-japanese";
  if (text.includes("jama")) return "home-culture-jamaican";
  return "home-culture-home";
}

export function HomeCultureHero({ cuisines, shouldPromptSignIn }: Props) {
  const details = useMemo(() => {
    const ordered = cuisines
      .map((cuisine) => CULTURE_DETAILS.find((detail) => detail.cuisine === cuisine))
      .filter((value): value is CultureDetail => Boolean(value));

    return ordered.length > 0 ? ordered : CULTURE_DETAILS.slice(0, 4);
  }, [cuisines]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || details.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % details.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [details.length, reduceMotion]);

  const active = details[activeIndex];

  return (
    <section className={`home-hero home-hero-rotating ${cultureClass(active.cuisine)}`}>
      <p className="section-kicker">Nostalgia-first recipe companion</p>
      <h2>Welcome Home</h2>
      <p className="lead-text">
        Turn ingredients, cravings, and family food memories into recipes that feel like home.
      </p>
      <div className="home-culture-badge-row">
        <p className="home-culture-badge">
          Currently featuring <strong>{active.cuisine}</strong> kitchens
        </p>
        <p className="home-culture-line">{active.line}</p>
      </div>
      <div className="home-culture-controls" role="tablist" aria-label="Supported culture backgrounds">
        {details.map((detail, index) => (
          <button
            key={detail.cuisine}
            type="button"
            className={index === activeIndex ? "home-culture-dot home-culture-dot-active" : "home-culture-dot"}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${detail.cuisine} kitchen theme`}
            aria-selected={index === activeIndex}
            role="tab"
          >
            {detail.cuisine}
          </button>
        ))}
      </div>
      {shouldPromptSignIn ? (
        <p className="signin-prompt">
          Sign in to start your personalized grandma chat and save recipes.
        </p>
      ) : null}
      <p>Pick a grandma style below, or jump to Chat and describe your own background in your own words.</p>
    </section>
  );
}

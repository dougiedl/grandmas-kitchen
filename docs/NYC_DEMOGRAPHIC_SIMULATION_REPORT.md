# NYC Demographic Simulation + Gap-Fill Report

Date: 2026-02-13  
Scope: style inference coverage and knowledge-layer readiness for NYC-like multicultural usage.

## Method

1. Build a representative NYC prompt set across major communities.
2. Simulate support coverage against:
   - baseline supported cuisines (11 launch cuisines)
   - expanded supported cuisines after gap fill
3. Add missing personas, style catalog rows, routing cues, and knowledge packs.
4. Re-run simulation and record delta.

Command:

```bash
npm run qa:nyc-sim
```

## Results

### Baseline (before gap fill)

- Coverage: 11/18 (61%)
- Not served:
  - Russian
  - Puerto Rican
  - Dominican
  - Korean
  - Filipino
  - Jewish
  - West African

### Expanded (after gap fill)

- Coverage: 18/18 (100%)

## What Was Added

### New persona/cuisine coverage

- Russian (`Babushka Anya`)
- Puerto Rican (`Abuela Marisol`)
- Dominican (`Abuela Yolanda`)
- Korean (`Halmeoni Soon`)
- Filipino (`Lola Maria`)
- Jewish (`Bubbe Rivka`)
- West African (`Mama Efua`)

### New style catalog coverage

Added style rows for all new cuisines in `/db/seeds/style-catalog.sql` with regional aliases and voice profiles.

### Inference/routing improvements

- Strong cuisine signal weighting for new cultural cues.
- Clarification mode for weak/unsupported confidence (ask one more clue instead of wrong guess).
- Strict token matching to avoid substring collisions (e.g. `can` inside `Oaxacan`).

### Knowledge packs added

New packs in `/apps/web/src/lib/knowledge/packs`:

- `chinese.v1.json`
- `indian.v1.json`
- `japanese.v1.json`
- `jamaican.v1.json`
- `russian.v1.json`
- `puerto-rican.v1.json`
- `dominican.v1.json`
- `korean.v1.json`
- `filipino.v1.json`
- `jewish.v1.json`
- `west-african.v1.json`

## Current UX Shortcomings

1. Clarification chips currently list available cuisines in a flat list, which still feels system-driven.
2. Clarification prompt asks for region/dish but does not yet provide context-aware examples based on the user text.
3. Discovery/trending and onboarding copy can still over-emphasize explicit cuisine selection before memory narrative.

## UX Remedy Plan

1. Clarification UX v2
   - Convert clarification into two-step:
     - "Closest culture"
     - "Signature dish your grandma made"
   - Use answer to lock style with higher confidence.
2. Memory-first composer
   - Lead prompt: "Tell me what your grandma called this dish and what it tasted like."
   - Auto-detect culture silently; show style only after confidence lock.
3. Progressive disclosure
   - Keep homepage to featured cuisines.
   - Keep long-tail cuisines in auto-detect and clarification flow, not main card wall.
4. Regression safety
   - Add NYC scenario assertions to eval harness (routing pass/fail + conversation quality).

## Operational Notes

- After pulling these changes, run:

```bash
npm run db:seed
```

to ensure new personas and styles are loaded locally.

# Grandma's Kitchen - CTO Packet V2

## Objective
Replace fixed persona-first onboarding with a universal chat that infers **cooking style** from user context, asks for confirmation, and personalizes over time.

Key principle: infer cuisine/style intent, not personal identity.

## Product Vision
- Single, clean entry point to avoid UI crowding.
- Highly inclusive style coverage via searchable catalog (not giant card grid).
- "Grandma familiarity" preserved through dynamic voice, region-aware recipes, and memory.

## UX System
### Primary Flow
1. User opens Chat and submits freeform context.
2. System infers likely style (`cuisine + regional variant + confidence`).
3. System asks for quick confirmation if needed.
4. Recipe generation runs with selected style context.
5. User corrections feed profile learning for future sessions.

### Core UI Components
1. `Style Bar` (top of chat)
- Label: `Cooking as: Sicilian Italian-American`
- Actions: `Change`, `Why this style?`

2. `Inference Prompt`
- High confidence: `This sounds like Sicilian Italian-American. Continue?`
- Medium/low confidence: show top 2-4 options as chips.

3. `Style Picker Modal`
- Search field
- Region groupings
- Recent styles
- Favorites

4. `Fallback State`
- If no strong signal, suggest broad cuisine families with one-click select.

### UX Guardrails
- Never state or infer user ethnicity directly.
- Phrase decisions as cooking-style suggestions.
- Always provide override.

## Technical Architecture
### Pipeline
1. `Style Inference`
- Lightweight classifier/function call from first user input.
- Output: primary style, alternatives, confidence, tags.

2. `Style Confirmation`
- Thread-level selected style set explicitly.

3. `Knowledge Retrieval`
- Pull only style-relevant snippets from catalog + knowledge pack.

4. `Recipe Generation`
- Structured JSON schema output.
- Inject selected style, regional notes, user preference memory.

5. `Evaluation`
- Authenticity, realism, and personalization checks by style bucket.

## Data Model Changes
### New Tables
1. `style_catalog`
- `id text primary key`
- `cuisine text not null`
- `region text`
- `label text not null`
- `aliases text[] not null default '{}'`
- `voice_profile jsonb not null default '{}'::jsonb`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`

2. `thread_style_state`
- `thread_id uuid primary key references conversation_threads(id) on delete cascade`
- `inferred_style_id text references style_catalog(id)`
- `selected_style_id text references style_catalog(id)`
- `confidence numeric(4,2)`
- `reasoning_tags text[] not null default '{}'`
- `confirmed_at timestamptz`
- `updated_at timestamptz not null default now()`

3. `user_style_preferences`
- `id uuid primary key`
- `user_id uuid not null references users(id) on delete cascade`
- `style_id text not null references style_catalog(id)`
- `weight numeric(6,2) not null default 0`
- `source text not null` -- accepted/manual/rejected/regenerated
- `created_at timestamptz not null default now()`

4. `style_inference_events`
- `id uuid primary key`
- `user_id uuid references users(id) on delete set null`
- `thread_id uuid references conversation_threads(id) on delete set null`
- `input_excerpt text`
- `inferred_style_id text`
- `selected_style_id text`
- `confidence numeric(4,2)`
- `accepted boolean`
- `event_props jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

### Indexes
- `idx_style_catalog_cuisine_active (cuisine, active)`
- `idx_user_style_pref_user_weight (user_id, weight desc, created_at desc)`
- `idx_style_inference_events_created (created_at desc)`

## API Contracts
### `POST /api/style/infer`
Request:
```json
{
  "threadId": "uuid-or-null",
  "message": "freeform user text",
  "currentStyleId": "optional-style-id"
}
```

Response:
```json
{
  "primaryStyle": {
    "id": "it_sicilian_american",
    "label": "Sicilian Italian-American",
    "cuisine": "Italian",
    "region": "Sicilian-American",
    "confidence": 0.88
  },
  "alternatives": [
    { "id": "it_neapolitan", "label": "Neapolitan", "confidence": 0.66 }
  ],
  "reasoningTags": ["sicilian", "red-sauce", "sunday-dinner"]
}
```

### `POST /api/style/confirm`
Request:
```json
{
  "threadId": "uuid",
  "selectedStyleId": "it_sicilian_american",
  "inferredStyleId": "it_sicilian_american",
  "confidence": 0.88
}
```

Response:
```json
{
  "ok": true,
  "selectedStyle": {
    "id": "it_sicilian_american",
    "label": "Sicilian Italian-American"
  }
}
```

### `GET /api/styles/search?q=<term>&cuisine=<optional>&limit=<optional>`
Response:
```json
{
  "styles": [
    {
      "id": "jp_kansai_home",
      "label": "Kansai Home Style",
      "cuisine": "Japanese",
      "region": "Kansai"
    }
  ]
}
```

### `POST /api/profile/style-feedback`
Request:
```json
{
  "threadId": "uuid",
  "styleId": "it_sicilian_american",
  "action": "accepted"
}
```

## Prompting and Knowledge
### Style-Aware Prompt Contract
Require:
- ingredient grounding
- style authenticity cues
- home-cook realism
- practical substitutions
- strict schema output

### Style Knowledge Pack Structure
- pantry anchors
- technique rules
- flavor pairings
- signature dishes
- substitutions
- don’ts
- regional snippets/tags

### Retrieval Contract
- Select top relevant snippets by:
  - style ID
  - prompt keywords
  - user preference memory
  - generation mode (weeknight/sunday/etc.)

## Implementation Plan
### Sprint 1 (5-7 days): Inference + Confirmation Foundation
1. Create migration for style tables.
2. Seed initial style catalog with existing cuisines + regional variants.
3. Implement `POST /api/style/infer`.
4. Add `thread_style_state` read/write in chat start/message flow.
5. Add confirmation chips UI in chat.

Acceptance:
- Inference response under 800ms p95.
- User can confirm/override before recipe generation.
- Thread stores selected style.

### Sprint 2 (5-7 days): Style Picker + Dynamic UX
1. Build searchable style picker modal.
2. Replace homepage persona dependency with unified chat CTA.
3. Add `Style Bar` and `Why this style?` explainer.
4. Tie dynamic background/voice to selected style.

Acceptance:
- No homepage style-grid requirement.
- User can switch style in <= 2 clicks.
- Mobile and desktop both pass UX QA.

### Sprint 3 (5-7 days): Personalization Memory Loop
1. Implement `user_style_preferences` writebacks.
2. Add feedback events (`accepted`, `rejected`, `manual-switch`).
3. Update inference ranking with memory weights.
4. Add profile section: preferred cuisines/styles.

Acceptance:
- Returning users see relevant style suggestions.
- Correction rate drops over repeated sessions.

### Sprint 4 (5-7 days): Eval + Rollout Safety
1. Expand eval harness with style-level authenticity checks.
2. Add release gate thresholds:
  - avg quality >= 82
  - weak authenticity count below threshold
3. Add feature flag for staged rollout.
4. Add admin report cards for style inference quality.

Acceptance:
- No regression in recipe structure realism.
- Inference correction telemetry visible in admin.

## Quality Gates
### Functional
- Inference returns valid style payload.
- Confirmation writes thread state.
- Style switch changes generation behavior.

### UX
- Readable UI with background overlays.
- No layout crowding from style expansion.
- Accessible keyboard flow for picker + chips.

### Safety
- No language claiming user identity.
- No hidden style lock-in.
- Explicit override always present.

## Metrics
### North-Star
- First-session activation to first saved recipe.

### Supporting
- Style confirmation rate
- Style correction rate
- Recipe regeneration rate after confirmation
- D7 retention among activated users
- "Felt like home" feedback score

## Risks and Mitigations
1. Misclassification frustration
- Mitigation: confidence-aware fallback + easy override.

2. Cultural flattening
- Mitigation: regional packs + eval authenticity checks.

3. Prompt bloat
- Mitigation: retrieval subset injection only.

4. UI complexity creep
- Mitigation: one chat entry + modal search, not card explosion.

## Engineer Execution Checklist
1. Add DB migration for style tables and indexes.
2. Add style catalog seed with initial 30-60 styles.
3. Implement `POST /api/style/infer`.
4. Implement `POST /api/style/confirm`.
5. Implement `GET /api/styles/search`.
6. Wire chat UI for inference chips and style bar.
7. Add style switch modal.
8. Wire selected style into recipe generation context.
9. Add telemetry events and admin metrics.
10. Expand eval harness and release gate.

## Rollout
1. Internal only (team accounts) for 2-3 days.
2. Friend/family beta (50-100 users).
3. Gradual percentage rollout behind feature flag.

## Definition of Done
- Users can start from one universal chat.
- System suggests style and asks for confirmation.
- User can override style at any point.
- Style memory improves future suggestions.
- Eval gates pass with no major regressions.

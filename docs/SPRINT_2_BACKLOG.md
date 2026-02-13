# Sprint 2 Backlog (2 weeks)

Sprint goal: ship V2 universal onboarding where style is inferred from user context, confirmed quickly, and used for higher-fidelity grandma-style generation without UI crowding.

## Capacity Assumption

- 1 full-stack engineer (execution owner)
- 1 product/design owner (you)
- 10 working days
- ~45 focused engineering hours/week

## Roles

- `ENG` = Full-stack engineer (implementation)
- `PM/DESIGN` = Product + UX decisions, copy, visual approvals
- `QA` = QA pass (same engineer unless delegated)

## Tickets (Linear/Jira Ready)

### GK-201 Style data model migration

- Priority: P0
- Estimate: 5 points
- Owner: ENG
- Dependencies: none
- Description: Add schema for style catalog, thread style state, user style preferences, and style inference events.
- Scope:
  - `style_catalog`
  - `thread_style_state`
  - `user_style_preferences`
  - `style_inference_events`
  - indexes for lookup and reporting
- Acceptance tests:
  - `npm run db:migrate` applies cleanly on fresh DB.
  - All new tables and indexes exist.
  - Existing app routes still function after migration.

### GK-202 Style catalog seed v1

- Priority: P0
- Estimate: 3 points
- Owner: ENG
- Dependencies: GK-201
- Description: Seed initial style catalog with major cuisines + regional variants and aliases.
- Scope:
  - 30-60 style rows minimum
  - include current launch cuisines + new expansions
  - alias coverage for likely user phrasing
- Acceptance tests:
  - `npm run db:seed` inserts/updates catalog idempotently.
  - `select count(*) from style_catalog where active = true` >= 30.
  - Search by alias returns expected style IDs.

### GK-203 Style inference API

- Priority: P0
- Estimate: 8 points
- Owner: ENG
- Dependencies: GK-201, GK-202
- Description: Implement `POST /api/style/infer` using prompt context + profile memory to return primary style, alternatives, and confidence.
- Scope:
  - deterministic response schema
  - confidence scoring bands
  - reasoning tags for explainability
- Acceptance tests:
  - Valid request returns `200` and contract fields.
  - Empty/noisy request returns safe fallback options.
  - Unauthorized request returns `401`.

### GK-204 Style confirmation API and thread state

- Priority: P0
- Estimate: 5 points
- Owner: ENG
- Dependencies: GK-201, GK-203
- Description: Implement `POST /api/style/confirm` and persist selected style per thread.
- Scope:
  - write `thread_style_state`
  - id validation against `style_catalog`
  - store confidence and tags
- Acceptance tests:
  - Confirm call sets `selected_style_id` for thread.
  - Invalid style ID returns `400`.
  - Thread ownership enforced.

### GK-205 Style search API

- Priority: P1
- Estimate: 3 points
- Owner: ENG
- Dependencies: GK-202
- Description: Implement `GET /api/styles/search` for picker modal.
- Scope:
  - query + optional cuisine + limit
  - alias matching
  - stable ordering by relevance
- Acceptance tests:
  - Search returns matching styles for keyword and alias.
  - Pagination/limit works.
  - Unauthorized returns `401`.

### GK-206 Chat inference UI (chips + explainability)

- Priority: P0
- Estimate: 8 points
- Owner: ENG
- Dependencies: GK-203, GK-204
- Description: Add first-turn inference UX in chat and confirmation chips.
- Scope:
  - "I think this style fits" prompt
  - quick actions: `Use this`, `Show options`, `Change`
  - "Why this style?" text based on tags
- Acceptance tests:
  - First user message triggers inference UI.
  - Confirming style updates active style bar.
  - User can proceed without dead ends.

### GK-207 Style bar + switch flow

- Priority: P0
- Estimate: 5 points
- Owner: ENG
- Dependencies: GK-204, GK-205
- Description: Add persistent style bar in chat and change-style flow.
- Scope:
  - style label visible in active thread
  - style switch action updates thread state
  - switch preserves conversation continuity
- Acceptance tests:
  - Style change reflects in subsequent recipe output context.
  - No thread reset required to switch style.

### GK-208 Style picker modal

- Priority: P1
- Estimate: 5 points
- Owner: ENG
- Dependencies: GK-205
- Description: Build searchable modal to choose cuisine/regional style without homepage crowding.
- Scope:
  - search input
  - grouped results
  - recent picks section
- Acceptance tests:
  - Keyboard navigable modal.
  - Selecting style closes modal and updates style bar.
  - Mobile layout usable at 375px width.

### GK-209 Generation pipeline wiring

- Priority: P0
- Estimate: 8 points
- Owner: ENG
- Dependencies: GK-204, GK-206
- Description: Feed selected style context into recipe generation + retrieval contract.
- Scope:
  - include selected style in prompt assembly
  - retrieve style-specific knowledge snippets
  - fallback behavior when style missing
- Acceptance tests:
  - Generated recipes reflect selected style constraints.
  - JSON schema output remains valid.
  - Existing regen modes still work (`faster`, `traditional`, `vegetarian`).

### GK-210 Profile learning writes

- Priority: P1
- Estimate: 5 points
- Owner: ENG
- Dependencies: GK-201, GK-204, GK-209
- Description: Persist acceptance/rejection/manual-switch signals and use them to bias future inference.
- Scope:
  - write to `user_style_preferences`
  - simple weight strategy (recency + positive/negative updates)
- Acceptance tests:
  - Accepting style increases preference weight.
  - Rejection decreases style priority.
  - Returning user gets adjusted suggestions.

### GK-211 Telemetry and admin reporting hooks

- Priority: P1
- Estimate: 5 points
- Owner: ENG
- Dependencies: GK-203, GK-204, GK-210
- Description: Track inference quality and corrections in analytics/admin views.
- Scope:
  - emit style inference events
  - add admin summary cards (acceptance rate, correction rate, top inferred styles)
- Acceptance tests:
  - Events captured for infer/confirm/change.
  - Admin page renders non-error snapshot for new metrics.

### GK-212 Sprint 2 QA gate and release note

- Priority: P0
- Estimate: 3 points
- Owner: QA
- Dependencies: All P0/P1 tickets
- Description: Run full regression checks and record rollout recommendation.
- Scope:
  - auth, style flow, chat generation, recipes, admin
  - cross-device sanity (desktop + mobile)
  - production build checks
- Acceptance tests:
  - `npm run lint` passes.
  - `npm run build` passes.
  - smoke checklist documented with pass/fail notes.

## Suggested Execution Order

1. GK-201
2. GK-202
3. GK-203
4. GK-204
5. GK-206
6. GK-209
7. GK-205
8. GK-207
9. GK-208
10. GK-210
11. GK-211
12. GK-212

## Sprint 2 Definition of Done

- Universal chat flow works without requiring homepage persona grid.
- Style inference + confirmation works and is overridable.
- Style selection influences recipe generation quality.
- Preference memory updates future style suggestions.
- No P0 defects open.
- Build/lint green and QA evidence documented.

## Out of Scope (explicit)

- Full global cuisine coverage beyond seeded catalog.
- Paid personalization/monetization features.
- Public social profiles or user-to-user interaction.
- Advanced model fine-tuning (use prompt/retrieval adaptation first).

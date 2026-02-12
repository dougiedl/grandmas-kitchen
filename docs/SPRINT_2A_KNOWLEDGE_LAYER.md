# Sprint 2A - Knowledge Layer Hardening

## Goal

Strengthen cuisine authenticity consistency before expansion cuisines.

## Implemented

1. Structured cuisine knowledge packs in code (`apps/web/src/lib/chat/cuisine-knowledge.ts`):
- pantry anchors
- technique rules
- flavor pairings
- signature dishes
- substitutions
- anti-patterns ("don'ts")
- tagged memory snippets

2. Deterministic retrieval/ranking:
- infers tags from prompt + regeneration mode + regional style
- ranks snippets by tag and keyword overlap
- injects top snippets only (bounded context)
- optional embeddings rerank via OpenAI embeddings with DB cache table `knowledge_embedding_cache`

3. Prompt contract upgrade:
- explicit JSON-only output requirement
- schema expectations in system prompt
- hard constraints for ingredient grounding + home-cook realism + authenticity

4. Eval gate tightening:
- per-cuisine authenticity token checks in scoring
- gate fail conditions in harness:
  - avg score < 82
  - worst-case score < 68
  - authenticity_weak rate > 20%

## Expansion Cuisine Rule

Do not launch additional cuisines until eval harness gate status is PASS.

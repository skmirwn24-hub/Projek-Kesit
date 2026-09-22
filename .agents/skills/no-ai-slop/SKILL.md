---
name: no-ai-slop
description: >-
  Eliminate AI slop, robotic prose, and generic AI coding boilerplate in both human writing and Next.js development.
  Combines Peter Yang's no-ai-slop editing/detecting principles with production-grade Next.js App Router standards.
  Use when editing copy, reviewing code, writing Next.js features, or ensuring text and software remain sharp, authentic, and free of AI clichés.
---

# No AI Slop (Writing & Next.js Standards)

This skill enforces high-standard, authentic human writing and production-grade Next.js engineering. It strips out generic AI filler, corporate buzzwords, and redundant coding patterns while preserving personality, precision, and performance.

---

## PART 1: WRITING & COPYWRITING STANDARDS (Peter Yang's no-ai-slop)

You are a sharp human editor. Preserve the user's point and personal voice while making the writing clearer and more alive. Remove AI patterns without turning distinctive writing into generic polished prose.

### Two Jobs

1. **Edit (Default)**: When a draft is provided, apply the minimum effective edit using the principles below. Output the revised draft followed by a brief **What changed** summary.
2. **Detect**: When asked to audit or identify AI slop without rewriting, cite each detected pattern with the exact quoted text and a concise recommendation for improvement. Do not guess probabilities or rewrite unless requested.

### Clarifying Context

- If the audience or format is ambiguous, ask: *Who is this for and where will it live?*
- If the objective is vague, ask: *What should the reader think, feel, or do after reading?*

### Core Editing Principles

- **Preserve the writer's authentic voice**: Maintain natural cadence, humor, bluntness, and style. Avoid over-polishing into sterile corporate tone.
- **Minimum effective edit**: Fix actual AI patterns, errors, and bloated phrasing; leave strong, human sentences intact.
- **Lead with substance**: Remove throat-clearing intros; open with the core message unless an introductory anecdote provides genuine context.
- **Concrete over abstract**: Replace vague claims with specific numbers, names, dates, and measurable outcomes.
- **Active voice & direct verbs**: Use direct, punchy verbs rather than weak verb phrases ("decided" over "came to a decision").
- **Pass the portability test**: If a sentence could describe any generic company or product without modification, rewrite or delete it.
- **Show, don't tell**: Let evidence and facts convince the reader rather than asserting importance ("crucial", "vital", "revolutionary").

### Words and Phrases to Cut

- **Banned outright**: *delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving*.
- **Empty adverbs (cut if adding no value)**: *literally, honestly, simply, actually, truly, fundamentally, importantly, crucially, inherently, inevitably*.
- **Throat-clearing phrases**: *it's worth noting, at the end of the day, when it comes to, at its core, in today's world, the reality is, in terms of, going forward, let's dive in*.

### Patterns to Eliminate

- **Binary contrasts**: *"It's not X, it's Y."* $\rightarrow$ State Y directly.
- **Faux-insight setups**: *"Here's what everyone misses:", "The uncomfortable truth:"* $\rightarrow$ State the observation directly.
- **Dramatic colon reveals**: *"The secret: simplicity."* $\rightarrow$ State the sentence plainly without melodramatic punctuation.
- **Superficial trailing clauses**: Avoid empty trailing `-ing` clauses like *"highlighting the team's ongoing commitment"*.
- **Fake-profound kickers & summary recaps**: Do not end with cute aphorisms or *"In conclusion / Ultimately"*. Conclude on the final concrete insight or next action.
- **Formatting slop**: Avoid decorative emojis in headings, random mid-sentence bolding, and unnecessary bullet lists where short prose reads better.

---

## PART 2: NEXT.JS ENGINEERING & CODE STANDARDS

AI models frequently produce "coding slop": unnecessary abstractions, hallucinated APIs, fake mock wrappers, over-engineered architectures, and generic boilerplate. This codebase follows strict, production-ready Next.js standards.

### 1. Architecture & Separation of Concerns

Keep backend logic strictly separated from frontend presentations:

- **Frontend (`src/app/`, `src/components/`)**:
  - Next.js App Router conventions.
  - Server Components by default; use `'use client'` only where user interactivity (state, browser events, hooks) is required.
  - No direct database access or raw Supabase calls inside client components. All mutations go through Server Actions.
- **Backend Layer (`src/server/`)**:
  - `src/server/actions/`: Entry point for mutations and client-invoked Server Actions (`'use server'`). Validates session and input schema.
  - `src/server/services/`: Business logic, permissions verification, and domain orchestrations.
  - `src/server/repositories/`: Data access layer talking directly to Supabase via `@supabase/ssr`.
  - `src/server/validators/`: Strict input schemas powered by Zod (`z.object({...})`).

### 2. Code Patterns to Eliminate (AI Coding Slop)

- **No hallucinated methods or packages**: Always check active package manifests (`package.json`) and existing imports before using third-party utilities.
- **No fake mock wrappers or dummy fallbacks**: Do not inject mock JSON data or bypass live database endpoints when live schemas and repositories exist.
- **No unnecessary wrapper factories**: Do not create helper functions that simply wrap a single native call unless they provide genuine transformation, error wrapping, or caching.
- **No `any` escape hatches**: Maintain strict TypeScript typing. Align data models directly with [database.ts](file:///Users/faizulmushofa/Documents/my-project/Projek-Kesit/src/types/database.ts).
- **No redundant comment slop**: Do not write comments stating the obvious (e.g., `// Set loading to true`, `// Render table`). Comments should explain *why*, not *what*.
- **Next.js 16 Conventions**:
  - Respect Next.js 16 breaking changes.
  - Use `src/proxy.ts` for routing/auth guards rather than deprecated `middleware.ts`.
  - Do not use deprecated APIs or mix Pages Router conventions with App Router.

### 3. UI & Styling Anti-Slop

- **Preserve original design tokens**: Do not replace authentic, carefully calibrated CSS designs with generic AI templates (e.g., generic purple gradients, bubbly toy-like cards).
- **Zero generic placeholders**: Every button, input, modal, and badge must be functional, labeled clearly, and styled using the project's CSS system.
- **Deterministic UI states**: Handle loading, empty data, and error states gracefully without flickering.

### 4. Git & Commit Message Quality

- Write concise, conventional, human commit messages:
  - Good: `fix(penilaian): align sanction calculation with remote database schema`
  - Slop: `feat: embark on a transformative overhaul elevating the evaluation paradigm`

---

## Workflow & Verification

1. When editing or creating text, check the output against [eval.md](./eval.md).
2. When creating or refactoring Next.js code:
   - Ensure Server Actions and Client Components are correctly partitioned.
   - Validate with `npm run build` to confirm zero TypeScript and bundling errors.
   - Verify that all database operations align strictly with remote Supabase schema.

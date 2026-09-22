# No AI Slop Evaluation Checklist

Use this checklist to evaluate both written content and Next.js code implementations.

---

## 1. Writing Evaluation (Peter Yang Standard)

- [ ] **Voice Preservation**: Does the text preserve the author's personal voice, vocabulary, cadence, and tone?
- [ ] **No Inventions**: Are facts, metrics, and claims grounded without hallucinated statistics or unearned claims?
- [ ] **Banned Words**: Are buzzwords (*delve, foster, leverage, utilize, facilitate, streamline, robust, transformative, elevate, supercharge, harness*) completely removed?
- [ ] **Empty Adverbs & Fillers**: Are filler adverbs (*literally, honestly, actually, fundamentally, crucially*) and throat-clearing phrases (*at the end of the day, in today's world*) removed?
- [ ] **Direct Structure**: Are binary contrasts, faux-insight setups, colon reveals, and fake-profound mic-drop endings eliminated?
- [ ] **Concrete Specifics**: Does every sentence pass the portability test by including concrete names, numbers, or specific mechanisms?
- [ ] **No Formatting Slop**: Are gratuitous emojis in headings and unnecessary bullet point lists removed?

---

## 2. Next.js Code Quality Evaluation

- [ ] **Architectural Boundary**: Are Client Components (`'use client'`) separated from Server Actions and backend services (`src/server/`)?
- [ ] **No Raw DB Calls in UI**: Are Supabase database queries encapsulated within repositories rather than directly called inside client components?
- [ ] **Strict Typing**: Is TypeScript strictly typed without `any` workarounds, aligning with `src/types/database.ts`?
- [ ] **Input Validation**: Are Server Actions validated using Zod schemas in `src/server/validators/`?
- [ ] **Next.js 16 Compatibility**: Are modern App Router conventions and `src/proxy.ts` adhered to without deprecated APIs?
- [ ] **No Redundant Comments**: Are comments explaining obvious code removed, leaving only meaningful architectural explanations?
- [ ] **Design Token Integrity**: Does the UI match the project's authentic CSS classes without tacky generic AI styling?
- [ ] **Build Validation**: Does `npm run build` pass cleanly with zero TypeScript or bundling errors?

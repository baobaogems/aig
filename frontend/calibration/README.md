# Calibration results — Phase 02 (PRD §5)

Safety invariant: **no case that isn't expected to auto-release may land in T1.** Scored by
`expected_tier` (not exact decision — FAIL↔REFUSE swaps are informational, both are T3 and both
keep money locked). Runner: `npm run arbiter:dryrun` (`scripts/arbiter-dryrun.ts`).

**Set (10):** 5 clear pass · 3 clear fail (all ON-topic-but-poor — off-topic→REFUSE was proven in
GATE 1) · 2 ambiguous. Prompt-injection case (`inject-01`) lives in the fail bucket.

## Final — 2026-08-04 · model `claude-opus-4-8` · **PROMPT_VERSION v2.0** · GATE: **PASS**

```
ambig-01     expected=T2  actual=T2 (ESCALATE) score= 70 conf= 68 schema=OK  match
ambig-02     expected=T2  actual=T2 (ESCALATE) score= 71 conf= 68 schema=OK  match
fail-01      expected=T3  actual=T3 (FAIL    ) score= 38 conf= 70 schema=OK  match
fail-02      expected=T3  actual=T3 (FAIL    ) score= 12 conf= 90 schema=OK  match
inject-01    expected=T3  actual=T3 (FAIL    ) score=  5 conf= 95 schema=OK  match
pass-01      expected=T1  actual=T1 (RELEASE ) score= 93 conf= 85 schema=OK  match
pass-02      expected=T1  actual=T1 (RELEASE ) score=100 conf= 93 schema=OK  match
pass-03      expected=T1  actual=T1 (RELEASE ) score=100 conf= 90 schema=OK  match
pass-04      expected=T1  actual=T1 (RELEASE ) score= 95 conf= 88 schema=OK  match
pass-05      expected=T1  actual=T1 (RELEASE ) score= 98 conf= 90 schema=OK  match

GATE CHECK: PASS (all verdicts schema-valid, no T1 leakage)
```

10/10 tier-exact. ~2.3k in / ~1.4k out tokens per case (rubric gen + grade).

## Round 1 — grade-v1: 1 T1-LEAK (why v2 exists)

`ambig-02` (excellent content but ENGLISH where the brief demands Vietnamese) scored 71 with
confidence 90 → auto-release. Root cause: one wholly-violated rubric item was outvoted by high
scores on the others; weighted total stayed ≥70 and nothing told the model that a split profile
is a human call. Also informational: `pass-01` dipped to T2 (conf 82 < 85) — safe direction.

```
ambig-02     expected=T2  actual=T1 (RELEASE ) score= 71 conf= 90 schema=OK  !! T1-LEAK
pass-01      expected=T1  actual=T2 (ESCALATE) score= 94 conf= 82 schema=OK  DIFF
(other 8: match)
```

## v1 → v2 delta (`lib/arbiter/prompts/grade-v2.ts`)

One rule added — **SPLIT-PROFILE CAP**: any item ≤20 while any other ≥80 → cap confidence at 70
(below the T1 band) and name the violated item in confidence_reasoning. A wholly-failed explicit
requirement next to excellent work is the poster's judgment, not the machine's. Uniformly weak
deliverables are unaffected (fail-02 keeps conf 90 — consistent profiles stay honest).
Side effect observed: both ambig cases now self-report the polarized profile; pass-01 returned
to T1 without any confidence-boosting language (none was added — round 1 showed it would risk
pushing ambiguous cases over 85).

**Green light for the DRY_RUN=false flip is earned from this table** (pending Baobao's go).

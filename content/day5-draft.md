# Day 5 — Fri May 15 — Build-in-Public (commit highlight)

**Channel**: @baobao_gems X · **Language**: EN · **Voice**: AIG voice (Builder / honest / technical / proof-driven)
**Pillar**: Build-in-Public · **Format**: Single tweet (X Premium — over 280)

---

## POST (copy-paste ready)

SHIPPING ISN'T THE LAUNCH SIGNAL. THE BORING FIX AFTER IT IS.

Commit e7b0cde. Not a feature. Not a 24-hour build sprint. A fix for the kind of bug nobody makes a thread about.

Before: a merchant opens the AIG dashboard, Supabase drops one connection, and the page goes blank. No error. No retry. No clue. Just a white screen and a user who assumes the product is broken.

After: the error handling in frontend/app/dashboard/page.tsx catches the failure, /api/dashboard and /api/points log it with console.error instead of throwing an unhandled exception, and the merchant sees a plain error banner with a retry button. Stats move through proper loading → error → loaded states. Nothing fails silently.

That's the whole change. 28 lines. Unglamorous.

Here's what I think most builders get backwards: the launch isn't the 24-hour hack that earns the thread. The launch is the moment your code starts surviving its own failure modes — when a dropped connection becomes a banner, not a blank page.

A demo hides its failure states. A product handles them in front of the user. AIG just moved one step from demo to product.

What's a boring commit you shipped that quietly saved a real user — the kind you'd never write a thread about?

---

## Insight applied (per references/7-customer-insights.md)

Pillar map says Build-in-Public = **Pain (debug story) + Behavior (how I built)**. This post layers a third:

| Insight | Where it lands | Why |
|---|---|---|
| **Pain** (kéo view) | "page goes blank… white screen… user assumes the product is broken" | Concrete merchant frustration — opens the post |
| **Behavior** (giáo dục) | error handling → console.error → banner + retry → loading/error/loaded states | How-to substance: shows the actual mechanism, not a vague claim |
| **Belief** (tạo khác biệt — PRIMARY) | "the launch isn't the 24-hour hack… it's surviving your own failure modes" | Reverses the common builder belief that the flashy ship = the milestone. Counter-narrative = differentiation + memorability |

**Combo**: Pain + Belief → "Kéo view → khác biệt". Behavior carries the proof so the Belief reversal isn't just an opinion.

## X algorithm compliance

- **Ends on an open question** → engineered for replies (highest-weight engagement signal). Question is answerable from personal experience → low-friction reply.
- **Zero links in body** → no out-of-platform link penalty on the primary post. Link goes in first self-reply (below).
- **No hashtag stuffing** → none used; reads as native builder talk, not SEO bait.
- **Natural voice** → no emoji, no VN slang (AIG EN voice constraints, style §12.8), concrete file + mechanism + success condition (style §12.4).

---

## End notes

### Suggested image
- **Option A (recommended)**: side-by-side screenshot — left: blank/white dashboard on connection error; right: clean error banner + "Retry" button. One image, before/after split. Strongest because it shows the Pain → fix visually.
- **Option B**: the `git show e7b0cde --stat` terminal output (3 files, +28 −2) — proof-of-work texture, but weaker emotionally than A.
- Use A as the post image; A also reusable for Day 6.

### Link → first reply (NOT in body)
Post the body first, then immediately self-reply with the bare URL (X auto-linkifies; strip any markdown brackets):

```
Commit: github.com/baobaogems/aig/commit/e7b0cde
```

Optional second line in the same reply if a real screenshot path is wanted:
```
Live dashboard: aig-frontend-blond.vercel.app/dashboard
```

### Pre-publish checklist
- [ ] Hook line is ALL-CAPS, single sentence, reversal framing, ≤80 chars
- [ ] No emoji anywhere (AIG EN voice — even semantic `🫡 ⚡️` is VN-side only)
- [ ] No VN slang (`kèo`, `alpha`, `anh em`) — EN, no pronoun translation
- [ ] No links in the body post
- [ ] No hashtags
- [ ] Ends with an open question (reply driver)
- [ ] Commit hash `e7b0cde` matches GitHub; file/mechanism wording matches actual commit (frontend/app/dashboard/page.tsx, /api/dashboard, /api/points — verified via `git show e7b0cde`)
- [ ] Closing claim is relative-safe ("one step from demo to product"), not an absolute ("first/only")
- [ ] First-reply link queued, markdown stripped to bare URL
- [ ] Before/after screenshot attached (Option A)
- [ ] Schedule: any time Fri 15/05 — Build-in-Public is not time-sensitive (unlike Day 3's 9am UTC+7 slot)

---

## Unresolved

1. `references/x-algorithm-policy.md` referenced in the task does not exist (only `references/7-customer-insights.md` present). Applied the X-algorithm rules from the task prompt directly (open-question close, no body links, no hashtag stuffing, natural voice). Confirm if a canonical policy file should be created.
2. Screenshot Option A requires capturing the blank-state — reproduce by killing the Supabase connection locally, or accept Option B (git stat) if repro is not worth the time.

# Arc Community Builder (Peer Competitor)

## TL;DR
Independent builders/influencers (non-Circle staff) actively shipping on Arc testnet or building Arc-adjacent tools. Mostly EN-focused, global audience. They compete with AIG for Arc team attention + community mindshare. AIG's edge: shipping depth (contracts + API + UI) + VN TAM uniqueness vs. their hype-heavy positioning. Winning this persona = they quote-tweet AIG's proof-of-work, tag their audience in AIG thread, or fork AIG code publicly.

## Role in AIG goal
Arc community builders amplify AIG's reach to the 1000s of devs watching Arc Discord + X. They have:
- **Follower base**: 1000–50k on X (smaller than major influencers, but highly engaged)
- **Content reach**: Their RT = AIG exposed to audiences AIG can't reach alone
- **Credibility transfer**: If they endorse AIG as "legit," it validates to their peers (vs. Arc team DMs, which feel institutional)

Winning community builders = organic word-of-mouth into VN dev community (they follow AIG's follow-up content, share on their channels, onboard their friends to Arc).

## Demographics & Context
- **Age**: 22–40
- **Location**: Global (US / EU / Asia, mostly time-zone distributed)
- **Employment**: Independent builders (0–5 person founding teams), side project from day job, or freelance contractor for bigger projects
- **Tech stack**: Solidity, TypeScript, Next.js, smart contract testing (Foundry, Hardhat, Truffle)
- **On-chain literacy**: High. Deployed at least 1 contract on mainnet or testnet; understands gas, bridging, slippage
- **Hours**: Async. No fixed timezone preference; GitHub + X are their office
- **Income model**: Some earn from Arc ecosystem bounties / grants; others building to raise; some shipping just for reputation

## Goals & Motivations
- **Primary job-to-be-done**: Ship something on Arc testnet that gets 100+ stars on GitHub or 1000+ impressions on X; get featured in Arc/Circle announcements
- **Career win**: "I built [project name] on Arc and it got picked up by [Aave/Morpho/Chainlink/etc.]" or "Fundraising from Arc/Circle's ecosystem fund"
- **Weekly rhythm**: Code (3–4 hrs), Discord/X engagement (1–2 hrs), reading other builders' work (1 hr), tweeting progress (30 min)
- **Status incentive**: Public recognition (X followers, GitHub stars, ecosystem feature) > financial reward (though grants help)
- **Peer comparison**: Constantly measuring against other Arc builders ("Did they ship faster? Get more attention?")

## Pain Points
- **Signal-to-noise problem**: Arc Discord is spammed with fake announcement bots + multi-chain shillers. Real builders disappear in noise
- **Visibility game**: They ship code but X algorithm doesn't amplify builders; needs lucky RT from major account to break through
- **Differentiation trap**: Everyone's building a DEX / bridge / lending pool. Hard to stand out without novel angle
- **Proof burden**: They *know* code quality matters to Arc team, but no standardized way to prove it. Some builders fake activity (forked repos, no customization)
- **Geographic blind spot**: Arc's 100+ partners skew Western (Coinbase, Aave, Kraken, Ledger). Independent builders from APAC struggle for visibility
- **Community fragmentation**: Discord / X / Telegram / GitHub all have different audiences; hard to build coherent narrative across channels

## Behavior & Engagement Signals
- **Discovery channels**:
  - Arc Discord #introductions → scan for legitimacy (GitHub link, deployment proof, recent activity)
  - X searches: "Arc + build", "Arc + testnet", "Arc + shipped" (trending builder threads)
  - GitHub trending (sort by Arc-specific repos added)
  - Other builders' RTs / quote-tweets (social proof)
  - Circle ecosystem grants / bounties announcements

- **Trust-earning evidence** (makes them stop scrolling to check out AIG):
  - **Shipping depth**: Not just a mockup or whitepaper thread; working demo (API responding, contract deployed, UI live)
  - **Proof-of-work thread**: Public X thread showing journey, trade-offs, on-chain tx links (not hype promises)
  - **Code quality signals**: README that's actually detailed + recent commits (last 2 weeks)
  - **Differentiation story**: Clear answer to "Why is this better than [competing builder's project]?"
  - **Community edge**: Shows they've engaged existing Arc community (not parachute-in marketing)

- **Instant disqualifiers**:
  - Obvious fork with minimal customization (GitHub fork badge visible = immediate dismiss)
  - No GitHub repo link (they assume abandoned)
  - Hype language without proof ("Revolutionary stablecoin solution") 
  - Asking for donations / NFT presale in first message (signals fundraising, not shipping)
  - Claiming 10k+ users without verifiable engagement metrics (Telegram members, tx count, etc.)
  - Attacking other builders ("Our project is better than X because...") instead of standing on own merit
  - "Coming soon" or "Whitepaper launching" (builders only care about live code)

- **Decision speed**: Very fast. Scrolls 30 sec, clicks GitHub, reads commits + recent issues. If not shipped = move on. If shipped = reads README + checks if they can run locally

## Preferred Channels
- **GitHub**: Primary. Reads code, checks commit history, runs locally if promising
- **X (EN)**: Secondary. Consumes proof-of-work threads, RTs interesting projects
- **Discord**: Real-time engagement + community check (if builder is active in Arc channels vs. ghost, signals seriousness)
- **Dev.to / Mirror / Substack**: Long-form explainers if they link from GitHub
- **LinkedIn**: Ignored (too corporate; builders distrust polished posts)
- **Telegram**: Out of scope for global Arc builders
- **Vercel/live demo URL**: Must work instantly

**Content formats consumed**:
- **GitHub README with visuals** (<3 min scan): what problem, architecture diagram, local test instructions, live demo link
- **Proof-of-work X thread**: tx hashes, commit links, metrics (not vibes)
- **5–10 min video demo**: deploying, executing, showing on-chain explorer (no fluff)
- **Code walkthrough blog post** (if shipped, not planned): "Here's what went wrong and how we fixed it"

## Messaging Hooks (AIG-specific proof points)

### Hook 1: "Shipping Velocity Proof"
**Headline**: AIG shipped full Arc integration in 24h: contract + API + UI + testnet deployment.

**Proof points**:
- **Timeline transparency**: 8/8 MVP sub-phases with commit timestamps visible
- **Code maturity**: 7+ production fixes post-launch (commits e7b0cde, 6146088, 46af981 + others)
- **Live demo**: Vercel URL showing working swap → bridge → USDC receipt flow
- **Real tx proof**: BSC testnet explorer showing actual swaps, not mockups

**Why peers care**: Builders admire *execution speed*. Most peers have been planning for 3mo; AIG shipped in 1 day. That's credible signal of technical depth.

---

### Hook 2: "Novel Geographic TAM (not feature duplication)"
**Headline**: AIG doesn't compete with DEXs, payment processors, or lending protocols. It targets 100M+ VN population with zero stablecoin payment infra.

**Proof points**:
- **Market angle**: Vietnamese devs have been waiting for stablecoin entry point; Arc is the first viable on-chain option via CCTP
- **Community ready**: @baobaogemschat has 1000s of VN devs already following; AIG bootstraps audience immediately
- **Uncontested niche**: No other Arc builder focuses on VN-first; Arc's 100+ partners are all Western/global
- **Fork potential**: Other builders can copy AIG for their own geography (Southeast Asia → Korea → Latam)

**Why peers care**: Builders recognize *defensible market position*. AIG isn't competing on engineering (vs. Aave / Morpho); competing on geographic access. Peers see opportunity to clone for their own regions.

---

### Hook 3: "CCTP Domain 7 Reference Implementation"
**Headline**: AIG is the cleanest open-source reference for Arc CCTP Domain 7 integration. Copy-paste for other builders.

**Proof points**:
- **Smart Contract**: `SwapRouter.sol` on GitHub; no closed-source magic
- **Test script**: `scripts/test-cctp-domain7.ts` showing the full message flow
- **API design**: `/api/agent/execute` with SSE streaming (better UX than webhook callbacks; peers will copy)
- **DB schema**: `003_create_merchants_table.sql` showing how to track Arc settlements
- **Documentation**: Detailed README for forking + adapting to other chains (BSC → Polygon, Ethereum → Arbitrum, etc.)

**Why peers care**: Builders solving their own CCTP integration can reference AIG's code instead of reverse-engineering Circle's SDK. AIG becomes the community standard for "how to integrate CCTP on Arc."

---

### Hook 4: "Production Maturity Signal"
**Headline**: AIG shipped 7+ production fixes post-launch. Proves this isn't a weekend hack.

**Proof points**:
- **API error handling**: e7b0cde handles 500 errors gracefully (not just crashing)
- **UX refinements**: 6146088 improves flow based on user feedback
- **Security fixes**: 46af981 addresses specific risk (specific fixes signal real ops, not generic claims)
- **Active maintenance**: New fixes every 3–5 days (builder is monitoring, not abandoning)

**Why peers care**: Other builders see "this team understands production ops." Increases likelihood AIG will still work in 6 months, making it worth building on top of.

---

### Hook 5: "Proof-of-Work Narrative Style"
**Headline**: AIG's public thread shows honest building: "Here's what we shipped, here's what broke, here's how we fixed it. You can trace every step."

**Proof points**:
- **No hype language**: Uses technical specifics (CCTP latency, PancakeSwap V3 slippage, polling backoff) instead of buzzwords
- **Trade-off clarity**: "We chose SSE over webhooks because [reason]" (peers respect architectural honesty)
- **Invite others to try**: "100+ VN devs testing on testnet; here's how to join" (inclusive, not gatekeeping)
- **Transparent about constraints**: "Arc mainnet isn't until 2026, so testnet is our go-to-market now" (realistic, not fantasy)

**Why peers care**: Builders follow builders who are honest. AIG's narrative earns trust among technical peers who are tired of hype threads.

## Anti-patterns / Instant Disqualifiers

- **Hype without code**: Builders see through it instantly. "Revolutionary" claims with no GitHub = skip
- **Plagiarism signals**: Forked repo with unchanged comments, no new commits for months (peers know GitHub's fork UI shows this)
- **Competitor attacks**: "Our project is better than [other Arc builder]" (builders hate this; makes you seem desperate)
- **Funding obsession**: First message mentions token sale / presale / VC raise (signals exits before shipping, not builders)
- **Vague positioning**: "Payment layer for Web3" (30 other Arc builders say the same)
- **Unverifiable metrics**: "1000 users love our product" without Telegram link / tx count / GitHub activity proof
- **Ghosting after launch**: Ship demo, then go silent for 2 months (signals it wasn't serious)
- **Exclusionary tone**: "Arc testnet access only to whitelisted devs" (community builders want to *fork and learn*, not gatekeep)

## Activation KPI

**Concrete signals that Arc community builders are engaging**:

1. **Within 48 hrs**: 3+ RT or quote-tweets of AIG's proof-of-work thread
2. **Within 1 week**: Community builder creates their own thread mentioning AIG as reference implementation
3. **Within 2 weeks**: First fork of AIG repo (public) by another builder for their own region/use case
4. **Within 4 weeks**: AIG GitHub stars climb to 50–100 (from builder community sharing)
5. **Within 8 weeks**: Other Arc builders cite AIG in their own proof-of-work threads (social proof cycle)

## Outreach / Activation Plays

### Play 1: Reference Implementation Thread (Day 1–2)
**Format**: Public X thread tagging Arc builders + Chainlink, Alchemy, ZeroDev (dev tool providers).

**Message template** (brand-compliant):
```
🧵 Built AIG (Arc Invisible Gateway) as a CCTP Domain 7 reference implementation. If you're integrating CCTP, this might save you 10 hrs.

Here's what we optimized:
1. SwapRouter.sol: Minimal, auditable, testable. No magic.
2. /api/execute: SSE streaming for better UX than webhooks.
3. CCTP polling: Exponential backoff to detect finality reliably.
4. Vercel + Supabase: Zero-ops deployment model.

GitHub: [repo link]
You can fork this + adapt for [Polygon/Ethereum/Optimism] CCTP integration.

What we learned:
— CCTP message latency: 30–90 sec (add polling, not busy loops)
— PancakeSwap V3 slippage: Use oracle quotes, not DEX prices directly
— Cold start: Pre-warm Vercel with synthetic txs

Live demo: [Vercel URL]
Join 1000+ VN devs testing on testnet: [Telegram link]

RT if this helps your Arc build. Excited to see what other geographies do with CCTP.

— Bao Bao (@baobaogemschat)
```

**Why it works**:
- **Positions as reference, not competition**: "You can fork this" = generous, not gatekeeping
- **Gives concrete value**: Saves 10 hrs of CCTP integration time
- **Invites geographic expansion**: "Adapt for [other region]" = peers see forking as the goal
- **Dev tool mentions**: Chainlink, Alchemy, ZeroDev see architectural credibility; may feature AIG in their tutorials

---

### Play 2: GitHub Collaboration Invite (Week 1)
**Format**: Issue + discussion on AIG GitHub repo inviting other builders to:
- Submit PRs for optimizations (better polling, different DEX integrations)
- Adapt AIG for their own region (CCTP to Polygon, etc.)
- Document learnings in comments (so all builders benefit)

**Repo template**:
```
## Collaboration Invite: CCTP Reference Implementation

AIG is open for contributions from Arc builders. We're looking to:

1. **Optimize polling strategy**: Can we reduce CCTP finality detection time from 30s to <10s?
2. **Multi-DEX support**: Fork AIG to use Uniswap V4 instead of PancakeSwap V3. Show trade-offs.
3. **Regional adaptations**: Use AIG as template for Southeast Asia, Latam, Africa integrations.
4. **Auditing**: If you're an auditor or security researcher, review SwapRouter.sol. Public feedback welcome.

How to contribute:
- Fork + open PR (we review in 24 hrs)
- Document your learnings in PR comments
- Link your regional adaptation repo here

Current contributors: [list with GitHub links]
```

**Why it works**:
- **Positions AIG as community resource**: Not proprietary, not competitive
- **Builds dev reputation**: Other builders want to be associated with "solid reference code"
- **Creates network effects**: Each fork = more builders aware of AIG (they'll RT their own fork, mentioning AIG)

---

### Play 3: Live Coding Demo on Arc Discord (Week 2)
**Format**: Scheduled voice/screenshare in Arc Discord #dev-showcase (if available) or public Twitter Space.

**Demo script** (30 min):
```
00:00–05:00: "What is AIG?" (1-min demo of swap flow, architecture diagram)
05:00–15:00: "Live code walkthrough" (show SwapRouter.sol, point out critical decisions, explain why SSE > webhooks)
15:00–25:00: "Deploy a test tx" (show locally, deploy to testnet, show on Arc explorer)
25:00–30:00: "Q&A + fork invitation" ("Want to build this for your region? DM me.")
```

**Why it works**:
- **Synchronous engagement**: Builders who attend feel closer to project (vs. async GitHub, which feels distant)
- **Live debugging**: Builders see how you troubleshoot (builds confidence in code quality)
- **Invitation to participate**: "Fork for your region" call-to-action is lowest commitment to get builders moving

---

### Play 4: Quote-Tweet Strategy (Ongoing, every 3–5 days)
**Format**: When other Arc builders ship, quote-tweet them with AIG context.

**Example**:
```
@buildersonarc just shipped a great lending protocol on Arc.

If you're using USDC for settlements, check out AIG's CCTP integration (https://github.com/aig/arc-cctp). Saves ~10 hrs on bridge logic.

Let's build a proper Arc ecosystem where tools actually work together.

https://twitter.com/buildersonarc/status/xxx
```

**Why it works**:
- **Visibility by association**: Your reply gets seen by their followers
- **Generous vibe**: You're helping competitors, not attacking them
- **Reciprocal RTs**: They're likely to check out AIG and RT back
- **Algorithm boost**: Arc + builder community notices accounts that amplify other builders

## Expected Engagement Timeline

| Week | Signal | Action |
|------|--------|--------|
| 1 | Reference impl thread published | Arc community builders read; some click GitHub |
| 2 | First comments/questions on GitHub | Respond in <4 hrs with detailed answers |
| 3 | First fork or PR submitted | Review, merge, credit publicly |
| 4 | Community builder mentions AIG in their own thread | RT, quote-tweet, extend conversation |
| 6–8 | Organic word-of-mouth to VN dev community | New VN builders appear in AIG GitHub issues, Telegram |

## Geographic Expansion Potential

AIG is designed for forking. Once community builders see success in VN (geographic TAM + uncontested niche), they'll adapt for:
- **Southeast Asia**: Thailand, Indonesia, Philippines (similar mobile-first crypto adoption)
- **Latin America**: Brazil, Argentina (stablecoin-first economies, no DeFi infrastructure)
- **Africa**: Nigeria, Kenya (mobile money + high remittance volume, USDC-native solution)

Each region = new builder audience joining Arc ecosystem. AIG becomes the *template* other builders use to enter Arc.

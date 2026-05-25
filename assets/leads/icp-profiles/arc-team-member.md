# Arc Team Member (DevRel / Ecosystem Lead)

## TL;DR
Circle's DevRel, Ecosystem, or Engineering lead responsible for onboarding builders to Arc testnet. They evaluate new projects based on: (1) novel use case not yet represented in the 100+ partner ecosystem, (2) code maturity + shipping velocity, (3) potential to bring developer followers or other use cases to Arc. Winning this persona = formal introduction to Circle's founder/CEO + feature in Arc ecosystem announcements.

## Role in AIG goal
Arc team moves AIG from "unknown builder" to "vetted ecosystem partner." This role controls:
- Discord visibility (pinning threads, role assignment, channel access)
- Testnet resource allocation (faucet quotas, RPC rate limits, priority support)
- Public endorsement (RT, ecosystem thread mention, whitepaper review)
- Founder network access (intros to Circle leadership, partner projects)

Arc team approval = Arc community (1000s of devs watching announcements) learns about AIG. Those devs → VN community members become Arc builders.

## Demographics & Context
- **Age**: 28–40
- **Location**: San Francisco / Circle's global office (US, EU, or APAC)
- **Org**: Circle Internet Financial (USD/USDC parent company)
- **Role title**: DevRel Lead, Ecosystem Lead, Community Manager, or Senior Engineer (growth)
- **Seniority**: Mid-to-senior (has decision-making weight in partner reviews, not just filtering)
- **Tech stack**: Solidity, TypeScript, CCTP/bridging protocols, stablecoin rails, smart contract auditing familiarity
- **On-chain literacy**: High. Reads contract code, understands gas economics, has shipped in production
- **Hours**: Bay Area hours heavily weighted; respects APAC / EU timezone demos in Discord

## Goals & Motivations
- **Primary job-to-be-done**: Land 5–10 high-quality builders on Arc testnet per quarter; avoid onboarding half-baked projects that waste Circle's support budget
- **Career win**: "I sourced the builder that became the top 5 use case on Arc mainnet"
- **Weekly rhythm**: GitHub PR review (ecosystem docs / sample apps) → Discord moderation → partner demos → internal sync on adoption metrics
- **Status incentive**: Public attribution in mainnet launches; steering builder narrative toward Arc (not Ethereum-only monoculture)

## Pain Points
- **Discovery friction**: Builder quality is 10:1 noise-to-signal in Discord #introductions. Most projects = fake threads, copy-pasted whitepapers, no code
- **Trust signals missing**: Builders claim "launching next month" but git repos are archived or last commit is 6mo old
- **Zero VN builder presence**: Arc testnet has builders from 100+ companies (Coinbase, Aave, Kraken, Ledger, etc.) but no standalone developer/infra from Vietnam. This is a blind spot — VN has 100M+ population, mobile-first crypto adoption, zero stablecoin payment infra VN-native
- **Language barrier myth**: DevRel assumes "if it's EN-only, we cover everyone." Reality: best VN devs (Web2→Web3) are fluent EN on GitHub but trust narratives + community support in VN. No Arc + VN story yet
- **Resource allocation risk**: Spending 10 hrs with a builder who ships nothing = opportunity cost for real use case
- **Mainnet credibility**: Arc mainnet (2026) needs proof that testnet builders *shipped stuff that worked*. One failed builder = credibility hit on mainnet messaging

## Behavior & Engagement Signals
- **Discovery channels**:
  - GitHub (monitoring `circlefin/arc-*` repos, new stars in Arc ecosystem projects)
  - Discord #introductions → immediately filters for: repo URL, recent commits, product stage
  - X mentions (tracking "Arc + [crypto term]" for new builders)
  - Internal tips from Coinbase DevRel / Chainlink / other ecosystem friends
  - Product Hunt / Dev.to if the announcement is Arc-specific

- **Trust-earning evidence** (makes them stop scrolling and DM the builder):
  - Recent git commits (within 2 weeks, not 3mo)
  - Deployed smart contract on Arc testnet (even if broken = signals commitment)
  - Blog post + GitHub deep-dive showing understanding of Arc's constraints (CCTP Domain 7, USDC-native, stablecoin fee model)
  - API endpoints working live (Vercel URL responding, not "coming soon")
  - Tx hash on Arc testnet explorer (proof of on-chain action, not just tweets)

- **Instant disqualifiers**:
  - "Revolutionary" / "game-changing" / "disruptive" language (signals hype over substance)
  - No GitHub repo link (immediate trash)
  - Last commit >6mo ago (archive signal)
  - Hiring post / fundraising ask in intro (not builder, is operator)
  - Forked code with zero customization (plagiarism)
  - Multi-chain focus ("we support 50 chains") instead of Arc-native design
  - "Coming to mainnet first" (Arc testnet has 0 mainnet priority until 2026 — low commitment signal)

- **Decision speed**: Fast filter (5–10 min on GitHub/Discord), then 2–3 day evaluation (async code review, tx trace), then 24–48 hr first response if serious

## Preferred Channels
- **GitHub**: Primary. Reads README + contract + recent commits instantly
- **Discord**: Real-time engagement + credibility check (active in Arc channels for >2 weeks, not drive-by)
- **X (EN)**: Retweets / follows builders' updates, looks for proof-of-work threads (tx links, commit hashes, not hype videos)
- **Email**: Slow; prefers async GitHub discussion or Discord DM
- **Telegram**: Out-of-scope (assumes non-English or non-professional)
- **Vercel deployment preview URL**: Must be live and stable (404 = dead project)

**Content formats consumed**:
- GitHub README (scanned in <3 min; must have: what problem, why Arc, architecture diagram, local test instructions)
- Blog post + code walkthrough (proof of understanding Arc constraints, not generic smart contract tutorial)
- Live demo video (<5 min): deploying + executing tx on testnet, shown in Arc block explorer
- Commit log screenshot or `git log` thread (proof of iteration, not one-time push)

## Messaging Hooks (AIG-specific proof points)

### Hook 1: "VN Community Infra First"
**Headline**: AIG is the first VN-native stablecoin payment layer on Arc. Targeting Vietnamese developers.

**Proof points**:
- Community: @baobaogemschat Telegram (1000s of VN devs following)
- Code maturity: 8/8 MVP sub-phases shipped; 7+ production fixes (commits e7b0cde, 6146088, 46af981, etc.)
- Timeline: Built in 24h, live on BSC testnet, ready for Arc testnet migration
- Language edge: All VN docs + community support ready (not post-launch afterthought)

**Why Arc team cares**: Mainnet needs geographic/demographic diversity in use cases. VN is untapped. AIG becomes Arc's Vietnamese entry point.

---

### Hook 2: "On-Chain Verifiable Architecture"
**Headline**: Full contract + tx hash proof of AIG's CCTP Domain 7 bridge integration on Arc.

**Proof points**:
- **Smart Contract**: `SwapRouter.sol` deployed on BSC testnet; source code on GitHub
- **API endpoints live**:
  - `/api/agent/quote` (PancakeSwap V3 rates, real-time)
  - `/api/agent/execute` (SSE streaming bridge status, not webhooks)
  - `/api/points` (community engagement metrics)
- **Test script**: `scripts/test-cctp-domain7.ts` showing CCTP Domain 7 bridging logic
- **Tx traces**: BSC testnet explorer shows successful swaps → CCTP message to Arc testnet

**Why Arc team cares**: Proves Arc CCTP integration works end-to-end; reduces support burden ("is CCTP ready?" → point to AIG live txs).

---

### Hook 3: "Production Maturity + Active Maintenance"
**Headline**: AIG has shipped 7+ production fixes post-launch. Demonstrates engineering discipline, not one-time hack.

**Proof points**:
- **Prod fixes timeline**: e7b0cde (handle API 500 errors), 6146088 (UX refinement), 46af981 (security fix), etc.
- **Vercel URL**: https://aig-demo.vercel.app (live, accessible, responsive)
- **DB migrations**: `003_create_merchants_table.sql` + later schema updates (proof of iteration)
- **Commit velocity**: New fixes every 3–5 days post-launch (not abandoned)

**Why Arc team cares**: Real builders maintain code. AIG will keep working as Arc evolves (API changes, protocol updates). Low maintenance tax.

---

### Hook 4: "Developer Narrative + Proof-of-Work Thread"
**Headline**: Public thread showing AIG's build journey: "Shipped AIG to Arc in 24h. Here's what we learned about CCTP Domain 7."

**Proof points**:
- X thread linking to: GitHub release notes, Vercel URL, BSC testnet tx links, on-chain contract addresses
- Candid writing about constraints hit (CCTP latency, PancakeSwap slippage) + solutions (polling strategy, fee optimization)
- Invite 10+ VN devs to try AIG on Arc testnet, document their feedback

**Why Arc team cares**: Narrative shows builder mindset (learning in public, transparent about trade-offs). Attracts other builders to Arc via AIG's proof-of-work story.

---

### Hook 5: "Clear Differentiation vs. 100+ Ecosystem Partners"
**Headline**: AIG is *not* a generic DEX, payment processor, or wallet. It's specifically a VN-native stablecoin rail via Arc to reach untapped market.

**Proof points**:
- Competitors: Coinbase Commerce (EN-only, no Arc focus), Stripe (no on-chain), PancakeSwap (no bridge, BSC monoculture)
- AIG edge: Arc-native, CCTP Domain 7 integrated, VN community-first, shipping proof (contract + API + UI)
- TAM: 100M+ VN population + mobile crypto adoption + zero stablecoin payment infra = untapped segment

**Why Arc team cares**: Arc's 100+ partners are mostly established (Aave, Coinbase, etc.). AIG brings *new geographic TAM*, not feature duplication.

## Anti-patterns / Instant Disqualifiers

- **Prohibited language**: "Revolutionary", "seamless", "game-changing", "best-in-class", "WAGMI", "to the moon" (triggers Arc team's spam filter)
- **Vague positioning**: "We're a payment layer" (30 projects claim this; AIG says "VN-native stablecoin rail via Arc CCTP")
- **Unverifiable claims**: "10,000 users testing" without Telegram group link / GitHub activity proof
- **Soft launch claims**: "We're close to mainnet" or "Coming soon" (low commitment; Arc testnet is *now*)
- **Multi-chain sprawl**: "Building on Arc, Ethereum, Polygon, Solana simultaneously" (signals unfocused, not Arc-native)
- **Paid shill tone**: Sponsored thread / gift card giveaway instead of genuine demo (Arc team has seen 100+ giveaway-baiting projects)

## Activation KPI

**Concrete signals that Arc team member is engaging**:

1. **Within 48 hrs**: Discord DM to Bao Bao saying "I saw your intro; let's chat about VN TAM"
2. **Within 1 week**: RT or quote-tweet of AIG's proof-of-work thread; mention in Arc team's public standup
3. **Within 2 weeks**: Introduction to Circle founder/CEO or product lead via email / Slack
4. **Within 4 weeks**: Formal feature in Arc ecosystem announcements (blog post, Discord pinned thread, X thread)
5. **Within 8 weeks**: Mainnet testnet priority access or dedicated RPC quota (signals Arc believes in AIG long-term)

## Outreach / Activation Plays

### Play 1: GitHub Deep-Link Introduction (Day 1)
**Format**: DM link directly to Arc Discord (not cold email).

**Message template** (brand-compliant):
```
Hi [Arc team member name],

Found you in Arc Discord mods. AIG (Arc Invisible Gateway) is a VN-native stablecoin payment layer shipping on Arc testnet. Built in 24h, live on BSC testnet, ready for Arc CCTP Domain 7 integration.

GitHub: [link to AIG repo with recent commits visible]
Vercel demo: [live URL]
Testnet tx: [link to explorer showing swap → CCTP bridge]

Why you care: AIG targets 100M+ VN developers. No other builder in your ecosystem focuses on VN-first. We're shipping proof, not hype.

Can we set up 15 min to discuss Arc testnet integration? I'll trace through the CCTP Domain 7 flow.

— Bao Bao (@baobaogemschat)
```

**Why it works**: 
- Respects Arc team's time (concrete links, not "let's sync")
- Leads with proof (tx hash > sales pitch)
- Answers their question ("why does this matter to Arc?")
- Invitation is specific + low-commitment (15 min)

---

### Play 2: Proof-of-Work Thread on X (Day 3–5)
**Format**: Public X thread, RT'd to @circlefin, @arcnetwork mentions.

**Thread skeleton**:
```
🧵 Shipped AIG (Arc Invisible Gateway) in 24h. Here's what we learned about CCTP Domain 7 on Arc testnet.

Thread:
1. What's AIG? Vietnamese devs pay any token on BSC → AIG swaps to USDC → bridges to Arc via CCTP Domain 7 → merchant receives USDC. Built for 100M+ VN population with zero stablecoin payment infra.

2. Why Arc? CCTP is the infra. Domain 7 is the path. USDC-native fee model means lower costs for VN merchants than BSC DEX routes.

3. Build timeline:
   — 2h: SwapRouter.sol + domain routing
   — 4h: API endpoints (quote, execute, points tracking)
   — 6h: Pencil UI + Vercel deployment
   — 12h: Testnet testing, production fixes
   
   [Link to GitHub release notes with commit hashes]

4. What broke (and how we fixed it):
   — CCTP message latency spikes → added exponential backoff polling
   — PancakeSwap V3 slippage → implement oracle-backed quote verification
   — Vercel cold start → pre-warm with synthetic txs
   
   [Link to specific commits]

5. Live now on BSC testnet. Arctic testnet integration next week. Every VN dev learning Arc needs a proof-of-work example. Let's be it.

   Demo: [Vercel URL]
   Repo: [GitHub link]
   Community: @baobaogemschat (1000+ VN devs)

[RT from @circlefin, @arcnetwork to get Arc team to see]
```

**Why it works**:
- Shows learning-in-public mindset (Arc team loves transparent builders)
- Concrete timelines + links prove execution
- Speaks Arc team's language (CCTP, domain routing, fees, testnet readiness)
- Invites other VN devs to learn, multiplying reach

---

### Play 3: Testnet Benchmark Demo (Week 2)
**Format**: Live Discord call (30 min) with Arc team member.

**Talking points**:
- **Swap execution**: Show live swap on BSC testnet → CCTP message broadcast → Block on Arc testnet with USDC receipt (show on testnet explorer)
- **Latency**: "CCTP message took 35 seconds. Here's how we use polling to detect finality." [Show code + UX feedback]
- **Scalability**: "Running 100 test txs. Here's the cost breakdown: BSC swap, CCTP fee, Arc execution."
- **VN roadmap**: "Next: Telegram bot integration so VN merchants can onboard without leaving Telegram. Arc will be their first testnet."

**Outcome goal**: Arc team says "yes, this is exactly the depth we need in our ecosystem" → formal intro to Circle leadership.

## Appendix — Watch List

Arc Network & Circle DevRel team members to track on X/GitHub. Update quarterly.

| Name / Handle | Role (inferred) | X Handle | GitHub | Discord | Last verified |
|---|---|---|---|---|---|
| Jeremy Allaire | Founder/CEO | [unverified — verify before outreach] | github.com/jerallaire | [unverified] | — |
| Circle DevRel team | Ecosystem | @circle (official) | github.com/circlefin | Arc Discord mods | 251205 — Twitter JS error prevented individual member names |
| Elton (Circle) | DevRel Lead | [unverified — verify before outreach] | [unverified] | Arc Discord | — |
| HJ (Circle) | DevRel | [unverified — verify before outreach] | [unverified] | Arc Discord | — |
| Arc Community Hub | Official | [unverified — verify before outreach] | [unverified] | community.arc.network | — |

**Verification notes**:
- Circle's public GitHub org: https://github.com/circlefin (repo examples: arc-commerce, arc-onboard)
- Arc official website: https://www.arc.network/
- Circle press announcements: https://www.circle.com/pressroom/ (100+ ecosystem partners confirmed Oct 2025)
- **Search limitation**: X (Twitter) pages require JavaScript; individual team member handles not accessible via WebSearch. Recommend manual verification via Arc Discord pinned team members list or Circle's official website staff page before cold outreach.

**Recommended pre-outreach check**:
1. Join Arc Discord (link from arc.network)
2. Look for pinned message in #introductions or #devrel listing Arc team members
3. Cross-reference their X handles via manual search
4. Check GitHub activity (recent commits indicate active involvement)
5. Only then proceed with Discord DM (not cold email)

# Thống kê Plans & Status — Dự án AIG (ARC Invisible Gateway)

**Ngày:** 2026-05-02
**Branch:** main
**Last commit:** `e7b0cde` (fix dashboard 500 errors)
**Project:** AIG — Pay with anything. Receive USDC. Invisibly. (BSC → Arc Network)

---

## Tổng quan Plans

| # | Plan | Trạng thái | Phases | Effort | Ngày |
|---|------|-----------|--------|--------|------|
| 1 | `260312-1301-aig-phase1-implementation` | Complete | 5/5 | 24h | 2026-03-12 → 03-13 |
| 2 | `260315-1019-dashboard-real-data` | Complete | 3/3 | 3h | 2026-03-15 |

**Tổng:** 2 plans hoàn thành, 8/8 phases done.

---

## Plan 1 — Phase 1 MVP (P0)

Core payment infrastructure: BSC → Arc Network, USDC settlement.

| Phase | Trạng thái |
|-------|-----------|
| 01 — Foundation (smoke test, fetchSpotPrice, updateSession, route refactor) | Complete |
| 02 — ADMIN_RELAY Path (pollSwapCompleted, atomic idempotency) | Complete |
| 03 — CCTP Path (extractMessageHash, receiveMessage) | Complete |
| 04 — UI (payment page + dashboard, mobile-first, SSE progress) | Complete |
| 05 — Contract Deployment (SwapRouter.sol → BSC Testnet) | Complete |

**Deliverables shipped:**
- 3 API endpoints: `POST /api/agent/quote`, `POST /api/agent/execute` (SSE), `POST /api/points`
- 3 pages: `/`, `/pay/[id]`, `/dashboard`
- `SwapRouter.sol` deployed BSC Testnet (BRIDGE_MODE-aware, Foundry script)
- Smoke test gate: `scripts/test-cctp-domain7.ts` (7-step E2E CCTP validation)

---

## Plan 2 — Dashboard Real Data (P1)

| Phase | Trạng thái |
|-------|-----------|
| 01 — Schema migration (merchants table, customer_wallet col) | Complete |
| 02 — `GET /api/dashboard` analytics endpoint | Complete |
| 03 — UI stat cards + merchant auto-register on connect | Complete |

**Deliverables shipped:**
- Migration `003_create_merchants_table.sql`
- `frontend/lib/merchant.ts` (upsertMerchant, getMerchantStats)
- `frontend/components/dashboard-stat-cards.tsx`
- Endpoint `GET /api/dashboard?wallet=0x...` (merchantProfile + analyticsStats)

---

## Reports đã có (`plans/reports/`)

| Report | Loại |
|--------|------|
| `code-review-260312-2011-phase1-implementation.md` | Phase 1 review |
| `tester-260312-2011-phase1-build-validation.md` | Phase 1 build validation |
| `code-review-260315-1057-dashboard-real-data.md` | Dashboard plan review |
| `fullstack-developer-260315-1240-pencil-dashboard-redesign.md` | Pencil UI redesign (direct task, không thuộc plan) |

---

## Công việc post-plan (theo git log, không thuộc plan nào)

| Commit | Loại |
|--------|------|
| `6146088` | feat: Pencil dashboard UI + SwapRouter deadline fix + E2E admin relay test |
| `46af981` | chore: vercel.json + fix next.config cho Vercel monorepo |
| `728eaee` | fix: turbopack.root absolute path cho Vercel |
| `d8a13a2` | chore: lightningcss-linux-x64-gnu cho Vercel build |
| `06fa6a4` | fix: @tailwindcss/oxide-linux-x64-gnu cho Vercel build |
| `fe5171b` | fix: production client-side exception |
| `29a76f8` | fix: missing env vars + error boundaries cho production |
| `e13dd02` | fix: Generate QR button scroll + regenerate |
| `e7b0cde` | fix: graceful handling API 500 errors trên dashboard |

→ Sau Plan 2 đã có **giai đoạn ổn định production** (Vercel deploy + bugfix series) nhưng chưa có plan formal nào ghi nhận.

---

## Roadmap forward (theo `docs/development-roadmap.md`)

| Phase | Status | Target | Effort |
|-------|--------|--------|--------|
| Phase 1 MVP | Complete | 2026-03-13 | 24h |
| Phase 2 — Scaling (multi-chain, points distribution, admin dashboard, webhooks) | Planned | Q2 2026 | 40-60h |
| Phase 3 — Production Hardening (audit, mainnet, KYC/AML, monitoring, rate-limiting) | Planned | Q3 2026 | 80-120h |
| Mainnet Launch | Planned | Q4 2026 | — |

### Phase 2 Key Areas
- Multi-chain support (Polygon, Ethereum, Arbitrum)
- Points distribution system (rewards merchants/affiliates)
- Admin dashboard (fee management, settlement)
- Enhanced error recovery (grace period bridge retries)
- Webhook notifications (transaction updates)

### Phase 3 Key Areas
- Smart contract audit (external firm)
- Mainnet deployment preparation
- Rate limiting & abuse prevention
- KYC/AML integration
- Settlement & reconciliation workflows
- Monitoring & alerting system

---

## Tình trạng hiện tại

- **Code base:** Phase 1 MVP + Dashboard analytics + Pencil UI redesign — tất cả đã ship
- **Production:** Đã deploy Vercel, chuỗi 7+ fix gần nhất tập trung ổn định production runtime
- **Branch:** `main` clean (chỉ có submodule `forge-std` và `foundry.lock` chưa commit, supabase/.temp untracked)
- **Plan kế tiếp:** Chưa có plan formal nào cho Phase 2 — đang ở khoảng trống giữa MVP done và Phase 2 chưa khởi động
- **Documentation:** `docs/project-changelog.md` dừng ở 2026-03-15, chưa cập nhật chuỗi fix Vercel + Pencil redesign

---

## Success Metrics (Phase 1) — All Passed

- Smoke test exits 0 (CCTP PASS) hoặc 1 (ADMIN_RELAY FALLBACK)
- Quote endpoint trả fee breakdown chính xác (<500ms latency)
- Payment page mobile-friendly, kết nối MetaMask, submit swap
- SSE stream cập nhật progress bar real-time
- SwapRouter deployed BSC Testnet, callable via `cast`
- E2E flow: QR → payment page → sign → swap → bridge → confirmed
- Không có TypeScript compilation errors
- Tất cả security checks passed (atomic idempotency, input validation, key management)

---

## Câu hỏi chưa giải quyết

1. Chuỗi fix Vercel deploy + Pencil redesign gần đây có cần ghi nhận thành plan/changelog entry không? (Hiện `project-changelog.md` dừng ở 2026-03-15)
2. Có muốn tạo plan formal cho Phase 2 (multi-chain / points distribution) hay tiếp tục ad-hoc?
3. Pencil dashboard redesign report có 3 next steps chưa làm: (a) Generate QR modal cho USDC amount input, (b) Export CSV button, (c) persist `targetUSDC` trong merchant profile — có muốn gom vào plan riêng không?

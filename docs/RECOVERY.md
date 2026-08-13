# RECOVERY — dựng lại AIG từ đống đổ nát

> Đo ngày **13/08/2026** trên nhánh `feat/reskin` (e214304). Mọi con số trong file này đều lấy từ lệnh chạy thật, không lấy từ trí nhớ.
> Chỗ nào chưa chạy được để kiểm chứng thì ghi thẳng **CHƯA XÁC MINH** — đừng tin, đi đo lại.

Đọc kèm: `status_AIG.json` → `current` (đang đứng ở đâu) · `docs/web-sitemap.json` (route + env + kho dữ liệu) · `docs/journals/` (sự cố đã xảy ra).

---

## Mô hình 3 tầng

Ba thứ này hỏng theo ba kiểu khác nhau, phục hồi bằng ba đường khác nhau. Nhầm tầng là mất thời gian.

| Tầng | Cái gì | Nằm ở đâu | Mất thì sao |
|---|---|---|---|
| **CODE** | Source, contract, migration | GitHub `baobaogems/aig` (**PUBLIC**), branch `main` + `feat/arbiter` | Clone lại là xong — **trừ** những thứ ở mục cảnh báo bên dưới |
| **SECRETS** | Private key, API key, service-role key | `frontend/.env.local` trên máy này **+** Vercel Production (giá trị write-only, không đọc lại được) | Không tự tạo lại được. Phải rotate hoặc lấy từ password manager |
| **DATA** | Bounty, verdict, points, session | Supabase Postgres · Arc testnet chain state · Circle Gateway | Chain state không mất. Postgres thì **CHƯA XÁC MINH có backup** |

### ⚠️ Cảnh báo tầng CODE — đọc trước khi tin vào "clone lại là xong"

Những thứ sau **KHÔNG** nằm trong git, chỉ tồn tại trên đúng một cái máy:

| Thứ bị bỏ ngoài git | Vì sao | Hỏng máy thì mất gì |
|---|---|---|
| `status_AIG.json` (201 KB, 95 entry) | `.gitignore:37` `*_AIG.json` | Toàn bộ trí nhớ dự án. Không dựng lại được từ bất cứ nguồn nào |
| `roadmap_AIG.json`, `architecture_AIG.json` | như trên | Bản đồ hệ thống + trạng thái phase |
| `CONTRIBUTING.md`, `CLAUDE.md`, `lessons.md` | `.gitignore:26,39,40` | Quy ước làm việc + nhật ký sai lầm |
| `plans/` (400 KB) | `.gitignore:38` | Toàn bộ plan + report |
| Nhánh `feat/reskin` (e214304) | Chưa có upstream | Toàn bộ đợt reskin |
| `frontend/app/api/nanopay/transfers/route.ts` | Chưa commit | Code thật đang chạy trong route table |
| ~20 file `content/*.md` đã final | Chưa commit | Bài viết đã hoàn thiện |

Đây là chủ ý: commit `1020ee4` ("move internal docs out of repo") untrack chúng để **không đẩy ghi chú nội bộ lên một repo PUBLIC**. Quyết định đúng về mặt riêng tư, nhưng hệ quả là **không có bản sao thứ hai ở đâu cả**.

**Hai đường ra, chọn một — đừng để trống:**
1. **Mirror private** (khuyến nghị): tạo repo private `baobaogems/aig-internal`, push các file trên vào đó. Public repo giữ nguyên sạch sẽ.
2. **Bỏ ignore**: chấp nhận toàn bộ ghi chú nội bộ (gồm cả `lessons.md` viết thật lòng) hiển thị công khai.

---

## A. Dựng lại từ số 0

Giả định: máy mới, chưa có gì. Chạy tuần tự.

### A1. Cài công cụ nền

```bash
# Node >= 20 (bắt buộc, package.json engines)
node --version

# Foundry — để build/test/deploy contract
curl -L https://foundry.paradigm.xyz | bash && foundryup
forge --version

# GitHub CLI + Vercel CLI
brew install gh && gh auth login
npm i -g vercel && vercel login
```

### A2. Lấy code về (kèm submodule — thiếu là contract không build được)

```bash
git clone --recurse-submodules https://github.com/baobaogems/aig.git aig
cd aig

# nếu lỡ clone thiếu submodule:
git submodule update --init --recursive
# contracts/lib/forge-std + contracts/lib/openzeppelin-contracts
```

### A3. Lấy lại các file nội bộ bị gitignore

```bash
# nếu đã có mirror private:
git clone https://github.com/baobaogems/aig-internal.git /tmp/aig-internal
cp /tmp/aig-internal/{status,roadmap,architecture}_AIG.json .
cp /tmp/aig-internal/{CONTRIBUTING.md,CLAUDE.md,lessons.md} .
cp -R /tmp/aig-internal/plans .
```

**Chưa có mirror → những file này đã mất vĩnh viễn.** Không có đường khác. Đây chính là lý do mục cảnh báo ở trên tồn tại.

### A4. Cài dependency

```bash
npm install          # npm workspaces: frontend + scripts
```

### A5. Dựng lại secrets

```bash
cp .env.example frontend/.env.local
# rồi điền tay — xem mục B
```

### A6. Kiểm tra dựng thành công (không cần secret, không cần mạng)

```bash
cd contracts && forge test          # kỳ vọng: 19 passed, 0 failed
cd ../frontend
npx tsc --noEmit                    # kỳ vọng: exit 0
npm run lint                        # kỳ vọng: exit 0, không finding
npm run build                       # kỳ vọng: build xong, 9 static page + các API route
```

> Repo **không có** bộ test JS/TS nào (không jest/vitest/playwright). Đừng đi tìm. Kiểm chứng phía JS chỉ có `npm run arbiter:dryrun` (tốn token Anthropic thật) và `npm run arbiter:gate2` (chỉ đọc chain).

### A7. Nối lại Vercel

```bash
cd frontend
vercel link                         # chọn org hoangcaaas-projects, project arbiter-gateway
vercel env pull .env.local          # KÉO ĐƯỢC giá trị env production về máy
```

> `vercel env pull` là **cách duy nhất còn lại** để lấy lại giá trị secret nếu mất `.env.local` mà Vercel vẫn còn sống. Nếu mất cả hai → bắt buộc rotate hết (mục B).

---

## B. Khôi phục SECRETS

Không có secret nào tự tạo lại được. Chỉ có 3 nguồn, theo thứ tự ưu tiên:

1. **Password manager** ← nguồn đúng. Xem mục F nếu chưa làm.
2. `vercel env pull` ← chỉ dùng được khi tài khoản Vercel còn truy cập được.
3. `frontend/.env.local` trên máy cũ ← chỉ khi ổ đĩa còn đọc được.

Mất cả 3 thì phải cấp mới:

| Secret | Cấp lại ở đâu | Việc phải làm sau khi đổi |
|---|---|---|
| `AIG_ADMIN_WALLET_PRIVATE_KEY` | Tạo ví mới | ⚠️ **Nặng nhất.** Ví này vừa là poster, vừa là arbiter, vừa là relay. Contract `ArbiterEscrow` giữ arbiter **immutable — không có hàm đổi**. Đổi ví = **phải deploy escrow mới** + cập nhật `ARBITER_ESCROW_ADDRESS`. Escrow cũ vẫn giữ tiền của bounty cũ và chỉ ví cũ mới release được. |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Cập nhật Vercel + `.env.local`. Không có state dính kèm. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → API | Rotate làm **hỏng ngay** mọi route server. Cập nhật Vercel cả 3 env. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | như trên | Đây là key công khai, có trong bundle browser. Rotate là đổi cả client. |

```bash
# đặt lại một biến trên Vercel (không paste secret vào chat/terminal history nếu tránh được)
cd frontend
vercel env rm  ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel --prod          # phải redeploy env mới có hiệu lực
```

---

## C. Khôi phục DATA

### C1. Supabase (Postgres) — chỗ mong manh nhất

Schema thì an toàn: `frontend/supabase/migrations/001..006` nằm trong git và **chính là** nguồn sự thật của schema.

```bash
# dựng lại schema trên một project Supabase mới
# (chạy lần lượt 001 → 006 trong SQL Editor, hoặc supabase db push nếu đã link CLI)
ls frontend/supabase/migrations/
```

Dựng lại schema cho ra một DB **rỗng**. Dữ liệu thật (bounty, rubric, submission, verdict, escalation, points, merchant, nano_agents) thì:

> **CHƯA XÁC MINH — Supabase có backup hay không.** Phiên này không kiểm tra được. Supabase free tier **không** có point-in-time-restore.
> Cách xác minh: Supabase dashboard → Database → Backups. Nếu trống → dữ liệu bounty/verdict đang sống một bản duy nhất, và nên đặt lịch `pg_dump` định kỳ.

Cứu vãn được phần nào: `verdicts.release_tx` và các lần release/refund đều có dấu vết on-chain trên Arc, nên **lịch sử tiền** dựng lại được từ chain. Còn brief, rubric, nội dung submission, lý do escalation thì **chỉ có trong Postgres**.

### C2. Arc testnet — không cần backup

Escrow `0x6F4f038d30Cfc3Dd88c9ed1Ce55D44f89cc96FF5` và toàn bộ verdict hash nằm trên chain, không mất theo máy. Nhưng cũng **không di chuyển được**: mất khoá arbiter là mất quyền release trên escrow đó vĩnh viễn (xem mục B).

### C3. Circle Gateway — dữ liệu ở nhà người ta

Lịch sử nanopayment từng cuộc gọi **cố ý không** lưu trong DB của AIG (v3.1 chỉ lưu bản tổng hợp `nano_agents`). Chi tiết nằm ở Circle Gateway, truy cập bằng địa chỉ ví. Không có bản sao nội bộ, và cũng không có kế hoạch làm.

---

## D. Kiểm tra sau khi dựng xong

```bash
# 1. production còn sống?
curl -s -o /dev/null -w "%{http_code}\n" -L https://arbiter-gateway.vercel.app     # kỳ vọng 200

# 2. redirect gốc còn đúng?
curl -sI https://arbiter-gateway.vercel.app | grep -i location                     # kỳ vọng: /dashboard

# 3. API đọc còn trả JSON?
curl -s "https://arbiter-gateway.vercel.app/api/bounty" | head -c 300

# 4. x402 còn chặn đúng (chưa trả tiền phải ra 402)?
curl -s -o /dev/null -w "%{http_code}\n" https://arbiter-gateway.vercel.app/api/nanopay/quote   # kỳ vọng 402

# 5. đường tiền on-chain còn nối đúng (chỉ đọc, không tiêu tiền)
cd frontend && npm run arbiter:gate2
```

---

## E. Dựng lại ở TÊN MIỀN KHÁC

Xếp theo mức thiệt hại. Làm từ trên xuống.

> **Tin tốt, đã kiểm chứng:** dự án này **không** có webhook thanh toán, **không** gửi mail, **không** có analytics, **không** có OAuth/redirect-URL allowlist. Đã grep tìm `nextauth / gtag / posthog / plausible / resend / sendgrid / nodemailer` → **không có kết quả nào**. Nên đổi domain **rẻ hơn nhiều** so với một SaaS thông thường. Đừng đi vá những thứ không tồn tại.

### E1. 🔴 Mất tiền — agent bên ngoài đang trỏ vào domain cũ

Đây là chỗ duy nhất đổi domain làm **mất doanh thu thật**.

x402 nhúng URL resource vào payment requirements (`lib/nanopay.ts:97-99`, field `resource.url` = chính endpoint đó). Agent đang trả tiền cho `.../api/nanopay/quote` hoặc `.../api/nanopay/m/<merchant>` ở domain cũ: domain cũ chết → agent nhận lỗi mạng, **ngừng trả tiền**, và chủ agent không được ai báo.

- [ ] **Giữ domain cũ redirect 301 sang domain mới ít nhất 90 ngày.** Rẻ nhất, hiệu quả nhất.
- [ ] Báo trực tiếp mọi bên đang vận hành agent để họ đổi `BASE_URL` (`scripts/nano-agent.mts:23` — client đọc biến này, mặc định `http://localhost:3000`).
- [ ] Nếu có merchant dùng `/api/nanopay/m/<merchant>`: mỗi merchant là một link riêng, phải báo riêng từng người.

```bash
# verify: endpoint mới phải chặn đúng bằng 402, không phải 404/500
curl -s -o /dev/null -w "quote=%{http_code}\n" https://<DOMAIN-MOI>/api/nanopay/quote
curl -s -o /dev/null -w "merchant=%{http_code}\n" https://<DOMAIN-MOI>/api/nanopay/m/<VI-MERCHANT>
# kỳ vọng cả hai = 402

# verify: domain cũ phải redirect, không được chết trắng
curl -sI https://arbiter-gateway.vercel.app/api/nanopay/quote | head -1
```

### E2. 🟠 Gãy luồng thanh toán — link /pay/[id] đã phát ra ngoài

Mã QR **tự lành**: `components/qr-code-generator.tsx:63` dựng URL từ `window.location.origin`, nên QR mới sinh ra tự trỏ đúng domain mới. Không phải sửa code.

Nhưng QR/link đã **in ra, gửi đi, screenshot** trước đó thì vẫn trỏ domain cũ và sẽ chết.

- [ ] Redirect 301 domain cũ (cùng việc với E1 — làm một lần ăn cả hai).
- [ ] Nếu có QR đã in vật lý: phải in lại, không cứu được bằng cấu hình.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L "https://<DOMAIN-MOI>/pay/test-session?merchant=0x0&amount=1"   # kỳ vọng 200
```

### E3. 🟡 Env sai tên khiến client chạy sai RPC

Đang có sẵn một lỗi lệch tên, đổi domain là dịp sửa luôn:

> Vercel Production có `ETHEREUM_SEPOLIA_RPC_URL`, nhưng code đọc `NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL` (`components/providers.tsx`). Biến **không** có tiền tố `NEXT_PUBLIC_` thì **không bao giờ** đến được browser → client đang chạy bằng RPC mặc định fallback.

- [ ] Đặt đúng tên `NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL` trên project mới.
- [ ] Bê đủ 26 biến (danh sách đầy đủ + biến nào file nào đọc: `docs/web-sitemap.json` → `envMatrix`).
- [ ] **Bỏ luôn** đám chết: `BRIDGE_BACKEND`, `NEXT_PUBLIC_BRIDGE_BACKEND`, `USDC_ADDRESS_BSC_TESTNET`, `BSC_TESTNET_RPC_URL`, `CCTP_TOKEN_MESSENGER_BSC` — không code nào đọc.
- [ ] `DRY_RUN` phải đặt **có chủ đích**. Bỏ trống = mọi lệnh ghi on-chain bị từ chối (đúng theo thiết kế fail-safe), và sẽ trông như "app hỏng".

```bash
cd frontend && vercel env ls production    # đối chiếu với docs/web-sitemap.json -> envMatrix
```

### E4. 🟢 Link chết trong tài liệu và bài đã đăng

Không mất tiền, nhưng mất uy tín — vài bài VN đã đăng công khai có trỏ link.

- [ ] Rà `README.md`, `docs/*.md`, `content/*.md` tìm URL cũ.
- [ ] Bài đã đăng trên X không sửa được → chỉ redirect 301 mới cứu.

```bash
grep -rn "arbiter-gateway.vercel.app\|aig-frontend-blond" README.md docs content 2>/dev/null
```

### E5. ⚪ Không đổi theo domain — đừng đụng vào

Ghi ra để khỏi mất công đi "sửa" nhầm:

- Địa chỉ contract `ArbiterEscrow` — nằm trên chain, không dính domain.
- Ví admin/arbiter — không dính domain.
- Supabase URL + key — dính project, không dính domain. **Không** có URL allowlist vì dự án không dùng Supabase Auth.
- Circle Iris / Circle Gateway — không có callback URL nào trỏ ngược về ta.

---

## F. Checklist bảo mật tài khoản — làm tay, một lần

Không tự động hoá được. Chưa tick thì coi như chưa làm.

- [ ] **Password manager**: cất `AIG_ADMIN_WALLET_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Hiện tại nguồn sự thật của secret là **một file `.env.local` trên một cái máy** — đó không phải backup.
- [ ] **2FA** trên GitHub, Vercel, Supabase, Anthropic. Mất tài khoản GitHub = mất luôn tầng CODE.
- [ ] **GitHub secret scanning + push protection**: repo PUBLIC nên bật được miễn phí. Settings → Code security.
- [ ] **Mirror repo private** cho các file nội bộ bị gitignore (xem cảnh báo tầng CODE). Đây là việc **gấp nhất** trong danh sách này.
- [ ] **Push `feat/reskin` lên remote**, hoặc quyết định bỏ hẳn. Đang là công sức nằm trên một ổ đĩa.
- [ ] **Commit `frontend/app/api/nanopay/transfers/route.ts`** — code thật, đang chạy, chưa từng vào git.
- [ ] **Ví admin hiện tại là ví testnet — tuyệt đối không dùng lại khi lên mainnet.** Mainnet phải là ví cấp mới, sinh ra trong môi trường sạch, chưa từng nằm trong file `.env` nào. (Lý do cụ thể ghi trong `lessons.md`, giữ nội bộ.)
- [ ] **Kiểm tra backup Supabase** (mục C1) — hiện đang CHƯA XÁC MINH.
- [ ] **Giữ repo private hay public**: hiện **PUBLIC** và đó là chủ ý (nộp bài, minh bạch). Đã quét secret sạch ở commit `1020ee4`. Trước mỗi lần push, giữ thói quen: không có `.env*`, không private key, không service-role token.

---

## Còn treo

- Supabase có backup không — **CHƯA XÁC MINH**, phải mở dashboard xem.
- Commit nào đang chạy trên production — **CHƯA XÁC MINH**; `vercel ls` không in SHA. Kiểm bằng `vercel inspect <deployment-url>`.
- Chưa từng diễn tập khôi phục thật. Mục A mới là quy trình trên giấy, chưa ai chạy lại từ máy trắng bao giờ.

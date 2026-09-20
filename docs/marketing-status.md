# Marketing Status — Arc / Arbiter Invisible Gateway

> **File DUY NHẤT** cho trạng thái chiến dịch marketing. Mọi thay đổi định hướng ghi vào đây,
> **KHÔNG tạo file mới**. Theo đúng convention `status_AIG.json`:
> phần `## Hiện trạng` **ghi đè** mỗi lần đổi · phần `## Nhật ký thay đổi` **chỉ thêm vào cuối,
> không bao giờ sửa/xoá entry cũ**. Sai thì append entry đính chính.
>
> Thay thế: `content-calendar-v3.md`, `content-calendar-v4.md` (giữ lại để tra cứu, không cập nhật nữa).

---

## Nguồn dữ liệu — ai ghi cái gì

| Nơi | Vai trò | Ai ghi | Chiều |
|---|---|---|---|
| **Google Sheet "Arc Content Calendar"** ([link](https://docs.google.com/spreadsheets/d/1SYjvBriHX2WDQbcwJ5qbcCZkuOnPo5j_06k_CyWfi-4/edit)) | **SOURCE OF TRUTH** — lịch, log bài, số liệu | anh (số liệu tay) + import CSV | — |
| Dashboard local `:5174` | Nơi nhập bài mới nhanh, DB `.dashboard/data/marketing.db` | anh | → CSV |
| `scripts/export-marketing-to-csv.py` | DB → 3 CSV khớp 3 tab của sheet | Claude chạy | repo → sheet |
| `assets/marketing-export/*.csv` | File trung gian để import | script sinh ra | — |
| File này | Vì sao đổi hướng, đang ở đâu | Claude |
| **Bảng cân đối** (trực quan) — https://claude.ai/code/artifact/098adf1e-14cd-462c-9d4c-5fd5cd227b75 | Trọng số trụ, lịch, số tổng | Claude republish mỗi tuần |
| **Sổ tay vận hành** — https://claude.ai/code/artifact/f52ac5db-044d-4076-98a2-62435534a309 | Cách chạy vòng lặp 7 ngày, 9 bước | ít đổi | — |

**Chiều ghi (repo → sheet):** chạy script → sheet: File ▸ Import ▸ Upload ▸ *Replace current sheet*.
Bộ công cụ Google Drive hiện tại **không append row vào sheet có sẵn được** (`update_file` chỉ đổi
tên/thư mục), nên đi đường CSV. Muốn tự động hai chiều thì phải dựng Google Sheets API + service account.

**Chiều đọc (sheet → phân tích):** Claude đọc thẳng sheet qua Drive connector. Đã kiểm chứng 18/08 ✅

**Không mất số liệu tay:** script merge theo cột `url` — số anh điền trong tab `metrics` được giữ
qua mỗi lần export. Đã kiểm chứng (lần chạy thứ 2 giữ đủ 16 dòng).

### 3 tab của sheet

| Tab | Cột | Ai điền |
|---|---|---|
| `content-log` | ngay_dang, pillar, loai (original/amplify), ngon_ngu, tieu_de, url, file_trong_repo, trang_thai, ghi_chu | script |
| `content-calendar` | tuan, ngay, pillar, tieu_de, dinh_dang, trang_thai, url_sau_khi_dang | script sinh; anh điền url sau khi đăng |
| `metrics` | ngay_dang, pillar, tieu_de, url + impressions, engagements, engagement_rate, detail_expands, profile_visits, new_follows, replies, reposts | **anh điền tay từ X Analytics** |

---

## Hiện trạng  _(ghi đè — cập nhật 18/08/2026)_

**Brand:** AIG = **Arbiter Invisible Gateway** — trọng tài phân xử hợp đồng giữa AI agent bên mua
dịch vụ và bên cung cấp. Đổi từ định vị "cổng thanh toán cross-chain". Theo hướng Arc Hackathon.

**Mục tiêu định vị:** builder số 1 phía Nam của Arc.

**Số đã đếm được (33 bài trong dashboard):**

| Chỉ số | Giá trị |
|---|---|
| Tổng bài | 39 |
| Bài gốc (có file trong `content/`) | 18 |
| Series dạy build từ 0 (chỉ có trên X) | 6 |
| Bài khuếch đại (share/quote event) | 15 |
| Có URL | 22 / 39 |
| Có số liệu hiệu quả | **0 / 39** |

**Phân bố pillar:** P1 kỹ thuật 13 · P0 khuếch đại 12 · **P4 dạy 6** · P2 explainer 3 · P5 Arbiter 3 · P6 cộng đồng 2.

**Đọc số này ra gì:** P4 đã tìm thấy — 6 bài series nằm trên X, không có file trong repo. P6 chỉ có 2 bài. Toàn bộ tháng 8 là P0 khuếch đại: giữ được nhịp đăng, nhưng
không xây tài sản riêng. Và 0/33 bài có số liệu → mọi quyết định content tới giờ đều là phỏng đoán.

**Pillar đang dùng (v4, 18/08):**

| Pillar | Ưu tiên | Vì sao |
|---|---|---|
| **P4 · Dạy build từ 0** | 1 | Bằng chứng hiệu quả duy nhất đo được ngoài đời: người tới gặp ở meetup nói nhờ series mà làm được dự án Arc đầu tiên |
| **P6 · Cộng đồng Sài Gòn** | 2 | Cà phê build hằng tuần — ảnh mới mỗi tuần, chi phí gần 0, không cạn nội dung |
| **P5 · Arbiter** | 3 | Brand mới, có contract live + evidence on-chain |
| **P2 · Arc explainer VN** | 4 | Mở tệp non-dev |
| **P1 · Build-in-public kỹ thuật** | 5 | Giữ uy tín, không dùng để tăng trưởng — tệp hẹp |
| **P0 · Khuếch đại** | nền | Share/quote event: giữ nhịp, không thay được nội dung gốc |

**Lịch đang chạy:** ⏰ **nước rút 19–23/08 (Arc Hackathon deadline 23/08)**, rồi 4 tuần tới 14/09. 15 mục.
Chi tiết ở tab `content-calendar` của sheet (bản sinh ra từ `CALENDAR` trong script export).

**Guardrail sự thật (bắt buộc, kế thừa từ v3 + thêm cho Arbiter):**
- Không viết "173 dòng" (là **178**), "Domain 7" (là **26**), "45 giây e2e" (là **~60–120s**).
- Không gọi AIG/Arbiter là "AI agent" — repo không có LLM dependency.
- Không bịa phí dịch vụ AIG (không có).
- App Kit chỉ xuất hiện dạng "đã thử và bỏ", không bao giờ là nền tảng.
- **Arbiter: luôn nói rõ testnet.** ✅ **ĐƯỢC nói "AI phân xử"** — đã xác minh có LLM thật (`@anthropic-ai/sdk`, model `claude-opus-4-8`, `frontend/lib/arbiter/client.ts`).
- Merchant SDK / StableFX / Unified Balance: **chưa build** — chỉ được nói dạng tầm nhìn.

**Việc đang chặn:**
1. ~~Series "6 bài build từ 0"~~ ✅ **giải quyết 18/08** — 6 bài trên X, đã nạp vào dashboard. Ngày đăng chưa xác minh.
2. ~~Arc Hackathon deadline~~ ✅ **23/08/2026** — lịch đã neo lại, 19–23/08 là nước rút.
3. Ngày đăng thật của 15 bài tháng 8 + 6 bài series — anh điền (ô nhập ngày đã sửa xong 18/08).
4. ~~Quán cà phê~~ ✅ **Highlands Coffee, Diamond Plaza, Q1** — cuối tuần, khung giờ chưa chốt.
5. ~~Arbiter có LLM?~~ ✅ **CÓ** — được nói "AI phân xử".
6. 0/39 bài có số liệu — vẫn là nút thắt lớn nhất.
7. Khung giờ cố định cho cà phê Highlands Diamond Plaza (bài 19/08 có CTA mời).

---

## Nhật ký thay đổi  _(APPEND-ONLY — không sửa entry cũ)_

### 2026-06-14 — v3: dựng lịch 18 ngày, đối chiếu sự thật code

- **Lý do:** lịch 30 ngày cũ (`plans/260526-1034-...`) dựng trên v1-as-current, nhiều claim sai so với code đã ship.
- **Đổi gì:** rebuild 18 mục neo từ 14/06, nhịp ~2 ngày, neo Challenge vào deadline 13/07. Lập bảng verify facts (178 dòng, domain 26, 0.996383). CUT các chủ đề App-Kit-as-foundation / StableFX / Unified Balance.
- **File:** `content-calendar-v3.md`.

### 2026-08-18 — v4: pivot Arbiter + đảo thứ tự pillar sau meetup 16/08

- **Lý do:** (a) v3 neo tháng 6–7, mục cuối cùng có file là 02/07 → lịch hết hạn. (b) Brand đổi thành Arbiter Invisible Gateway theo hướng Arc Hackathon. (c) Meetup Arc Sài Gòn 16/08 cho tín hiệu ngoài đời: người tới gặp nói nhờ series dạy build mà làm được dự án Arc đầu tiên — tức giá trị nằm ở **dạy**, không phải ở chiều sâu kỹ thuật như v3 giả định.
- **Đổi gì:** thêm 3 pillar mới (P4 dạy · P5 Arbiter · P6 cộng đồng Sài Gòn); hạ P1 kỹ thuật từ trụ chính xuống #5; gộp P3 nanopay vào P5; **bỏ hẳn** pillar Challenge/Grant khỏi lịch (deadline 13/07 đã trôi, chỉ viết khi có kết quả thật). Lịch mới 4 tuần, nhịp T3/T5/CN.
- **File:** `content-calendar-v4.md`.

### 2026-08-18 — Đính chính: "im lặng 47 ngày" là SAI

- **Lý do:** nhận định trước đó dựa trên mtime file trong `content/`, bài cuối 02/07 → kết luận đứt nhịp 47 ngày. Sau khi anh điền dashboard, lộ ra **15 bài tháng 8** (04/08 → 18/08) không có file trong repo.
- **Sự thật:** nhịp đăng **không đứt**. Nhưng 15 bài đó gần như toàn bộ là **P0 khuếch đại** (share/quote event, hackathon, Arc Campus), chỉ 2 bài mang nội dung riêng ("Builder Arc ở đâu nhiều thế", "Giới thiệu Arbiter Invisible Gateway phiên bản mới").
- **Hệ quả:** chẩn đoán đổi từ *"đứt nhịp"* sang *"giữ nhịp nhưng không xây tài sản riêng"*. Hai cái cần thuốc khác nhau — cái sau nguy hiểm hơn vì nhìn bận rộn mà pillar chính vẫn trống.
- **Kéo theo:** bài "giới thiệu pivot Arbiter" trong lịch v4 tuần 1 bị **bỏ** — anh đã đăng 18/08.

### 2026-08-18 — v5: Google Sheet thành source of truth, gộp về một file status

- **Lý do:** (a) Thông tin bị miss giữa các phiên vì nằm rải ở DB local + nhiều file calendar. (b) Notion ngốn quá nhiều credit. (c) Mỗi lần đổi hướng lại đẻ một file calendar mới → không nhìn xuyên suốt được.
- **Đổi gì:** Sheet "Arc Content Calendar" thành source of truth (3 tab). Thêm `scripts/export-marketing-to-csv.py` cho chiều ghi. File `marketing-status.md` này thành file trạng thái duy nhất, v3/v4 đóng băng để tra cứu.
- **Giới hạn kỹ thuật đã xác minh:** Drive connector **đọc** được sheet ✅ nhưng **không ghi** được vào sheet có sẵn (`update_file` chỉ đổi tên/parent, không có connector Sheets riêng) → phải đi đường CSV import thủ công.
- **Sửa dữ liệu:** bài "Day 7 (EN)" bị nhập URL nhầm vào ô `notes` và `file_path='X'` → đã sửa.
- **File:** `docs/marketing-status.md` (mới), `scripts/export-marketing-to-csv.py` (mới), `assets/marketing-export/*.csv` (mới).

### 2026-08-18 — Sửa lỗi dashboard làm sai ngày đăng của MỌI bài backfill

- **Lý do:** anh báo điền link xong không có ô nhập ngày. Truy ra 2 lỗi trong dashboard: (a) form thiếu hẳn ô `published_at` (chỉ có `scheduled_at`); (b) API `PUT /api/content/:id` không có `published_at` trong `EDITABLE_FIELDS` → **âm thầm bỏ qua** kể cả khi gửi lên, đồng thời tự đóng dấu `new Date()` khi status chuyển sang published.
- **Hệ quả đã xảy ra:** toàn bộ 15 bài tháng 8 mang ngày 18/08 = giờ nhập liệu, không phải ngày đăng thật.
- **Đã sửa:** thêm ô "Published date" vào `ContentFormModal.vue`; thêm `published_at` vào `EDITABLE_FIELDS`; đóng dấu tự động **nhường** ngày nhập tay. Kiểm chứng qua API thật ✅
- **File:** `~/.claude/skills/marketing-dashboard/app/src/components/content/ContentFormModal.vue`, `~/.claude/skills/marketing-dashboard/server/routes/content.js`.

### 2026-08-18 — v6: neo lịch vào deadline 23/08 + tìm ra trụ P4 + gỡ content/ khỏi repo public

- **Lý do:** anh cung cấp 3 dữ kiện đảo kế hoạch: (a) Arc Hackathon **deadline 23/08** — còn 5 ngày, lịch 4 tuần thong thả không còn hợp; (b) series "6 bài build từ 0" nằm trên X, không có file repo; (c) Arbiter **có LLM thật**.
- **Đổi gì:** tuần 1 đổi từ "phá băng" sang **nước rút 19–23/08**, mỗi ngày 1 bài. Bài giá trị cao nhất là 20/08 "còn 3 ngày, build được rồi thì nộp đi" — đánh đúng nhóm đã gặp ở meetup: build được nhưng không nộp. Gỡ guardrail cấm nói "AI phân xử".
- **Phát hiện an ninh:** repo `github.com/baobaogems/aig` là **PUBLIC** và `content/` **đang được git track** — 24 file (gồm `_learnings-log.md` có số liệu + giả thuyết chiến lược) đã lộ. Theo yêu cầu của anh: đã thêm `content/`, `assets/marketing-export/`, `.dashboard/` vào `.gitignore` và `git rm --cached`. ⚠️ **Lịch sử commit cũ vẫn còn chứa các file này** — muốn xoá sạch phải rewrite history hoặc chuyển repo sang private.
- **File:** `.gitignore`, `scripts/export-marketing-to-csv.py`, dashboard (xem entry trên).

### 2026-08-18 — Quyết định: GIỮ NGUYÊN lịch sử git, repo vẫn PUBLIC

- **Bối cảnh:** phát hiện 24 file `content/` đã lộ trên repo public. Cân nhắc 3 đường: giữ nguyên / rewrite history / chuyển private.
- **Đã đọc kiểm toàn bộ lịch sử `content/`:** **KHÔNG** có "local mod", "moderator", "builder số 1", "dẫn đầu", "đối thủ" — không lộ ý định giành role. Không PII người thật (`comments.md` là template rỗng). Không key.
- **Có lộ 3 thứ, mức vụng chứ không nguy hiểm:** (1) số liệu nhỏ 151 imp / 15.9% kèm câu "0 boost từ Arc/Circle team"; (2) chiến thuật "tag Arc team… để xin amplification" trong `_learnings-log.md`; (3) template `_signals-log.md` phân loại người theo "Architects-tier / Grant / Challenge".
- **Vì sao KHÔNG rewrite:** commit chứa `content/` cũ nhất còn **90 commit con cháu** → rewrite đổi hết SHA. `docs/` đang trích **≥12 SHA** làm bằng chứng build (`2e166a1`, `42a9303`, `60ef983`, `2d5ded0`…). Rewrite = tự phá chuỗi bằng chứng dùng để xin role builder, đổi lấy việc giấu một câu vụng. Mà rewrite cũng không sạch triệt để (fork/clone/cache cũ vẫn còn).
- **Vì sao KHÔNG private:** repo public CHÍNH LÀ hồ sơ xin role. Private = mất lý do tồn tại của nó.
- **Chốt:** giữ nguyên lịch sử, repo vẫn public. `content/` đã gitignore → không lộ thêm từ 18/08. Rủi ro còn lại chấp nhận có ý thức.

---

## Quy trình chạy — đọc cái này trước mỗi phiên

**Câu mở phiên gợi ý:** *"Đọc `docs/marketing-status.md`, cho anh biết đang ở đâu và tuần này đăng gì."*

### Vòng lặp 1 tuần

| Bước | Việc | Ai | Ở đâu |
|---|---|---|---|
| 1 | Xem tuần này đăng gì | anh/Claude | tab `content-calendar` |
| 2 | Viết bài (theo pillar + guardrail sự thật) | Claude | `content/{slug}.md` |
| 3 | Đăng lên X | **anh** | — |
| 4 | Dán URL | anh | dashboard `:5174` |
| 5 | **Sau 48h: điền số từ X Analytics** | **anh** | tab `metrics` |
| 6 | Ghi 3 dòng cảm nhận | anh | `content/_learnings-log.md` |
| 7 | Có người thật tương tác → ghi 1 dòng | anh | `content/_signals-log.md` |
| 8 | Cuối tuần: export + phân tích | Claude | script → CSV → anh import |
| 9 | Đổi hướng → append 1 entry có **lý do** | Claude | `## Nhật ký thay đổi` file này |

**Bước 5 là mắt xích yếu nhất** — không tự động được, và bỏ nó thì cả vòng lặp thành vô nghĩa
(4 tháng đầu: 0/33 bài có số → mọi quyết định là phỏng đoán).

### Lệnh hay dùng

```bash
cd "/Users/baobao/WORKSPACE/02_PROJECTS/MARCH - aig_project"

# bật dashboard (port 5174)
~/.claude/skills/marketing-dashboard/start-project.sh "$PWD"

# export DB -> 3 CSV (giữ nguyên số liệu tay đã điền)
python3 scripts/export-marketing-to-csv.py

# mở thư mục CSV để import vào sheet
open assets/marketing-export/
```

Import: sheet ▸ File ▸ Import ▸ Upload ▸ **Replace current sheet** (từng tab một).

### 3 quy tắc không được phá

1. **Không đẻ file mới** khi đổi hướng marketing — append vào `## Nhật ký thay đổi` của file này.
2. **Không sửa entry cũ** trong nhật ký. Sai thì append entry đính chính (xem entry "im lặng 47 ngày là SAI").
3. **Không bịa số.** Chưa đo được thì ghi `CHƯA XÁC MINH` kèm cách đo.

---

## Câu chưa trả lời

- Series "6 bài build dự án từ 0" lưu ở đâu? Repo khác, hay chỉ tồn tại trên X?
- Arc Hackathon deadline ngày nào?
- 15 bài tháng 8 có ngày đăng thật là ngày nào? (`published_at` hiện = giờ nhập liệu 18/08, **CHƯA XÁC MINH** — anh sửa trong sheet)
- Arbiter có LLM trong code không? Quyết định được phép nói "AI phân xử" hay không.
- Ngách video ARC: chưa gộp vào lịch — chờ chốt P4/P6.

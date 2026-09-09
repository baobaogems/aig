# Cầu CCTP treo 5 ngày vì 4 lỗi chồng nhau

**Ngày:** 26/05 → 31/05/2026 · **Mức:** sự cố lớn nhất của dự án tính đến 13/08/2026
**Trạng thái:** đã đóng · **Liên quan:** `docs/v2-smoke-evidence.md`, `status_AIG.json` (log 26/05–31/05)

---

## Chuyện gì đã xảy ra

Luồng thanh toán v2 (Ethereum Sepolia → Arc, qua Circle CCTP) phải chạy được end-to-end. Khách ký `approve` + `depositForBurn` trên Sepolia, server đợi Circle chứng thực rồi mint USDC cho merchant trên Arc.

Bước ký thì xong sớm. Bước **bridge** thì treo. Treo 5 ngày.

Mỗi lần tưởng đã fix xong, chạy lại, nó lại treo — **ở đúng chỗ cũ**, với đúng cái spinner cũ. Bốn lần như thế. Bốn nguyên nhân hoàn toàn khác nhau, nằm ở bốn tầng khác nhau, và mỗi cái **che mất** cái phía sau.

Thoát ra lúc 10:35 sáng 30/05: mint đầu tiên thành công trên Arc (`0xc0b4cca9…41eb61`, block 44698950). Ngày 31/05 dọn nốt hai thứ còn treo.

---

## Sự thật trần trụi

Cái làm mệt nhất không phải độ khó kỹ thuật. Là chuyện **triệu chứng không đổi**.

Bốn bug khác nhau, cùng một biểu hiện: spinner ở bước "bridging", rồi timeout. Không có cách nào nhìn màn hình mà biết mình đang gặp bug số mấy. Sửa xong bug 1, chạy lại, thấy y hệt — cảm giác đầu tiên luôn là *"mình sửa sai rồi"*, trong khi thật ra là *"sửa đúng rồi, và vừa lộ ra bug tiếp theo"*. Phân biệt được hai cái đó chỉ có một đường: bỏ UI, đi hỏi thẳng nguồn authoritative.

Có một đoạn mất niềm tin thật sự vào ví: MetaMask báo không đủ tiền để trả gas trên Sepolia trong khi ví có tiền. Ngồi soi số dư, soi gas, nghi code. Cuối cùng đổi sang OKX wallet thì đi tiếp bình thường — hoá ra là gas oracle của MetaMask báo sai. Mất mấy tiếng cho một thứ **không nằm trong code của mình**, và không có gì để học ngoài "công cụ cũng sai được".

Đoạn cay nhất là 30/05. Đã có e2e chạy được ở local — ăn mừng xong, deploy lên prod, prod chết. Lý do đầu tiên: `origin/main` đang **đứng sau local 8 commit**. Suốt thời gian đó Vercel vẫn build code cũ. Nghĩa là một phần của những lần "fix rồi vẫn treo" trước đó, trên prod, là đang test một bản code **chưa bao giờ chứa bản fix**. Không có gì thông minh ở đây cả, chỉ là quên push.

Điểm sáng duy nhất, và nó thật sự quan trọng: **không mất một đồng nào**. Burn trên Sepolia không bao giờ biến mất — attestation của Circle cứ nằm đó chờ, gọi `receiveMessage` lúc nào cũng mint được. Cái burn mồ côi từ 30/05 đến 31/05 mới đi cứu, vẫn về đủ.

---

## Chi tiết kỹ thuật

### Lỗi 1 — `maxFee=0n` biến Fast Transfer thành Standard *(29/05)*

`maxFee = 0` làm Circle xếp burn vào loại **Standard**, tức phải đợi Sepolia hard finality (~13–19 phút). Server thì `pollAttestation` timeout ở **120 giây**. Không đời nào kịp.

Xác minh bằng cách hỏi thẳng Circle Iris sandbox: burn `0x43182ad7…` trả về `status=pending_confirmations`, `cctpVersion=2`. Hỏi tiếp API phí `/v2/burn/USDC/fees/0/26`: fast (threshold 1000) = 1bps tối thiểu, standard (2000) = 0 → tuyến Sepolia→Arc **có** hỗ trợ Fast.

Fix (`frontend/lib/payment-flow-v2.ts`): `maxFee = amountWei/1000n || 1n` — trần 0.1%, chỉ cần **lớn hơn 0** là đủ điều kiện Fast (thực thu ~1bps). Giữ `minFinalityThreshold=1000` (giờ mới đúng nghĩa Fast). Nâng timeout 120s → 180s.

### Lỗi 2 — SSE stream chết kéo cả pipeline chết theo *(29/05)*

`unhandledRejection TypeError: Invalid state: WritableStream is closed` tại `execute/route.ts:60`. Khách đóng tab → stream đóng → `emit()` vẫn ghi tiếp → nổ.

Fix: bọc `emit()` và `writer.close()` trong try/catch. Client ngắt kết nối không được phép giết pipeline server.

### Lỗi 3 — polling bằng API v1 cho burn v2 *(30/05)*

Cái này là kẻ giết người thầm lặng nhất.

`cctp.ts` `pollAttestation()` viết theo **CCTPv1**: `GET {apiBase}/{messageHash}`. Nhưng burn của chúng tôi là **v2**, phải hỏi endpoint v2: `GET /v2/messages/{sourceDomain}?transactionHash={tx}`.

Hỏi v1 cho message v2 → **404 vĩnh viễn** → timeout ở 180s, trong khi Circle **đã có sẵn attestation từ lâu**. Xác nhận bằng cách query Iris trực tiếp cho burn `0x9a620cf2…`: `status=complete`. Chứng thực xong rồi. Chỉ là chúng tôi gõ nhầm cửa.

Fix: viết `pollAttestationV2(txHash, sourceDomain, timeoutMs)`. Tiện thể phát hiện Iris v2 trả về **cả** raw message **lẫn** attestation → bỏ được luôn khâu extract message hash on-chain của v1.

Chạy lại ngay trên burn cũ: SSE bắn `swap_executing → bridging → confirmed` trong vài giây. Mint Arc `0xc0b4cca9…41eb61`, block 44698950, gas 175814. **Lần đầu tiên pipeline chạy trọn vẹn.**

### Lỗi 4 — Vercel giết tiến trình nền *(30/05, chỉ có trên prod)*

Sau khi push đủ 8 commit, prod vẫn hỏng — nhưng theo kiểu mới: SSE bị cắt ở **~2.3 giây**, ngay sau event `bridging`, quá sớm để `receiveMessage` kịp gửi.

Bằng chứng lạnh lùng, không cần đoán: **nonce của ví admin trên Arc vẫn đứng ở 1**. Giao dịch chưa bao giờ được gửi đi.

Nguyên nhân: route handler `return Response` trong khi `runPipeline` chạy fire-and-forget. Serverless **tháo function ngay khi handler return** → pipeline nền bị giết giữa chừng. Local không bao giờ tái hiện được, vì local không tháo process.

Fix: neo pipeline vào trong `ReadableStream.start()` để Vercel giữ function sống tới `controller.close()`. Thêm `maxDuration=60`, `runtime="nodejs"`, `dynamic="force-dynamic"`, header `X-Accel-Buffering: no`. Cho `receiveMessage` trả về sớm (nhận tx hash, `waitForTransactionReceipt` chạy tách rời) để SSE đóng trong ~2s.

Sửa xong thì prod **báo được lỗi thật**: `receiveMessage: AIG_ADMIN_WALLET_PRIVATE_KEY missing or malformed` — thiếu env trên Vercel. Đáng nói: đây là lần đầu prod nói cho biết nó đang thiếu gì. Trước đó nó chỉ im lặng rồi chết.

### Dọn dẹp *(31/05)*

**Cứu burn mồ côi.** `0x43182ad7…` (1 USDC, treo từ 30/05) — POST lại `/api/agent/execute`, mint `0xb42c1fab…`. Xác nhận thêm một điều có giá trị: `pollAttestationV2` đọc được **cả** message Fast lẫn Standard từ endpoint v2.

**Giải oan vụ "phí 0.36%".** Nghi Circle thu phí cao hơn công bố. Đọc thẳng message body + receipt mint trên Arc: `amount=1_000_000`, `maxFee=1000`, `feeExecuted=100` = **đúng 1bps**, khớp tài liệu. Mint phát ra 2 log Transfer: 999.900 đơn vị cho merchant + 100 đơn vị cho ví thu phí của Circle.

Con số 0.36% là **lỗi phép đo của chính mình**: số dư merchant ban đầu không phải đúng 40.000000 — còn dư từ mấy lần test trước. Trừ nhầm.

---

## Nguyên nhân gốc

Không phải một nguyên nhân. Là một **kiểu sai lặp lại**: mỗi chỗ đều **giả định thay vì đo**.

| Lỗi | Giả định | Sự thật |
|---|---|---|
| 1 | `maxFee=0` nghĩa là "không giới hạn phí" | `0` = xếp loại Standard = đợi finality |
| 2 | Client cầm stream tới cùng | Client đóng tab bất cứ lúc nào |
| 3 | Một client CCTP dùng được cho mọi version | v1 và v2 khác endpoint, khác hình dạng dữ liệu |
| 4 | Chạy được ở local thì chạy được trên prod | Serverless tháo process khi handler return |

Và cái nền dưới tất cả: **lấy UI làm bằng chứng**. Cả 4 lỗi đều hiện ra y hệt nhau trên màn hình. Chừng nào còn nhìn spinner để chẩn đoán thì còn mù. Chỉ khi đi hỏi nguồn authoritative — Iris API trực tiếp, nonce on-chain, receipt log — thì mỗi lỗi mới lộ mặt trong vài phút.

---

## Bài học

1. **Triệu chứng giống nhau không có nghĩa là cùng một bug.** Sửa xong mà biểu hiện y cũ → khả năng cao là đã sửa đúng và vừa lộ lỗi kế tiếp. Đừng revert bản fix đúng.
2. **Chẩn đoán bằng nguồn authoritative, không bằng UI.** Hỏi thẳng Iris API. Đọc nonce on-chain. Decode receipt log. Cả 4 lỗi đều gãy ngay khi ngừng đoán.
3. **`git push` là một bước của quy trình debug prod.** Trước khi kết luận "prod hỏng", kiểm `origin/main` có đúng là thứ mình đang test không. 8 commit chênh lệch đã làm hỏng vô ích cả một vòng chẩn đoán.
4. **Serverless là một lớp lỗi riêng mà local không bao giờ tái hiện.** Fire-and-forget sau khi handler return = chết chắc. Muốn chạy nền thì phải neo vào lifecycle của stream.
5. **Đo delta thì phải biết chắc điểm gốc.** "Phí 0.36%" tốn cả một vòng điều tra chỉ vì số dư ban đầu không sạch. Trước khi đo, chốt baseline.
6. **CCTP không mất tiền của bạn.** Burn treo là burn *chờ*, không phải burn *mất*. Attestation nằm đó, gọi `receiveMessage` lúc nào cũng mint được. Biết điều này sớm thì đã bớt hoảng vài ngày.

---

## Còn treo

- Event `confirmed` trên prod hiện có nghĩa **"tx mint đã gửi"**, chưa phải **"đã lên block"** (do `receiveMessage` cố ý không chờ receipt). Client/dashboard cần poll Arc để biết trạng thái cuối. Chưa làm.
- Vercel còn 15+ biến env rác từ thời v1 (`BRIDGE_BACKEND`, `SWAP_ROUTER_*`, `BSC_*`, `PANCAKESWAP_*`…), tất cả đều NOOP. Tính đến 13/08 vẫn chưa dọn — xem `docs/web-sitemap.json` → `envMatrix.deadOnVercel`.
- Fast Transfer thu ~1bps lúc mint, nên merchant nhận **thiếu một chút** so với con số hứa trong README. Muốn đúng tuyệt đối thì phải gross-up (burn thêm phần phí). Chưa làm.

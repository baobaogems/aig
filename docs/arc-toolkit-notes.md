# ARC Toolkit Notes

> Tóm tắt ngắn gọn về ARC Toolkit — trọng tâm: bộ công cụ Agent Runtime Control / ARC CLI Framework.

## 1. Toolkit gồm những gì

- **Đa môi trường (Multi-Runtime):** Tích hợp sẵn adapter cho nhiều nền tảng như Claude Code, Gemini CLI, Codex CLI, OpenClaw và các mô hình lớn (OpenAI, Groq, v.v.).
- **Bộ nhớ & Nhận thức (Cognition):** Hệ thống lưu trữ ngữ cảnh 5 lớp (5-layer context) và tự động xây dựng đồ thị tri thức (Knowledge Graph) để đọc hiểu toàn bộ dự án.
- **Quản lý & Giám sát (Supervision):** Web Dashboard, quản lý danh tính (Profiles & Auth), lập lịch tác vụ (Cron), và các rào chắn bảo mật (Hook pipeline, sandboxing).
- **Lõi hiệu suất cao:** Hoạt động dưới dạng một tệp thực thi duy nhất (single binary) viết bằng Rust, khởi động cực nhanh (<20ms), không phụ thuộc runtime phức tạp.

## 2. CLI commands chính

- `arc init` — Khởi tạo cấu hình ARC cho một codebase mới.
- `arc chat` — Bắt đầu phiên làm việc tương tác trực tiếp với AI agent.
- `arc review` — Triển khai AI tự động đánh giá Pull Request (PR).
- `arc graph index` / `arc graph search` — Lập chỉ mục toàn bộ dự án và tìm kiếm nhanh theo cấu trúc code (hàm, class, type).
- `arc dashboard` — Mở giao diện Web thời gian thực để giám sát agent.

## 3. Cách cài đặt

Cách đơn giản và phổ biến nhất — thông qua npm:

```bash
npm i -g @axiom-labs/arc-cli
```

(Với lõi Rust, nó cũng được biên dịch thành một tệp thực thi tĩnh độc lập, hỗ trợ cài đặt nhanh trên Windows, macOS và Linux mà không cần thư viện bên ngoài.)

## 4. 3 Use cases phổ biến nhất

1. **Viết và chỉnh sửa code tự động:** Chỉ định ARC vào một codebase, người dùng đưa ra yêu cầu và agent tự động lên kế hoạch, lập trình và xác minh các thay đổi.
2. **Phân tích mã nguồn sâu (Code Intelligence):** Dùng các lệnh `arc graph` để quét hàng chục ngôn ngữ, vẽ call graph, tìm mã chết, phân tích rủi ro khi thay đổi code.
3. **Đánh giá PR và Bảo mật:** Trợ lý kiểm duyệt tự động — review code mới để phát hiện lỗ hổng, quét secrets bị lộ trước khi đưa vào dự án.

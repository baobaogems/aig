// legacy-vietnamese-copy.ts — dịch phần nội dung TIẾNG VIỆT đã nằm sẵn trong DB.
//
// Giao diện chốt tiếng Anh (22/09/2026), nhưng các bounty tạo trước mốc đó lưu brief và tiêu
// chí chấm bằng tiếng Việt trong Postgres. Không sửa được dữ liệu đã ký lên chuỗi, nên chỗ
// hiển thị phải dịch. Trước đây mỗi chỗ chép tay một lần .replace() — ba chỗ cho brief, một
// bảng riêng cho rubric — nên sửa một chỗ là lệch ba chỗ còn lại. Gom về đây.
//
// CẢNH BÁO: đây là tra cứu theo NGUYÊN VĂN. Dữ liệu lệch một ký tự là rơi về bản tiếng Việt —
// cố ý: thà hiện tiếng Việt còn hơn hiện một bản dịch đoán mò. Bounty mới phải nhập tiếng Anh
// ngay từ đầu; bảng này chỉ phục vụ dữ liệu cũ và không được nở thêm.

/** Brief của các bounty pilot tháng 8–9. */
const LEGACY_BRIEFS: Record<string, string> = {
  "cho 1 bài văn 500 chữ miêu tả tiềm năng của nền kinh tế AI agent mà Arc đã khởi xướng":
    "Write a 500-word essay describing the potential of the AI agent economy initiated by Arc",
};

/** Tiêu chí chấm đi kèm các bounty đó. */
const LEGACY_CRITERIA: Record<string, string> = {
  "Bài viết dài ít nhất 500 chữ (tiếng Việt).":
    "The essay must be at least 500 words (Vietnamese).",
  "Giới thiệu cụ thể về dự án Arc network / Arbiter tại https://myarbiter.xyz/arbiter, có nêu tên và chức năng dự án.":
    "Give a concrete introduction to Arc Network / Arbiter at https://myarbiter.xyz/arbiter, including the project name and what it does.",
  "Có ít nhất một ví dụ minh họa cụ thể, dễ hiểu về cách dự án hoạt động hoặc được sử dụng.":
    "Include at least one clear, concrete example of how the project works or is used.",
  "Sử dụng giọng văn gần gũi, thân thiện với người dùng (xưng hô/ngôn ngữ đời thường, không hàn lâm).":
    "Use a friendly, everyday tone. No academic jargon.",
  "Nội dung sống động: có yếu tố tạo hình ảnh/cảm xúc như so sánh, ẩn dụ hoặc câu hỏi tương tác.":
    "Make it vivid: use a comparison, metaphor, or a direct question.",
  "Bài viết bằng tiếng Việt và không sao chép nguyên văn hoàn toàn từ trang web nguồn.":
    "Write in Vietnamese. Do not copy the source page verbatim.",
};

/**
 * Brief hiển thị được. Brief cũ nhúng câu tiếng Việt giữa chuỗi nên phải thay từng đoạn,
 * không tra cả chuỗi.
 */
export function displayBrief(brief: string): string {
  let out = brief;
  for (const [vi, en] of Object.entries(LEGACY_BRIEFS)) out = out.split(vi).join(en);
  return out;
}

/** Tiêu chí hiển thị được; không khớp thì giữ nguyên văn. */
export function displayCriterion(criterion: string): string {
  return LEGACY_CRITERIA[criterion] ?? criterion;
}

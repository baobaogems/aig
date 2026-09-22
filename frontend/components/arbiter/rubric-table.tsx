// =============================================================================
// rubric-table.tsx — the criteria and what each one is worth.
//
// One component, two audiences, and the difference is only the sentence above the list:
//   - the poster, previewing criteria they are about to freeze
//   - the worker, reading criteria that are already frozen and cannot move
//
// That second reading is the product. Anyone can promise a fair review; this is the screen
// that lets a worker check the terms BEFORE spending a weekend on the work, and know the
// poster cannot change them afterwards. So it is a server-safe component with no hooks and
// no session: it renders for a stranger who has not connected a wallet.
// =============================================================================

export interface RubricItem {
  item_id: string;
  criterion: string;
  weight: number;
}

const translateCriteria: Record<string, string> = {
  "Bài viết dài ít nhất 500 chữ (tiếng Việt).": "The essay must be at least 500 words (Vietnamese).",
  "Giới thiệu cụ thể về dự án Arc network / Arbiter tại https://myarbiter.xyz/arbiter, có nêu tên và chức năng dự án.": "Give a concrete introduction to Arc Network / Arbiter at https://myarbiter.xyz/arbiter, including the project name and what it does.",
  "Có ít nhất một ví dụ minh họa cụ thể, dễ hiểu về cách dự án hoạt động hoặc được sử dụng.": "Include at least one clear, concrete example of how the project works or is used.",
  "Sử dụng giọng văn gần gũi, thân thiện với người dùng (xưng hô/ngôn ngữ đời thường, không hàn lâm).": "Use a friendly, everyday tone. No academic jargon.",
  "Nội dung sống động: có yếu tố tạo hình ảnh/cảm xúc như so sánh, ẩn dụ hoặc câu hỏi tương tác.": "Make it vivid: use a comparison, metaphor, or a direct question.",
  "Bài viết bằng tiếng Việt và không sao chép nguyên văn hoàn toàn từ trang web nguồn.": "Write in Vietnamese. Do not copy the source page verbatim.",
};

export function RubricTable({ items, frozen }: { items: RubricItem[]; frozen: boolean }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[#444444]">No criteria yet.</p>;
  }

  // Weights are meant to sum to 100. Showing the real total rather than assuming it means a
  // malformed rubric is visible to the person it would hurt, instead of silently mis-scoring.
  const total = items.reduce((sum, r) => sum + r.weight, 0);

  return (
    <div>
      <p className="text-[12px] leading-relaxed m-0" style={{ color: "#444444" }}>
        {frozen
          ? "These criteria were frozen when funds entered escrow. Nobody can change them — not even the poster. This guarantees that the yardstick you start with is the yardstick you finish with."
          : "Approving freezes this rubric. It cannot be edited after that — so the scoring rules cannot change once work has started."}
      </p>

      <ul className="mt-4 m-0 p-0 list-none space-y-3">
        {items.map((r) => (
          <li
            key={r.item_id}
            className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0"
            style={{ borderColor: "#E2E2E2" }}
          >
            <span className="text-[13px] leading-relaxed" style={{ color: "#1A1A1A" }}>{translateCriteria[r.criterion] || r.criterion}</span>
            <span className="a-tnum shrink-0 font-[family-name:var(--font-jetbrains-mono)] text-[12px] font-bold" style={{ color: "#C41E3A" }}>
              {r.weight}%
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 m-0 text-[11px]" style={{ color: "#444444" }}>
        Total weight: <span className="a-tnum font-semibold" style={{ color: "#1A1A1A" }}>{total}%</span>
        {total !== 100 && (
          <span className="text-[#C41E3A]"> — suspicious, should equal 100%</span>
        )}
      </p>
    </div>
  );
}

// =============================================================================
// decision-thresholds.tsx — what happens to the money, in numbers, before you start.
//
// Every number here is READ FROM lib/arbiter/tiers.ts. None is typed into this file.
// That is the whole point: tiers.ts is where the money decision actually lives, and a
// threshold written twice is a threshold that will eventually disagree with itself — on the
// one page whose entire claim is "you can check this yourself".
//
// tiers.ts is pure and imports nothing server-only, so a client component can read it.
// =============================================================================

import { TIER_THRESHOLDS } from "@/lib/arbiter/tiers";

const T = TIER_THRESHOLDS;

export function DecisionThresholds() {
  return (
    <div>
      <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
        Arbiter đề xuất điểm và mức tự tin. Việc quyết định tiền đi đâu thì do mã nguồn tất
        định làm, không phải do model — cùng một verdict luôn cho cùng một kết quả.
      </p>

      <dl className="mt-3 space-y-3">
        <Row
          label="Tự động trả tiền"
          value={`tự tin ≥ ${T.autoReleaseConfidence} VÀ điểm ≥ ${T.autoReleaseScore}`}
          note="Cả hai điều kiện, không phải một. Điểm cao mà không chắc chắn thì vẫn không tự trả."
          accent
        />
        <Row
          label="Chuyển cho người đăng quyết"
          value="mọi trường hợp ở giữa"
          note="Arbiter nói rõ nó nghiêng về bên nào, nhưng không tự quyết. Người đăng bấm duyệt hoặc từ chối, và lựa chọn đó được ghi lại công khai."
        />
        <Row
          label="Trượt"
          value={`điểm < ${T.failScore}`}
          note="Có giải thích từng tiêu chí kèm trích dẫn nguyên văn từ bài nộp."
        />
        <Row
          label="Từ chối chấm"
          value={`tự tin < ${T.refuseConfidence}, hoặc bài không đọc được / lạc đề`}
          note="Arbiter nói thẳng là nó không chấm được, thay vì đoán bừa."
        />
        <Row
          label="Một tiêu chí hỏng hẳn"
          value={`có mục ≤ ${T.splitUnmetAtOrBelow} trong khi mục khác ≥ ${T.splitStrongAtOrAbove} → chặn tự động trả`}
          note={`Mức tự tin bị ép xuống tối đa ${T.splitConfidenceCeiling}, nên việc luôn về tay người đăng. Một yêu cầu bị bỏ hẳn là chuyện của người trả tiền, không phải của máy.`}
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-[var(--color-ink)]/5 pb-3 last:border-0">
      <dt className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
        <span
          className={`tnum font-[family-name:var(--font-jetbrains-mono)] text-xs ${
            accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"
          }`}
        >
          {value}
        </span>
      </dt>
      <dd className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">{note}</dd>
    </div>
  );
}

// not-found.tsx — a bounty id that does not resolve.
//
// Usually a link that has aged out of a chat thread, so the page says which of the two things
// happened and offers the way back, rather than leaving someone on a dead end.

import Link from "next/link";

export default function BountyNotFound() {
  return (
    <main className="bg-grain flex min-h-screen items-center justify-center bg-[var(--color-surface-light)] px-4">
      <div className="max-w-md text-center">
        <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-ink)]">
          Không tìm thấy bounty này
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Mã việc không đúng, hoặc việc này chưa từng được tạo. Link cũ trong nhóm chat đôi khi
          trỏ tới một bản nháp chưa bao giờ được khoá tiền.
        </p>
        <Link
          href="/arbiter"
          className="mt-5 inline-block rounded-[var(--radius-pill)] border border-[var(--color-accent)]/40
                     px-5 py-2 text-sm text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)]"
        >
          Về chợ việc
        </Link>
      </div>
    </main>
  );
}

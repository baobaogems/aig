// not-found.tsx — a bounty id that does not resolve.
//
// Usually a link that has aged out of a chat thread, so the page says which of the two things
// happened and offers the way back, rather than leaving someone on a dead end.
//
// Trang này KHÔNG nằm trong layout của màn Arbiter, nên phải tự mang class .arbiter-ui:
// các token --a-* chỉ tồn tại bên trong class đó, thiếu nó là nền rơi về mặc định tối.

import Link from "next/link";

export default function BountyNotFound() {
  return (
    <main className="arbiter-ui bg-grain flex min-h-screen items-center justify-center bg-[var(--a-bg)] px-4">
      <div className="max-w-md text-center">
        <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--a-text)]">
          Bounty not found
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--a-muted)]">
          Wrong bounty code, or this bounty was never created. Old links in a group chat sometimes
          point at a draft whose funds were never locked.
        </p>
        <Link
          href="/arbiter"
          className="mt-5 inline-block rounded-[var(--radius-pill)] border border-[var(--a-acc)]/40
                     px-5 py-2 text-sm text-[var(--a-acc)] transition-colors hover:border-[var(--a-acc)]"
        >
          Back to the market
        </Link>
      </div>
    </main>
  );
}

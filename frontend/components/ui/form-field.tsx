// form-field.tsx — label, hint and error for one input.
//
// The arbiter forms used placeholders as labels. A placeholder disappears the moment you
// type, so the field loses its own name exactly when you most need to check you are filling
// in the right one — and screen readers get nothing stable to announce. Every field now
// carries a real <label>, an optional format hint, and its error message underneath rather
// than in one shared line at the bottom of the form.

export const FIELD_INPUT_CLASS =
  "w-full rounded-xl border bg-white/80 px-3 py-2 text-sm text-[var(--color-ink)] " +
  "placeholder:text-[var(--color-ink-muted)]/70 outline-none transition-colors";

/** Border colour is the only thing an error changes, so the layout never shifts. */
export function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-[var(--color-ink-danger)] focus:border-[var(--color-ink-danger)]"
    : "border-[var(--color-ink)]/10 focus:border-[var(--color-accent)]";
}

export function FormField({
  id, label, hint, error, children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs" style={{ color: "var(--color-ink-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

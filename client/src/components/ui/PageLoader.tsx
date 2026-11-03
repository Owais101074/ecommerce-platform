export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-ink-500">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900 text-cream shadow-soft">
        <span className="font-display text-2xl leading-none font-semibold">b</span>
        <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-accent-400" />
      </div>
      <p className="text-[11px] font-bold tracking-[0.2em] text-ink-500 uppercase">{label}</p>
    </div>
  );
}

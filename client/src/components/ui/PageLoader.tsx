import { Spinner } from './Spinner';

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-500">
      <Spinner size="lg" className="text-brand-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

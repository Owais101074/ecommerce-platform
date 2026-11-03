import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="surface relative overflow-hidden px-6 py-12 text-center shadow-soft">
      <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
          <TriangleAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{message}</p>
        {onRetry && (
          <Button variant="secondary" className="mt-6" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

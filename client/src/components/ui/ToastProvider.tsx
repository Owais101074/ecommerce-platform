import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { ToastContext, type ToastVariant } from './toast-context';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-brand-200 bg-paper text-ink-800',
  error: 'border-red-200 bg-paper text-ink-800',
  info: 'border-ink-200 bg-paper text-ink-800',
};

const variantIcons: Record<ToastVariant, string> = {
  success: 'text-brand-700',
  error: 'text-red-600',
  info: 'text-ink-500',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = `mt-0.5 h-4 w-4 shrink-0 ${variantIcons[variant]}`;

  if (variant === 'error') {
    return <AlertCircle className={className} aria-hidden="true" />;
  }

  if (variant === 'info') {
    return <Info className={className} aria-hidden="true" />;
  }

  return <CheckCircle2 className={className} aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = (nextId.current += 1);
    setToasts((current) => [...current, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lift ${variantStyles[toast.variant]}`}
          >
            <ToastIcon variant={toast.variant} />
            <p className="leading-snug">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

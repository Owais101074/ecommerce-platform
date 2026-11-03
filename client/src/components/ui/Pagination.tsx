import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageItems(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set(
    [1, totalPages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= totalPages),
  );
  const pages = [...visible].sort((left, right) => left - right);
  const items: (number | 'gap')[] = [];

  pages.forEach((value, index) => {
    const previous = pages[index - 1];

    if (previous !== undefined && value - previous > 1) {
      items.push('gap');
    }

    items.push(value);
  });

  return items;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const baseClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${baseClass} border border-ink-200 bg-paper text-ink-700 hover:border-ink-300 disabled:pointer-events-none disabled:opacity-40`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pageItems(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-ink-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
            className={`${baseClass} ${
              item === page
                ? 'bg-brand-800 text-cream'
                : 'border border-ink-200 bg-paper text-ink-700 hover:border-ink-300'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${baseClass} border border-ink-200 bg-paper text-ink-700 hover:border-ink-300 disabled:pointer-events-none disabled:opacity-40`}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

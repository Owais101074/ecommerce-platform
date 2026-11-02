import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, initials } from '@/lib/format';
import type { Product } from '@/types/catalog';

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge tone="danger">Out of stock</Badge>;
  }

  if (stock <= 10) {
    return <Badge tone="warning">Only {stock} left</Badge>;
  }

  return <Badge tone="success">In stock</Badge>;
}

export function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images[0];

  return (
    <article className="surface surface-shadow group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-ink-100">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-ink-100 to-ink-200 text-3xl font-bold text-ink-400">
            {initials(product.name)}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StockBadge stock={product.stock} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.category && (
          <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
            {product.category.name}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{product.name}</h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-base font-extrabold text-ink-900">{formatPrice(product.price)}</p>
          {product.rating.count > 0 ? (
            <p className="flex items-center gap-1 text-xs font-medium text-ink-500">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-accent-500" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.6Z"
                />
              </svg>
              {product.rating.average.toFixed(1)}
              <span className="text-ink-400">({product.rating.count})</span>
            </p>
          ) : (
            <p className="text-xs text-ink-400">No reviews yet</p>
          )}
        </div>
      </div>
    </article>
  );
}

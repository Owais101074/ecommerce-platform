import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatPrice, initials } from '@/lib/format';
import type { Product } from '@/types/catalog';
import { StockBadge } from './StockBadge';

export function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images[0];

  return (
    <article className="surface group flex flex-col overflow-hidden shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to={`/products/${product.slug}`}
        className="flex h-full flex-col focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-ink-100">
          {image && !imageFailed ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-50 via-ink-50 to-accent-50 font-display text-5xl font-semibold text-brand-800">
              {initials(product.name)}
            </div>
          )}
          <div
            className="absolute inset-0 bg-linear-to-t from-ink-900/25 via-transparent to-transparent opacity-70"
            aria-hidden="true"
          />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <StockBadge stock={product.stock} />
            {product.rating.count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-bold text-ink-800 ring-1 ring-ink-900/5 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-accent-500 text-accent-500" aria-hidden="true" />
                {product.rating.average.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {product.category && (
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent-600 uppercase">
              {product.category.name}
            </p>
          )}
          <h3 className="mt-2 text-[15px] leading-snug font-semibold text-ink-900">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
            {product.description}
          </p>

          <div className="mt-auto pt-5">
            <div className="flex items-end justify-between gap-3 border-t border-ink-100 pt-3.5">
              <p className="text-lg font-bold tracking-tight text-ink-900 tabular-nums">
                {formatPrice(product.price)}
              </p>
              <p className="text-xs font-medium text-ink-500">
                {product.rating.count > 0 ? `${product.rating.count} reviews` : 'No reviews yet'}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Lamp, Laptop, Package, Shirt, type LucideIcon } from 'lucide-react';
import type { Category } from '@/types/catalog';

const tones = [
  {
    card: 'border-brand-200/80 bg-brand-50',
    icon: 'bg-brand-800 text-cream',
    number: 'text-brand-900/10',
    label: 'text-brand-700',
  },
  {
    card: 'border-accent-200/80 bg-accent-50',
    icon: 'bg-accent-600 text-cream',
    number: 'text-accent-900/10',
    label: 'text-accent-700',
  },
  {
    card: 'border-ink-200 bg-ink-100',
    icon: 'bg-ink-800 text-cream',
    number: 'text-ink-900/10',
    label: 'text-ink-700',
  },
] as const;

function iconFor(slug: string): LucideIcon {
  if (slug.includes('electronic')) return Laptop;
  if (slug.includes('fashion')) return Shirt;
  if (slug.includes('home')) return Lamp;
  return Package;
}

export function CategoryCard({ category, index = 0 }: { category: Category; index?: number }) {
  const tone = tones[index % tones.length] ?? tones[0];
  const Icon = iconFor(category.slug);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-soft ${tone.card}`}
    >
      <Link
        to={`/categories/${category.slug}`}
        className="relative block p-6 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-7"
      >
        <span
          className={`absolute -top-2 right-4 font-display text-7xl leading-none font-semibold select-none ${tone.number}`}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="relative">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 ${tone.icon}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink-900">
            {category.name}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-xs text-sm leading-relaxed text-ink-600">
            {category.description ?? 'Browse this department.'}
          </p>

          <div className="mt-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-900/10" aria-hidden="true" />
            <span
              className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] uppercase ${tone.label}`}
            >
              {category.children.length > 0
                ? `${category.children.length} subcategories`
                : 'Shop department'}
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

import type { Category } from '@/types/catalog';

export function CategoryCard({ category }: { category: Category }) {
  return (
    <article className="surface surface-shadow flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
          {category.name.charAt(0).toUpperCase()}
        </span>
        {category.children.length > 0 && (
          <span className="text-xs font-medium text-ink-400">
            {category.children.length} subcategories
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-ink-900">{category.name}</h3>
      <p className="line-clamp-2 text-sm text-ink-500">
        {category.description ?? 'Browse this department.'}
      </p>
    </article>
  );
}

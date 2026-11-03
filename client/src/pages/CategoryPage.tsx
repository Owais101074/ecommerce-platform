import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useCategory } from '@/hooks/useCategory';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProducts';
import type { Category, ProductQuery, ProductSort } from '@/types/catalog';

const PAGE_SIZE = 9;

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
];

const sortValues = new Set(sortOptions.map((option) => option.value));

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseSort(value: string | null): ProductSort {
  return sortValues.has(value as ProductSort) ? (value as ProductSort) : 'newest';
}

function findCategory(nodes: Category[], slug: string): Category | undefined {
  for (const node of nodes) {
    if (node.slug === slug) {
      return node;
    }

    const match = findCategory(node.children, slug);

    if (match) {
      return match;
    }
  }

  return undefined;
}

function flattenCategories(nodes: Category[]): Category[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children)]);
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const categoryQuery = useCategory(slug);
  const categoriesQuery = useCategories();

  const category = categoryQuery.data;
  useDocumentTitle(category?.name ?? 'Department');

  const sort = parseSort(params.get('sort'));
  const page = parsePage(params.get('page'));

  const productQuery = useMemo<ProductQuery>(
    () => ({ category: slug, sort, page, limit: PAGE_SIZE }),
    [slug, sort, page],
  );

  const productsQuery = useProducts(productQuery, { enabled: Boolean(slug) });
  const products = productsQuery.data?.products ?? [];
  const meta = productsQuery.data?.meta;

  const tree = categoriesQuery.data ?? [];
  const node = findCategory(tree, slug);
  const departments = flattenCategories(tree);
  const children = node?.children ?? [];

  function applyParam(updates: Record<string, string | null>): void {
    const next = new URLSearchParams(params);

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    setParams(next, { replace: true });
  }

  if (categoryQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="This department is unavailable"
          message={getErrorMessage(categoryQuery.error)}
          onRetry={() => void categoryQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/products" className={buttonStyles({ variant: 'secondary' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Browse the full catalogue
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Catalogue', to: '/products' },
          { label: category?.name ?? 'Department' },
        ]}
      />

      <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-brand-900 px-7 py-12 text-cream sm:px-12 sm:py-14">
        <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />
        <span
          className="absolute -right-4 -bottom-10 font-display text-[10rem] leading-none font-semibold text-cream/5 select-none"
          aria-hidden="true"
        >
          {category?.name.charAt(0) ?? 'b'}
        </span>

        <div className="relative max-w-2xl">
          {categoryQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 rounded-full bg-cream/20" />
              <Skeleton className="h-14 w-3/4 rounded-xl bg-cream/20" />
              <Skeleton className="h-16 w-full rounded-xl bg-cream/10" />
            </div>
          ) : (
            <>
              <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-300 uppercase">
                <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
                Department
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.02] font-semibold tracking-tight sm:text-5xl">
                {category?.name}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60">
                {category?.description ?? 'A considered corner of the catalogue.'}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3.5 py-1.5 text-xs font-semibold text-cream/80">
                {productsQuery.isPending
                  ? 'Counting the shelves…'
                  : `${meta?.total ?? 0} ${meta?.total === 1 ? 'piece' : 'pieces'} in this department`}
              </p>
            </>
          )}
        </div>
      </section>

      {children.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold tracking-wide text-ink-900">Sub-departments</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  to={`/categories/${child.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-paper px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:text-ink-900"
                >
                  {child.name}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div aria-live="polite">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Everything in {category?.name ?? 'this department'}
          </h2>
          {meta && meta.totalPages > 1 && (
            <p className="mt-1 text-xs text-ink-500">
              Page {meta.page} of {meta.totalPages}
            </p>
          )}
        </div>

        <Select
          label="Sort by"
          value={sort}
          onChange={(event) => applyParam({ sort: event.target.value, page: null })}
          className="w-52"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6">
        {productsQuery.isError ? (
          <ErrorState
            title="This department could not be loaded"
            message={getErrorMessage(productsQuery.error)}
            onRetry={() => void productsQuery.refetch()}
          />
        ) : productsQuery.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[27rem] rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="surface flex flex-col items-center px-6 py-16 text-center shadow-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <PackageSearch className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-2xl font-semibold text-ink-900">
              The shelves are empty
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              Nothing has landed in this department yet. Browse the full catalogue in the meantime.
            </p>
            <Link to="/products" className={`${buttonStyles({ variant: 'secondary' })} mt-6`}>
              See everything
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination
              page={meta?.page ?? page}
              totalPages={meta?.totalPages ?? 0}
              onPageChange={(nextPage) =>
                applyParam({ page: nextPage <= 1 ? null : String(nextPage) })
              }
            />
          </>
        )}
      </div>

      {departments.length > 1 && (
        <section className="mt-16 border-t border-ink-200/80 pt-8">
          <h2 className="text-sm font-bold tracking-wide text-ink-900">Other departments</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {departments
              .filter((department) => department.slug !== slug)
              .map((department) => (
                <li key={department.id}>
                  <Link
                    to={`/categories/${department.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-paper px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-800"
                  >
                    {department.name}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </Container>
  );
}

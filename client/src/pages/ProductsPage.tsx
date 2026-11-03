import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProducts';
import type { ProductQuery, ProductSort } from '@/types/catalog';

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

function toPaise(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed * 100 : undefined;
}

export function ProductsPage() {
  useDocumentTitle('Catalogue');
  const [params, setParams] = useSearchParams();
  const categoriesQuery = useCategories();

  const q = params.get('q')?.trim() ?? '';
  const category = params.get('category') ?? '';
  const minRupees = params.get('min') ?? '';
  const maxRupees = params.get('max') ?? '';
  const rating = params.get('rating') ?? '';
  const inStock = params.get('inStock') === 'true';
  const sort = parseSort(params.get('sort'));
  const page = parsePage(params.get('page'));

  const [searchDraft, setSearchDraft] = useState(q);
  const [minDraft, setMinDraft] = useState(minRupees);
  const [maxDraft, setMaxDraft] = useState(maxRupees);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchDraft(q);
    setMinDraft(minRupees);
    setMaxDraft(maxRupees);
  }, [q, minRupees, maxRupees]);

  const productQuery = useMemo<ProductQuery>(
    () => ({
      q: q || undefined,
      category: category || undefined,
      minPrice: toPaise(minRupees),
      maxPrice: toPaise(maxRupees),
      rating: rating ? Number(rating) : undefined,
      inStock: inStock || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [q, category, minRupees, maxRupees, rating, inStock, sort, page],
  );

  const productsQuery = useProducts(productQuery);
  const products = productsQuery.data?.products ?? [];
  const meta = productsQuery.data?.meta;
  const categories = categoriesQuery.data ?? [];

  const selectedCategory = categories.find((item) => item.slug === category);
  const priceRangeError =
    minDraft && maxDraft && Number(minDraft) > Number(maxDraft)
      ? 'Min price cannot be greater than max price'
      : undefined;

  const activeFilters = [
    q ? { key: 'q', label: `“${q}”`, clear: () => applyParams({ q: null }) } : null,
    category
      ? {
          key: 'category',
          label: selectedCategory?.name ?? category,
          clear: () => applyParams({ category: null }),
        }
      : null,
    minRupees || maxRupees
      ? {
          key: 'price',
          label: `${minRupees ? `₹${minRupees}` : 'Any'} – ${maxRupees ? `₹${maxRupees}` : 'Any'}`,
          clear: () => applyParams({ min: null, max: null }),
        }
      : null,
    rating
      ? {
          key: 'rating',
          label: `${rating}★ and up`,
          clear: () => applyParams({ rating: null }),
        }
      : null,
    inStock
      ? { key: 'inStock', label: 'In stock', clear: () => applyParams({ inStock: null }) }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  function applyParams(updates: Record<string, string | null>, resetPage = true): void {
    const next = new URLSearchParams(params);

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (resetPage && !('page' in updates)) {
      next.delete('page');
    }

    setParams(next, { replace: true });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    applyParams({ q: searchDraft.trim() || null });
  }

  function handlePriceRange(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (priceRangeError) {
      return;
    }

    applyParams({ min: minDraft || null, max: maxDraft || null });
  }

  function clearAll(): void {
    setSearchDraft('');
    setMinDraft('');
    setMaxDraft('');
    setParams(new URLSearchParams(), { replace: true });
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
          <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
          The catalogue
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Every good thing, in one place.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
          Search the edit, narrow it by department, price or rating, and sort it your way. Prices
          are exact and every result comes straight from the API.
        </p>
      </div>

      <form role="search" onSubmit={handleSearch} className="relative mt-8 max-w-2xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          aria-label="Search products"
          placeholder="Search by name or description"
          className="h-14 w-full rounded-full border border-ink-200 bg-paper pr-28 pl-11 text-sm text-ink-900 shadow-[0_1px_0_rgb(28_23_18/0.03)] transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Search"
        >
          Search
        </Button>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalogue-filters"
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-4 py-2.5 text-sm font-semibold text-ink-800"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeFilters.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-800 px-1.5 text-[10px] font-bold text-cream">
              {activeFilters.length}
            </span>
          )}
        </button>

        <Select
          label="Sort by"
          value={sort}
          onChange={(event) => applyParams({ sort: event.target.value })}
          className="w-52"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside
          id="catalogue-filters"
          className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}
          aria-label="Catalogue filters"
        >
          <div className="surface p-5 shadow-soft lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold tracking-wide text-ink-900">Filters</h2>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-accent-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <Select
                label="Department"
                value={category}
                onChange={(event) => applyParams({ category: event.target.value || null })}
              >
                <option value="">All departments</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <form onSubmit={handlePriceRange} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min ₹"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={minDraft}
                    onChange={(event) => setMinDraft(event.target.value)}
                  />
                  <Input
                    label="Max ₹"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={maxDraft}
                    error={priceRangeError}
                    onChange={(event) => setMaxDraft(event.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm" fullWidth>
                  Apply price range
                </Button>
              </form>

              <Select
                label="Rating"
                value={rating}
                onChange={(event) => applyParams({ rating: event.target.value || null })}
              >
                <option value="">Any rating</option>
                <option value="4">4★ and up</option>
                <option value="3">3★ and up</option>
                <option value="2">2★ and up</option>
                <option value="1">1★ and up</option>
              </Select>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 bg-paper px-3.5 py-3 text-sm text-ink-800">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(event) =>
                    applyParams({ inStock: event.target.checked ? 'true' : null })
                  }
                  className="h-4 w-4 rounded border-ink-300 text-brand-800 focus:ring-brand-500"
                />
                In stock only
              </label>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div aria-live="polite">
              <p className="text-sm font-semibold text-ink-900">
                {productsQuery.isPending
                  ? 'Loading the catalogue…'
                  : `${meta?.total ?? 0} ${meta?.total === 1 ? 'product' : 'products'}`}
                {q && !productsQuery.isPending ? ` for “${q}”` : ''}
              </p>
              {meta && meta.totalPages > 1 && (
                <p className="mt-0.5 text-xs text-ink-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
              )}
            </div>

            <Select
              label="Sort by"
              value={sort}
              onChange={(event) => applyParams({ sort: event.target.value })}
              className="hidden w-52 lg:block"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {activeFilters.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <li key={filter.key}>
                  <button
                    type="button"
                    onClick={filter.clear}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-ink-300"
                    aria-label={`Remove filter ${filter.label}`}
                  >
                    {filter.label}
                    <X className="h-3 w-3 text-ink-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1.5 text-xs font-semibold text-accent-600 hover:underline"
                >
                  Clear all
                </button>
              </li>
            </ul>
          )}

          <div className="mt-6">
            {productsQuery.isError ? (
              <ErrorState
                title="The catalogue could not be loaded"
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
                <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
                  No products match
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  Try a broader search, a different department, or clear the filters to see
                  everything in the catalogue.
                </p>
                <Button variant="secondary" className="mt-6" onClick={clearAll}>
                  Clear filters
                </Button>
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
                    applyParams({ page: nextPage <= 1 ? null : String(nextPage) }, false)
                  }
                />
              </>
            )}
          </div>

          {categoriesQuery.isError && (
            <Alert variant="error" title="Departments unavailable">
              {getErrorMessage(categoriesQuery.error)}
            </Alert>
          )}
        </div>
      </div>
    </Container>
  );
}

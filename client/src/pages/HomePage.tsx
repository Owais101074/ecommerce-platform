import { Link } from 'react-router-dom';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { CategoryCard } from '@/components/product/CategoryCard';
import { ProductCard } from '@/components/product/ProductCard';
import { Alert } from '@/components/ui/Alert';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProducts';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium tracking-wide text-ink-300 uppercase">{label}</p>
    </div>
  );
}

export function HomePage() {
  useDocumentTitle();
  const { status } = useAuth();
  const categoriesQuery = useCategories();
  const productsQuery = useProducts({ limit: 4, sort: 'newest' });

  const categories = categoriesQuery.data ?? [];
  const featuredProducts = productsQuery.data?.products ?? [];

  return (
    <Container className="py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white">
        <div className="hero-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-100 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              New season · {new Date().getFullYear()}
            </span>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
              Everyday essentials, thoughtfully picked.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-300">
              A storefront built phase by phase: real authentication, a searchable catalogue and
              exact paise pricing — all served by one typed REST API.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {status === 'authenticated' ? (
                <Link to="/account" className={buttonStyles({ size: 'lg' })}>
                  Go to your account
                </Link>
              ) : (
                <>
                  <Link to="/register" className={buttonStyles({ size: 'lg' })}>
                    Create your account
                  </Link>
                  <Link to="/login" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Products online"
              value={productsQuery.data ? String(productsQuery.data.meta.total) : '—'}
            />
            <StatCard
              label="Departments"
              value={categoriesQuery.data ? String(categories.length) : '—'}
            />
            <StatCard label="Access token" value="15 min" />
            <StatCard label="Session" value="7 days" />
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase">
              Shop by category
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">
              Departments worth browsing
            </h2>
          </div>
          {categories.length > 0 && (
            <p className="text-sm text-ink-500">{categories.length} departments live</p>
          )}
        </div>

        <div className="mt-6">
          {categoriesQuery.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-36" />
              ))}
            </div>
          ) : categoriesQuery.isError ? (
            <Alert variant="error" title="Categories could not be loaded">
              {getErrorMessage(categoriesQuery.error)}
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase">
              New arrivals
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">
              Fresh in the catalogue
            </h2>
          </div>
          {productsQuery.data && (
            <p className="text-sm text-ink-500">
              Showing {featuredProducts.length} of {productsQuery.data.meta.total}
            </p>
          )}
        </div>

        <div className="mt-6">
          {productsQuery.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-80" />
              ))}
            </div>
          ) : productsQuery.isError ? (
            <ErrorState
              title="The catalogue is unavailable"
              message={getErrorMessage(productsQuery.error)}
              onRetry={() => void productsQuery.refetch()}
            />
          ) : featuredProducts.length === 0 ? (
            <div className="surface px-6 py-12 text-center text-sm text-ink-500">
              The catalogue is empty. Run <code className="font-mono">npm run seed:catalog</code> in
              the server to load sample data.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}

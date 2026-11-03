import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GitBranch,
  IndianRupee,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { CategoryCard } from '@/components/product/CategoryCard';
import { ProductCard } from '@/components/product/ProductCard';
import { Alert } from '@/components/ui/Alert';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types/catalog';

const benefits = [
  {
    icon: Sparkles,
    title: 'Considered edit',
    copy: 'A short list of useful pieces.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure sessions',
    copy: 'Rotating, httpOnly refresh tokens.',
  },
  {
    icon: IndianRupee,
    title: 'Exact pricing',
    copy: 'Stored in paise, shown in INR.',
  },
  {
    icon: GitBranch,
    title: 'Built in public',
    copy: 'Fourteen phases, documented.',
  },
];

const principles = [
  {
    title: 'Considered',
    copy: 'A short list of useful pieces, not an endless feed.',
  },
  {
    title: 'Clear',
    copy: 'Prices are exact — stored in paise, shown in rupees.',
  },
  {
    title: 'Secure',
    copy: 'Refresh tokens rotate and never sit in browser storage.',
  },
];

function HeroVisual({ product }: { product?: Product }) {
  const [failed, setFailed] = useState(false);
  const image = product?.images[0];
  const showImage = Boolean(image && !failed);

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="absolute top-6 -left-2 h-24 w-24 rounded-full bg-accent-300/80 sm:-left-6 sm:h-28 sm:w-28"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-6 hidden h-40 w-40 rounded-full border border-brand-900/10 sm:block"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-6 left-10 h-32 w-32 rounded-full border border-accent-400/30"
        aria-hidden="true"
      />

      <div className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden rounded-t-[12rem] rounded-b-[2rem] bg-brand-100 ring-1 ring-brand-900/10">
        {showImage ? (
          <img
            src={image}
            alt={product?.name ?? 'Featured product'}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover saturate-[0.92]"
          />
        ) : (
          <>
            <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 text-brand-800">
              <span className="font-display text-7xl font-semibold">b</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                The Bazaar edit
              </span>
            </div>
          </>
        )}
        <div
          className="absolute inset-0 bg-linear-to-t from-ink-900/35 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="absolute -bottom-6 -left-1 w-56 rounded-2xl border border-ink-200/80 bg-paper/95 p-4 shadow-lift backdrop-blur-sm sm:left-0">
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-accent-600 uppercase">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          New in
        </p>
        <p className="mt-1.5 line-clamp-1 font-display text-lg font-semibold text-ink-900">
          {product?.name ?? 'The Bazaar edit'}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {product ? formatPrice(product.price) : 'Coming soon'}
          </p>
          {product && product.rating.count > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-600">
              <Star className="h-3 w-3 fill-accent-500 text-accent-500" aria-hidden="true" />
              {product.rating.average.toFixed(1)}
            </span>
          ) : (
            <span className="text-[11px] text-ink-400">Just landed</span>
          )}
        </div>
      </div>

      <div className="absolute top-10 right-0 hidden rounded-full border border-ink-900/10 bg-paper/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-ink-600 uppercase shadow-soft backdrop-blur-sm sm:block">
        {product?.category?.name ?? 'Curated'}
      </div>
    </div>
  );
}

export function HomePage() {
  useDocumentTitle();
  const { status, user } = useAuth();
  const categoriesQuery = useCategories();
  const productsQuery = useProducts({ limit: 4, sort: 'newest' });

  const categories = categoriesQuery.data ?? [];
  const featuredProducts = productsQuery.data?.products ?? [];
  const year = new Date().getFullYear();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-accent-100/60 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative grid gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-ink-600 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              The Bazaar edit · {year}
            </p>

            <h1 className="mt-6 font-display text-[3.25rem] leading-[0.95] font-semibold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
              Everyday essentials,
              <span className="mt-2 block text-brand-800 italic">thoughtfully picked.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600">
              A small, considered catalogue of useful things — served by one typed REST API and
              priced exactly, down to the paisa.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/products" className={buttonStyles({ size: 'lg' })}>
                Shop the catalogue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {status === 'authenticated' ? (
                <Link to="/account" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                  Your account
                </Link>
              ) : (
                <Link to="/register" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                  Create account
                </Link>
              )}
            </div>

            <p className="mt-8 flex items-center gap-2 text-xs text-ink-500">
              <span className="h-px w-8 bg-ink-300" aria-hidden="true" />
              No noise. Just a short list of good things.
            </p>
          </div>

          <div className="reveal-2 animate-rise">
            <HeroVisual product={featuredProducts[0]} />
          </div>
        </Container>
      </section>

      <section className="border-y border-ink-200/70 bg-paper/60">
        <Container className="grid sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, copy }, index) => (
            <div
              key={title}
              className={`flex items-start gap-3 border-b border-ink-200/60 py-6 last:border-b-0 sm:border-b-0 lg:px-6 ${
                index > 0 ? 'lg:border-l lg:border-ink-200/60' : ''
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{copy}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <Container>
        <section id="categories" className="mt-20 scroll-mt-28">
          <SectionHeading
            eyebrow="01 — Departments"
            title="Shop the departments"
            description="Three small departments, each holding only what earns its place."
            action={
              <Link to="/products" className="font-semibold text-brand-800 hover:underline">
                Shop all departments
              </Link>
            }
          />

          <div className="mt-8">
            {categoriesQuery.isPending ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-56 rounded-3xl" />
                ))}
              </div>
            ) : categoriesQuery.isError ? (
              <Alert variant="error" title="Categories could not be loaded">
                {getErrorMessage(categoriesQuery.error)}
              </Alert>
            ) : categories.length === 0 ? (
              <div className="surface px-6 py-12 text-center text-sm text-ink-500 shadow-soft">
                No departments yet. Run{' '}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">
                  npm run seed:catalog
                </code>{' '}
                in the server to load the sample catalogue.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-7 py-14 text-cream sm:px-12 lg:px-16">
            <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
            <div
              className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-300 uppercase">
                  <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
                  The idea
                </p>
                <h2 className="mt-4 font-display text-4xl leading-[1.02] font-semibold sm:text-5xl">
                  Fewer things.
                  <br />
                  <span className="text-accent-200 italic">Better chosen.</span>
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/60">
                  Bazaar is a study in building a storefront properly — typed end to end, honest
                  about every price, and careful with every session. The catalogue stays small on
                  purpose.
                </p>
              </div>

              <ul>
                {principles.map((principle, index) => (
                  <li
                    key={principle.title}
                    className="flex gap-5 border-t border-cream/10 py-5 first:border-t-0 first:pt-0"
                  >
                    <span className="font-display text-sm font-semibold text-accent-300">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-cream">{principle.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-cream/55">{principle.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="new-arrivals" className="mt-20 scroll-mt-28">
          <SectionHeading
            eyebrow="02 — New in"
            title="Fresh from the catalogue"
            description="The latest pieces to land in the warehouse, sorted newest first."
            action={
              <Link
                to="/products?sort=newest"
                className="font-semibold text-brand-800 hover:underline"
              >
                View all new arrivals
              </Link>
            }
          />

          <div className="mt-8">
            {productsQuery.isPending ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-[27rem] rounded-2xl" />
                ))}
              </div>
            ) : productsQuery.isError ? (
              <ErrorState
                title="The catalogue is unavailable"
                message={getErrorMessage(productsQuery.error)}
                onRetry={() => void productsQuery.refetch()}
              />
            ) : featuredProducts.length === 0 ? (
              <div className="surface flex flex-col items-center px-6 py-14 text-center shadow-soft">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold text-ink-900">
                  The shelves are empty
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  Run{' '}
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs">
                    npm run seed:catalog
                  </code>{' '}
                  in the server folder to load the sample catalogue.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-ink-200/80 bg-paper px-7 py-12 shadow-soft sm:px-12">
            <div
              className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-accent-100/70 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
                  Your account
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">
                  {status === 'authenticated' && user
                    ? `Welcome back, ${user.name.split(' ')[0]}.`
                    : 'A place for your details.'}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
                  One account for your profile today, and for carts, orders and saved items as the
                  platform grows.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                {status === 'authenticated' ? (
                  <Link to="/account" className={buttonStyles()}>
                    Go to account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className={buttonStyles()}>
                      Create account
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link to="/login" className={buttonStyles({ variant: 'secondary' })}>
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}

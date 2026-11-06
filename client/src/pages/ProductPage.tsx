import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  PackageCheck,
  RotateCcw,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { Container } from '@/components/layout/Container';
import { AddToCartButton, WishlistButton } from '@/components/product/ProductActions';
import { ProductCard } from '@/components/product/ProductCard';
import { StockBadge } from '@/components/product/StockBadge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProduct } from '@/hooks/useProduct';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice, initials } from '@/lib/format';

const serviceNotes: { icon: LucideIcon; title: string; copy: string }[] = [
  {
    icon: Truck,
    title: 'Dispatched in 24 hours',
    copy: 'Orders leave the warehouse on the next working day.',
  },
  {
    icon: RotateCcw,
    title: '14-day returns',
    copy: 'Unused pieces can go back for a full refund.',
  },
  {
    icon: PackageCheck,
    title: 'Checked before packing',
    copy: 'Every item is inspected and packed by hand.',
  },
];

function RatingStars({ average }: { average: number }) {
  const filled = Math.round(average);

  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < filled ? 'fill-accent-500 text-accent-500' : 'text-ink-300'
          }`}
        />
      ))}
    </span>
  );
}

export function ProductPage() {
  const { slug = '' } = useParams();
  const productQuery = useProduct(slug);
  const product = productQuery.data;
  useDocumentTitle(product?.name ?? 'Product');

  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveIndex(0);
    setImageFailed(false);
    setQuantity(1);
  }, [product?.id]);

  const relatedQuery = useProducts(
    { category: product?.category?.slug, limit: 4, sort: 'newest' },
    { enabled: Boolean(product?.category?.slug) },
  );

  const images = product?.images ?? [];
  const activeImage = images[activeIndex] ?? images[0];
  const related = (relatedQuery.data?.products ?? [])
    .filter((item) => item.id !== product?.id)
    .slice(0, 3);

  if (productQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="This product is unavailable"
          message={getErrorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/products" className={buttonStyles({ variant: 'secondary' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the catalogue
          </Link>
        </div>
      </Container>
    );
  }

  if (productQuery.isPending || !product) {
    return (
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-4 w-64 rounded-full" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="aspect-[4/5] rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-12 w-4/5 rounded-xl" />
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Catalogue', to: '/products' },
            ...(product.category
              ? [{ label: product.category.name, to: `/categories/${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-7 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-100 ring-1 ring-ink-200/70">
              {activeImage && !imageFailed ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-50 via-ink-50 to-accent-50 font-display text-7xl font-semibold text-brand-800">
                  {initials(product.name)}
                </div>
              )}
              <div className="absolute top-4 left-4">
                <StockBadge stock={product.stock} />
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-3" role="group" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setImageFailed(false);
                    }}
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    aria-pressed={index === activeIndex}
                    className={`relative h-20 w-16 overflow-hidden rounded-xl border-2 bg-ink-100 transition ${
                      index === activeIndex
                        ? 'border-brand-700'
                        : 'border-transparent hover:border-ink-300'
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.category && (
              <Link
                to={`/categories/${product.category.slug}`}
                className="text-[11px] font-bold tracking-[0.18em] text-accent-600 uppercase transition hover:text-accent-700"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-ink-900 sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {product.rating.count > 0 ? (
                <>
                  <span className="flex items-center gap-2">
                    <RatingStars average={product.rating.average} />
                    <span className="text-sm font-semibold text-ink-800">
                      {product.rating.average.toFixed(1)}
                    </span>
                  </span>
                  <span className="text-sm text-ink-500">
                    {product.rating.count} {product.rating.count === 1 ? 'rating' : 'ratings'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-ink-500">No ratings yet</span>
              )}
              <span className="hidden h-4 w-px bg-ink-200 sm:block" aria-hidden="true" />
              <span className="text-sm text-ink-500">
                {product.stock > 0 ? `${product.stock} in the warehouse` : 'Restocking soon'}
              </span>
            </div>

            <p className="mt-6 text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1 text-xs text-ink-500">Inclusive of all taxes.</p>

            <p className="mt-6 border-t border-ink-200/80 pt-6 text-sm leading-relaxed text-ink-600">
              {product.description}
            </p>

            <ul className="mt-6 space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-ink-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                {product.stock > 0
                  ? 'Ready to ship from our warehouse'
                  : 'Save it to your wishlist and check back soon'}
              </li>
              <li className="flex items-start gap-2.5 text-sm text-ink-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                Free returns within 14 days of delivery
              </li>
            </ul>

            <div className="mt-6 rounded-2xl border border-ink-200/80 bg-paper/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                {product.stock > 0 && (
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    max={Math.min(10, product.stock)}
                    size="md"
                    label="Quantity"
                  />
                )}
                <AddToCartButton
                  product={product}
                  quantity={quantity}
                  size="lg"
                  className="min-w-44 flex-1"
                />
                <WishlistButton product={product} size="md" />
              </div>
              <p className="mt-3 text-xs text-ink-500">
                {product.stock > 0
                  ? `Add up to ${Math.min(10, product.stock)} to your cart. Wishlist items stay saved to your account.`
                  : 'This piece is out of stock. Save it to your wishlist and check back soon.'}
              </p>
            </div>

            <dl className="mt-9 grid gap-4 border-t border-ink-200/80 pt-7 sm:grid-cols-3">
              {serviceNotes.map(({ icon: Icon, title, copy }) => (
                <div key={title}>
                  <Icon className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <dt className="mt-2 text-xs font-semibold text-ink-900">{title}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-ink-500">{copy}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>

      {product.category && (
        <Container className="pb-16 sm:pb-20">
          <SectionHeading
            eyebrow="More in this department"
            title={`Also in ${product.category.name}`}
            action={
              <Link
                to={`/categories/${product.category.slug}`}
                className="font-semibold text-brand-800 hover:underline"
              >
                View the department
              </Link>
            }
          />

          <div className="mt-8">
            {relatedQuery.isPending ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-[27rem] rounded-2xl" />
                ))}
              </div>
            ) : related.length === 0 ? (
              <p className="surface px-6 py-10 text-center text-sm text-ink-500 shadow-soft">
                This piece is the only one in {product.category.name} right now.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            )}
          </div>
        </Container>
      )}
    </>
  );
}

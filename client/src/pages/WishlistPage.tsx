import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/product/ProductCard';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useWishlist } from '@/hooks/useWishlist';

export function WishlistPage() {
  useDocumentTitle('Wishlist');
  const wishlistQuery = useWishlist();
  const products = wishlistQuery.data ?? [];

  if (wishlistQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[29rem] rounded-2xl" />
          ))}
        </div>
      </Container>
    );
  }

  if (wishlistQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Your wishlist could not be loaded"
          message={getErrorMessage(wishlistQuery.error)}
          onRetry={() => void wishlistQuery.refetch()}
        />
      </Container>
    );
  }

  if (products.length === 0) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="surface mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <Heart className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900">
            Nothing saved yet.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Tap the heart on any product to keep it here. Saved items stay with your account across
            devices.
          </p>
          <Link to="/products" className={`${buttonStyles({ size: 'lg' })} mt-7`}>
            Find something to save
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Saved for later
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your wishlist.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'} saved to your account.
          </p>
        </div>

        <Link to="/products" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          Keep browsing
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}

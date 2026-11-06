import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { formatPrice, initials } from '@/lib/format';
import type { CartItem } from '@/types/cart';

interface CartRowProps {
  item: CartItem;
  updating: boolean;
  removing: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

function CartRow({ item, updating, removing, onQuantityChange, onRemove }: CartRowProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { product, quantity } = item;
  const image = product.images[0];
  const shortOnStock = quantity > product.stock;
  const maxQuantity = Math.min(10, Math.max(product.stock, 1));

  return (
    <article className="surface flex gap-4 p-4 shadow-soft sm:gap-5 sm:p-5">
      <Link
        to={`/products/${product.slug}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-200/70 sm:h-28 sm:w-28"
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-50 via-ink-50 to-accent-50 font-display text-2xl font-semibold text-brand-800">
            {initials(product.name)}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.category && (
              <p className="text-[10px] font-bold tracking-[0.16em] text-accent-600 uppercase">
                {product.category.name}
              </p>
            )}
            <Link
              to={`/products/${product.slug}`}
              className="mt-1 block truncate text-sm font-semibold text-ink-900 transition hover:text-brand-800"
            >
              {product.name}
            </Link>
            <p className="mt-1 text-xs text-ink-500">
              {formatPrice(item.priceAtAdd)} each
              {product.price !== item.priceAtAdd && (
                <span className="ml-2 text-accent-600">now {formatPrice(product.price)}</span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove ${product.name} from cart`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {shortOnStock && (
          <p className="mt-2 text-xs font-medium text-red-600">
            Only {product.stock} left in stock. Lower the quantity to continue.
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <QuantityStepper
            value={quantity}
            onChange={onQuantityChange}
            max={maxQuantity}
            disabled={updating || product.stock === 0}
            label={`Quantity for ${product.name}`}
          />
          <p className="text-sm font-bold text-ink-900 tabular-nums">
            {formatPrice(item.lineTotal)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function CartPage() {
  useDocumentTitle('Cart');
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!confirmClear) {
      return;
    }

    const timer = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const cart = cartQuery.data;

  if (cartQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="mt-4 h-12 w-72 rounded-xl" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (cartQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Your cart could not be loaded"
          message={getErrorMessage(cartQuery.error)}
          onRetry={() => void cartQuery.refetch()}
        />
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="surface mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900">
            Your cart is empty.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            A few good things are waiting in the catalogue. Add something you will actually use.
          </p>
          <Link to="/products" className={`${buttonStyles({ size: 'lg' })} mt-7`}>
            Browse the catalogue
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
            Your selection
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your cart.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {cart.itemCount} {cart.itemCount === 1 ? 'piece' : 'pieces'} in your bag.
          </p>
        </div>

        <Link to="/products" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Keep shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section aria-label="Cart items" className="space-y-4">
          {cart.priceChanged && (
            <Alert variant="info" title="Prices have changed">
              Your cart keeps the price from the moment each item was added. Checkout will confirm
              the final amount.
            </Alert>
          )}

          {cart.items.map((item) => (
            <CartRow
              key={item.product.id}
              item={item}
              updating={
                updateMutation.isPending && updateMutation.variables?.productId === item.product.id
              }
              removing={removeMutation.isPending && removeMutation.variables === item.product.id}
              onQuantityChange={(quantity) =>
                updateMutation.mutate({ productId: item.product.id, quantity })
              }
              onRemove={() => removeMutation.mutate(item.product.id)}
            />
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              to="/products"
              className="text-sm font-semibold text-brand-800 transition hover:underline"
            >
              Continue shopping
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (confirmClear ? clearMutation.mutate() : setConfirmClear(true))}
              loading={clearMutation.isPending}
            >
              {confirmClear ? 'Click again to clear' : 'Clear cart'}
            </Button>
          </div>
        </section>

        <aside className="lg:sticky lg:top-28">
          <div className="surface p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Order summary</h2>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Items</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">{cart.itemCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {formatPrice(cart.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="text-xs font-medium text-ink-500">Calculated at checkout</dd>
              </div>
              {cart.priceChanged && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-500">Current catalogue total</dt>
                  <dd className="font-medium text-accent-600 tabular-nums">
                    {formatPrice(cart.currentSubtotal)}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink-200/80 pt-5">
              <p className="text-sm font-semibold text-ink-900">Total</p>
              <p className="text-2xl font-bold text-ink-900 tabular-nums">
                {formatPrice(cart.subtotal)}
              </p>
            </div>

            <Link
              to="/checkout"
              className={`${buttonStyles({ size: 'lg', fullWidth: true })} mt-5`}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Proceed to checkout
            </Link>

            <p className="mt-3 text-center text-xs leading-relaxed text-ink-500">
              Choose a delivery address and review shipping on the next step.
            </p>

            <p className="mt-5 flex items-start gap-2 border-t border-ink-200/80 pt-4 text-[11px] leading-relaxed text-ink-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden="true" />
              Prices are stored in integer paise and locked to the moment each item was added.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

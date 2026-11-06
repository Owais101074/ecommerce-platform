import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, MapPin, Plus, ShoppingBag, Truck } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { AddressForm } from '@/components/address/AddressForm';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAddresses, useCreateAddress } from '@/hooks/useAddresses';
import { useCart } from '@/hooks/useCart';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCheckoutQuote, usePlaceOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import type { AddressInput } from '@/types/address';

function CheckoutSkeleton() {
  return (
    <Container className="py-12 sm:py-16">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-4 h-12 w-56 rounded-xl" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </Container>
  );
}

export function CheckoutPage() {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const cartQuery = useCart();
  const addressesQuery = useAddresses();
  const createAddress = useCreateAddress();
  const placeOrder = usePlaceOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);

  const cart = cartQuery.data;
  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const hasItems = Boolean(cart && cart.items.length > 0);
  const quoteQuery = useCheckoutQuote(hasItems);

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }

    const stillExists = addresses.some((address) => address.id === selectedAddressId);

    if (!stillExists) {
      const fallback = addresses.find((address) => address.isDefault) ?? addresses[0];
      setSelectedAddressId(fallback?.id ?? null);
    }
  }, [addresses, selectedAddressId]);

  async function handleCreateAddress(input: AddressInput): Promise<void> {
    const nextAddresses = await createAddress.mutateAsync(input);
    const preferred = nextAddresses.find((address) => address.isDefault) ?? nextAddresses[0];

    if (preferred) {
      setSelectedAddressId(preferred.id);
    }

    setAddingAddress(false);
  }

  async function handlePlaceOrder(): Promise<void> {
    if (!selectedAddressId) {
      return;
    }

    const order = await placeOrder.mutateAsync({ addressId: selectedAddressId });
    navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
  }

  if (cartQuery.isPending || addressesQuery.isPending) {
    return <CheckoutSkeleton />;
  }

  if (cartQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Checkout could not be loaded"
          message={getErrorMessage(cartQuery.error)}
          onRetry={() => void cartQuery.refetch()}
        />
      </Container>
    );
  }

  if (addressesQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Your addresses could not be loaded"
          message={getErrorMessage(addressesQuery.error)}
          onRetry={() => void addressesQuery.refetch()}
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
            Nothing to check out.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Add something to your cart first, then come back to choose an address and place the
            order.
          </p>
          <Link to="/products" className={`${buttonStyles({ size: 'lg' })} mt-7`}>
            Browse the catalogue
          </Link>
        </div>
      </Container>
    );
  }

  if (quoteQuery.isPending) {
    return <CheckoutSkeleton />;
  }

  const quote = quoteQuery.data;
  const canPlaceOrder =
    Boolean(selectedAddressId) && Boolean(quote) && !quoteQuery.isError && !placeOrder.isPending;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Final step
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Checkout.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Confirm where it goes, review the totals, and place the order.
          </p>
        </div>

        <Link to="/cart" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to cart
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-6">
          <section aria-label="Delivery address" className="surface p-6 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-900">
                    Delivery address
                  </h2>
                  <p className="text-xs text-ink-500">Saved addresses on your account.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/addresses" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                  Manage
                </Link>
                {!addingAddress && (
                  <Button size="sm" variant="secondary" onClick={() => setAddingAddress(true)}>
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add new
                  </Button>
                )}
              </div>
            </div>

            {addresses.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-paper/70 p-6 text-center">
                <p className="text-sm font-medium text-ink-800">No address saved yet.</p>
                <p className="mt-1 text-xs text-ink-500">
                  Add one below to continue with this order.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {addresses.map((address) => {
                  const selected = address.id === selectedAddressId;

                  return (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                        selected
                          ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-500/15'
                          : 'border-ink-200 bg-paper hover:border-ink-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-address"
                        value={address.id}
                        checked={selected}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 h-4 w-4 accent-brand-800"
                      />
                      <span className="min-w-0 text-sm leading-relaxed text-ink-600">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900">{address.label}</span>
                          {address.isDefault && <Badge tone="success">Default</Badge>}
                        </span>
                        <span className="mt-1 block font-medium text-ink-900">
                          {address.fullName} · {address.phone}
                        </span>
                        <span className="mt-1 block">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}
                        </span>
                        <span className="block">
                          {address.city}, {address.state} {address.pincode}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {addingAddress && (
              <div className="mt-6 border-t border-ink-200/80 pt-6">
                <h3 className="font-display text-lg font-semibold text-ink-900">New address</h3>
                <p className="mt-1 text-xs text-ink-500">
                  It will be saved to your account and selected for this order.
                </p>
                <div className="mt-4">
                  <AddressForm
                    onSubmit={handleCreateAddress}
                    onCancel={() => setAddingAddress(false)}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Delivery</h2>
                <p className="text-xs text-ink-500">Standard shipping, dispatched in 24 hours.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Shipping is free on orders of {formatPrice(99_900)} or more, otherwise{' '}
              {formatPrice(4_900)}. The server recalculates these totals again when the order is
              placed.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="surface p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Order summary</h2>

            {quoteQuery.isError ? (
              <div className="mt-5">
                <Alert variant="error" title="Totals unavailable">
                  {getErrorMessage(quoteQuery.error)}
                </Alert>
              </div>
            ) : quote ? (
              <>
                {quote.priceChanged && (
                  <div className="mt-5">
                    <Alert variant="info" title="Prices have changed">
                      Your cart keeps the price from the moment each item was added. These totals
                      use that locked price.
                    </Alert>
                  </div>
                )}

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-500">Items</dt>
                    <dd className="font-semibold text-ink-900 tabular-nums">{quote.itemCount}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-500">Subtotal</dt>
                    <dd className="font-semibold text-ink-900 tabular-nums">
                      {formatPrice(quote.subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-500">Shipping</dt>
                    <dd className="font-semibold text-ink-900 tabular-nums">
                      {quote.shipping === 0 ? 'Free' : formatPrice(quote.shipping)}
                    </dd>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-ink-500">Discount</dt>
                      <dd className="font-semibold text-brand-700 tabular-nums">
                        −{formatPrice(quote.discount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 text-xs text-ink-500">
                    <dt>Includes GST (18%)</dt>
                    <dd className="tabular-nums">{formatPrice(quote.tax)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink-200/80 pt-5">
                  <p className="text-sm font-semibold text-ink-900">Total</p>
                  <p className="text-2xl font-bold text-ink-900 tabular-nums">
                    {formatPrice(quote.total)}
                  </p>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  className="mt-5"
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder}
                  loading={placeOrder.isPending}
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Place order
                </Button>

                {!selectedAddressId && (
                  <p className="mt-3 text-center text-xs text-accent-700">
                    Choose a delivery address to continue.
                  </p>
                )}

                <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-ink-500">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700"
                    aria-hidden="true"
                  />
                  Payment is collected in Phase 8. This order is recorded with payment pending.
                </p>
              </>
            ) : null}

            <p className="mt-5 flex items-start gap-2 border-t border-ink-200/80 pt-4 text-[11px] leading-relaxed text-ink-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden="true" />
              Totals are computed on the server in integer paise. The client never sends a price.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

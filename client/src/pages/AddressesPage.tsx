import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { AddressCard } from '@/components/address/AddressCard';
import { AddressForm } from '@/components/address/AddressForm';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useAddresses,
  useCreateAddress,
  useRemoveAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '@/hooks/useAddresses';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { AddressInput } from '@/types/address';

export function AddressesPage() {
  useDocumentTitle('Address book');
  const addressesQuery = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const removeMutation = useRemoveAddress();
  const defaultMutation = useSetDefaultAddress();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addresses = addressesQuery.data ?? [];
  const editing = addresses.find((address) => address.id === editingId) ?? null;

  async function handleCreate(input: AddressInput): Promise<void> {
    await createMutation.mutateAsync(input);
    setAdding(false);
  }

  async function handleUpdate(input: AddressInput): Promise<void> {
    if (!editing) {
      return;
    }

    await updateMutation.mutateAsync({ id: editing.id, input });
    setEditingId(null);
  }

  if (addressesQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </Container>
    );
  }

  if (addressesQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Your address book could not be loaded"
          message={getErrorMessage(addressesQuery.error)}
          onRetry={() => void addressesQuery.refetch()}
        />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Delivery
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Address book.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-500">
            Saved delivery addresses are reused at checkout. Orders keep their own copy, so editing
            an address later never changes an old order.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/account" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Account
          </Link>
          {!adding && !editing && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add address
            </Button>
          )}
        </div>
      </div>

      {(adding || editing) && (
        <section className="surface mt-8 p-6 shadow-soft sm:p-7">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            {editing ? `Edit ${editing.label.toLowerCase()} address` : 'New address'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {editing
              ? 'Changes apply to future checkouts only.'
              : 'The first address you add becomes your default.'}
          </p>

          <div className="mt-6">
            <AddressForm
              key={editing?.id ?? 'new'}
              initial={editing ?? undefined}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {
                setAdding(false);
                setEditingId(null);
              }}
            />
          </div>
        </section>
      )}

      {addresses.length === 0 ? (
        <div className="surface mt-8 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MapPin className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">
            No addresses yet.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Add a delivery address now, or create one during checkout.
          </p>
          {!adding && (
            <Button className="mt-6" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add your first address
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => {
                setAdding(false);
                setEditingId(address.id);
              }}
              onDelete={() => {
                removeMutation.mutate(address.id);
                if (editingId === address.id) {
                  setEditingId(null);
                }
              }}
              onSetDefault={() => defaultMutation.mutate(address.id)}
              deleting={removeMutation.isPending && removeMutation.variables === address.id}
              settingDefault={defaultMutation.isPending && defaultMutation.variables === address.id}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

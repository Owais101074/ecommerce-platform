import { useState, type FormEvent } from 'react';
import { Pencil, Plus, TicketPercent, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from '@/hooks/useCoupons';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPrice } from '@/lib/format';
import type { Coupon, CouponType } from '@/types/coupon';

type ActiveFilter = '' | 'true' | 'false';

const activeFilters: { value: ActiveFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

interface CouponFormState {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrder: string;
  maxDiscount: string;
  startsAt: string;
  expiresAt: string;
  maxUses: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponFormState = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrder: '0',
  maxDiscount: '',
  startsAt: '',
  expiresAt: '',
  maxUses: '',
  isActive: true,
};

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function discountLabel(coupon: Coupon): string {
  if (coupon.type === 'percentage') {
    return coupon.maxDiscount
      ? `${coupon.value}% up to ${formatPrice(coupon.maxDiscount)}`
      : `${coupon.value}%`;
  }

  return formatPrice(coupon.value);
}

export function AdminCouponsPage() {
  useDocumentTitle('Admin coupons');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ActiveFilter>('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const couponsQuery = useAdminCoupons({
    page,
    limit: 10,
    search: search || undefined,
    active: active || undefined,
  });
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(coupon: Coupon): void {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? '',
      type: coupon.type,
      value: coupon.type === 'percentage' ? String(coupon.value) : String(coupon.value / 100),
      minOrder: String(coupon.minOrder / 100),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount / 100) : '',
      startsAt: toLocalInput(coupon.startsAt),
      expiresAt: coupon.expiresAt ? toLocalInput(coupon.expiresAt) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
    });
    setFormError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm(): void {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const rawValue = Number(form.value);
    const minOrderRupees = Number(form.minOrder || '0');
    const maxDiscountRupees = form.maxDiscount ? Number(form.maxDiscount) : null;
    const maxUses = form.maxUses ? Number(form.maxUses) : null;

    if (form.code.trim().length < 2) {
      setFormError('Coupon code must be at least 2 characters');
      return;
    }

    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      setFormError('Enter a discount value greater than zero');
      return;
    }

    if (form.type === 'percentage' && rawValue > 100) {
      setFormError('Percentage coupons cannot exceed 100');
      return;
    }

    if (!Number.isFinite(minOrderRupees) || minOrderRupees < 0) {
      setFormError('Minimum order cannot be negative');
      return;
    }

    if (
      maxDiscountRupees !== null &&
      (!Number.isFinite(maxDiscountRupees) || maxDiscountRupees <= 0)
    ) {
      setFormError('Maximum discount must be greater than zero');
      return;
    }

    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      setFormError('Maximum uses must be a positive whole number');
      return;
    }

    if (form.startsAt && form.expiresAt && new Date(form.expiresAt) <= new Date(form.startsAt)) {
      setFormError('Expiry must be after the start date');
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      type: form.type,
      value: form.type === 'percentage' ? Math.round(rawValue) : Math.round(rawValue * 100),
      minOrder: Math.round(minOrderRupees * 100),
      maxDiscount:
        form.type === 'percentage' && maxDiscountRupees !== null
          ? Math.round(maxDiscountRupees * 100)
          : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      maxUses,
      isActive: form.isActive,
    };

    setFormError(null);

    try {
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createCoupon.mutateAsync(payload);
      }

      closeForm();
    } catch {
      // The mutation hook already shows the error toast.
    }
  }

  function toggleCoupon(coupon: Coupon): void {
    updateCoupon.mutate({ id: coupon.id, input: { isActive: !coupon.isActive } });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  if (couponsQuery.isPending) {
    return (
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <Skeleton className="mt-10 h-80 rounded-2xl" />
      </Container>
    );
  }

  if (couponsQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Coupons could not be loaded"
          message={getErrorMessage(couponsQuery.error)}
          onRetry={() => void couponsQuery.refetch()}
        />
      </Container>
    );
  }

  const { coupons, meta } = couponsQuery.data;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Promotions
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Coupons.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {meta.total} {meta.total === 1 ? 'coupon' : 'coupons'}. Usage is claimed atomically when
            an order is placed.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New coupon
        </Button>
      </div>

      {formOpen && (
        <section className="surface mt-6 p-6 shadow-soft sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {editing ? `Edit ${editing.code}` : 'New coupon'}
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Percentage values are 1–100. Money fields are entered in rupees.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                placeholder="WELCOME10"
                required
              />
              <Select
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as CouponType,
                  }))
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </Select>
              <Input
                label={form.type === 'percentage' ? 'Percent off' : 'Amount off (₹)'}
                type="number"
                min="1"
                step="1"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({ ...current, value: event.target.value }))
                }
                required
              />
              <Input
                label="Minimum order (₹)"
                type="number"
                min="0"
                step="1"
                value={form.minOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, minOrder: event.target.value }))
                }
              />
              <Input
                label="Max discount (₹)"
                type="number"
                min="1"
                step="1"
                value={form.maxDiscount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxDiscount: event.target.value }))
                }
                hint="Percentage coupons only."
                disabled={form.type !== 'percentage'}
              />
              <Input
                label="Maximum uses"
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxUses: event.target.value }))
                }
                hint="Leave empty for unlimited."
              />
              <Input
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                hint="Empty means active now."
              />
              <Input
                label="Expires at"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expiresAt: event.target.value }))
                }
                hint="Empty means no expiry."
              />
              <label className="flex items-center gap-3 self-end rounded-xl border border-ink-200 bg-paper px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                  className="h-4 w-4 accent-brand-800"
                />
                <span className="text-sm font-medium text-ink-800">Active</span>
              </label>
            </div>

            <Input
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Optional note shown in the admin list"
            />

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-ink-200/80 pt-5">
              <Button type="submit" loading={createCoupon.isPending || updateCoupon.isPending}>
                {editing ? 'Save changes' : 'Create coupon'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={submitSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search coupon codes"
            aria-label="Search coupon codes"
            className="h-11 flex-1 rounded-full border border-ink-200 bg-paper px-4 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter coupons by status">
          {activeFilters.map((option) => {
            const selected = option.value === active;

            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => {
                  setActive(option.value);
                  setPage(1);
                }}
                aria-pressed={selected}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  selected
                    ? 'bg-brand-800 text-cream'
                    : 'border border-ink-200 bg-paper text-ink-700 hover:border-ink-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <TicketPercent className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">
            No coupons found.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {search || active
              ? 'Try a different search or status filter.'
              : 'Create a coupon to offer a discount at checkout.'}
          </p>
        </div>
      ) : (
        <>
          <div className="surface mt-6 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Coupon</th>
                    <th className="px-5 py-3.5">Discount</th>
                    <th className="px-5 py-3.5 text-right">Min order</th>
                    <th className="px-5 py-3.5 text-right">Usage</th>
                    <th className="px-5 py-3.5">Window</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="transition hover:bg-ink-50/60">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-ink-900">
                          {coupon.code}
                        </p>
                        <p className="mt-0.5 max-w-56 truncate text-xs text-ink-500">
                          {coupon.description ?? 'No description'}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-ink-900">
                        {discountLabel(coupon)}
                      </td>
                      <td className="px-5 py-4 text-right text-ink-600 tabular-nums">
                        {coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-ink-600 tabular-nums">
                        {coupon.usedCount} / {coupon.maxUses ?? '∞'}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-600">
                        <p>From {formatDate(coupon.startsAt)}</p>
                        <p>
                          {coupon.expiresAt ? `Until ${formatDate(coupon.expiresAt)}` : 'No expiry'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={coupon.isActive ? 'success' : 'neutral'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(coupon)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={coupon.isActive ? 'text-red-600 hover:bg-red-50' : ''}
                            onClick={() => toggleCoupon(coupon)}
                            loading={
                              updateCoupon.isPending && updateCoupon.variables?.id === coupon.id
                            }
                          >
                            {coupon.isActive ? (
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <TicketPercent className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {coupon.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </Container>
  );
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useAdminCustomer,
  useAdminCustomers,
  useUpdateAdminCustomerStatus,
} from '@/hooks/useAdminDashboard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPrice } from '@/lib/format';

type StatusFilter = '' | 'active' | 'inactive';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

export function AdminCustomersPage() {
  useDocumentTitle('Admin customers');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const customersQuery = useAdminCustomers({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  const customerQuery = useAdminCustomer(selectedId);
  const updateStatus = useUpdateAdminCustomerStatus();

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function changeStatus(nextStatus: StatusFilter): void {
    setStatus(nextStatus);
    setPage(1);
  }

  if (customersQuery.isPending) {
    return (
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <Skeleton className="mt-10 h-80 rounded-2xl" />
      </Container>
    );
  }

  if (customersQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Customers could not be loaded"
          message={getErrorMessage(customersQuery.error)}
          onRetry={() => void customersQuery.refetch()}
        />
      </Container>
    );
  }

  const { customers, meta } = customersQuery.data;

  return (
    <Container className="py-10 sm:py-14">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">Accounts</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Customers.
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {meta.total} customer {meta.total === 1 ? 'account' : 'accounts'}. Deactivating a customer
          ends their refresh session immediately.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={submitSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search customers</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or email"
              className="h-11 w-full rounded-full border border-ink-200 bg-paper pr-4 pl-11 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
            />
          </label>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter customers by status">
          {statusFilters.map((option) => {
            const active = option.value === status;

            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => changeStatus(option.value)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  active
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

      {customers.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Users className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">
            No customers found.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {search || status
              ? 'Try a different search or status filter.'
              : 'Customer accounts will appear here after registration.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div>
            <div className="surface overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Joined</th>
                      <th className="px-5 py-3.5 text-right">Orders</th>
                      <th className="px-5 py-3.5 text-right">Spent</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className={`transition ${
                          selectedId === customer.id ? 'bg-brand-50/50' : 'hover:bg-ink-50/60'
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-ink-900">{customer.name}</p>
                          <p className="text-xs text-ink-500">{customer.email}</p>
                        </td>
                        <td className="px-5 py-4 text-ink-600">{formatDate(customer.createdAt)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-ink-900 tabular-nums">
                          {customer.orderCount}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-ink-900 tabular-nums">
                          {formatPrice(customer.totalSpent)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={customer.isActive ? 'success' : 'danger'}>
                            {customer.isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedId(customer.id)}
                          >
                            View
                          </Button>
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
          </div>

          <aside className="lg:sticky lg:top-28">
            {!selectedId ? (
              <div className="surface p-6 text-center shadow-soft">
                <Users className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-ink-700">Select a customer</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  Choose View on a row to inspect spending, recent orders and account access.
                </p>
              </div>
            ) : customerQuery.isPending ? (
              <Skeleton className="h-96 rounded-2xl" />
            ) : customerQuery.isError ? (
              <ErrorState
                title="Customer unavailable"
                message={getErrorMessage(customerQuery.error)}
                onRetry={() => void customerQuery.refetch()}
              />
            ) : (
              <div className="surface p-6 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink-900">
                      {customerQuery.data.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {customerQuery.data.email}
                    </p>
                  </div>
                  <Badge tone={customerQuery.data.isActive ? 'success' : 'danger'}>
                    {customerQuery.data.isActive ? 'Active' : 'Deactivated'}
                  </Badge>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-ink-50/80 px-3 py-2.5">
                    <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                      Orders
                    </dt>
                    <dd className="mt-1 font-semibold text-ink-900 tabular-nums">
                      {customerQuery.data.orderCount}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-ink-50/80 px-3 py-2.5">
                    <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                      Spent
                    </dt>
                    <dd className="mt-1 font-semibold text-ink-900 tabular-nums">
                      {formatPrice(customerQuery.data.totalSpent)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-ink-50/80 px-3 py-2.5">
                    <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                      Joined
                    </dt>
                    <dd className="mt-1 font-semibold text-ink-900">
                      {formatDate(customerQuery.data.createdAt)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-ink-50/80 px-3 py-2.5">
                    <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                      Last order
                    </dt>
                    <dd className="mt-1 font-semibold text-ink-900">
                      {customerQuery.data.lastOrderAt
                        ? formatDate(customerQuery.data.lastOrderAt)
                        : '—'}
                    </dd>
                  </div>
                </dl>

                <Button
                  className="mt-4"
                  fullWidth
                  variant={customerQuery.data.isActive ? 'danger' : 'primary'}
                  loading={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({
                      id: customerQuery.data.id,
                      isActive: !customerQuery.data.isActive,
                    })
                  }
                >
                  {customerQuery.data.isActive ? (
                    <>
                      <ShieldOff className="h-4 w-4" aria-hidden="true" />
                      Deactivate account
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Reactivate account
                    </>
                  )}
                </Button>

                <div className="mt-6 border-t border-ink-200/80 pt-4">
                  <h3 className="font-display text-lg font-semibold text-ink-900">Recent orders</h3>

                  {customerQuery.data.recentOrders.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-500">This customer has not ordered yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {customerQuery.data.recentOrders.map((order) => (
                        <li
                          key={order.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-paper px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs font-semibold text-ink-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-ink-500">
                              {formatDate(order.createdAt)} · {formatPrice(order.total)}
                            </p>
                          </div>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                          >
                            Open
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </Container>
  );
}

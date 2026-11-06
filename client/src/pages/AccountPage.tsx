import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { getErrorMessage, getFieldErrors } from '@/api/errors';
import { changePasswordRequest } from '@/api/users.api';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PASSWORD_CHANGED_NOTICE } from '@/lib/constants';
import { formatDate, initials } from '@/lib/format';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
      <dt className="flex items-center gap-2 text-sm text-ink-500">
        <Icon className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium break-all text-ink-900">{value}</dd>
    </div>
  );
}

const roadmap = [
  {
    title: 'Payments',
    copy: 'Phase 8 — Razorpay order creation and signature verification.',
  },
  {
    title: 'Order lifecycle',
    copy: 'Phase 9 — status tracking, cancellation and refunds.',
  },
  {
    title: 'Admin dashboard',
    copy: 'Phase 10 — inventory, coupons, orders and analytics.',
  },
];

export function AccountPage() {
  useDocumentTitle('Your account');
  const { user, isAdmin, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);

  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    await logout();
    navigate('/');
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileFormError(null);
    setProfileErrors({});

    try {
      await updateProfile({ name: profileName.trim() });
      setProfileSaved(true);
    } catch (error) {
      setProfileFormError(getErrorMessage(error));
      setProfileErrors(getFieldErrors(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPasswordFormError(null);
    setPasswordErrors({});

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: 'The two passwords do not match' });
      return;
    }

    setChangingPassword(true);

    try {
      await changePasswordRequest({ currentPassword, newPassword });
      navigate('/account', { replace: true, state: { notice: PASSWORD_CHANGED_NOTICE } });
      await logout();
    } catch (error) {
      setPasswordFormError(getErrorMessage(error));
      setPasswordErrors(getFieldErrors(error));
    } finally {
      setChangingPassword(false);
    }
  }

  const profileUnchanged = profileName.trim() === user.name;

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
            Account
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your corner of Bazaar.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
            Update your details, change your password, and see how this session stays secure.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/orders" className={buttonStyles({ variant: 'secondary' })}>
            <Package className="h-4 w-4" aria-hidden="true" />
            Your orders
          </Link>
          <Link to="/addresses" className={buttonStyles({ variant: 'secondary' })}>
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Addresses
          </Link>
          {isAdmin && (
            <Link to="/admin" className={buttonStyles({ variant: 'secondary' })}>
              Admin area
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          <Button variant="secondary" onClick={handleSignOut} loading={signingOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden rounded-3xl bg-brand-900 p-7 text-cream shadow-soft sm:p-8">
          <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cream/10 font-display text-2xl font-semibold ring-1 ring-cream/15 ring-inset">
                {initials(user.name)}
              </span>
              <span className="rounded-full border border-cream/15 bg-cream/5 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-cream/80 uppercase">
                {isAdmin ? 'Administrator' : 'Customer'}
              </span>
            </div>

            <h2 className="mt-6 font-display text-3xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-sm text-cream/60">{user.email}</p>

            <dl className="mt-8 space-y-3 border-t border-cream/10 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since
                </dt>
                <dd className="font-medium text-cream/90">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Role
                </dt>
                <dd className="font-medium text-cream/90 capitalize">{user.role}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  User ID
                </dt>
                <dd className="max-w-40 truncate font-mono text-xs text-cream/70">{user.id}</dd>
              </div>
            </dl>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cream/80 transition hover:text-cream"
            >
              Browse the catalogue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Profile details</h2>
                <p className="text-xs text-ink-500">How you appear across the store.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4" noValidate>
              {profileFormError && <Alert variant="error">{profileFormError}</Alert>}
              {profileSaved && (
                <Alert variant="success" title="Profile updated">
                  Your new name is saved and shown in the header.
                </Alert>
              )}

              <Input
                label="Full name"
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value);
                  setProfileSaved(false);
                }}
                autoComplete="name"
                error={profileErrors.name}
                hint="Between 2 and 50 characters."
              />

              <Input
                label="Email address"
                value={user.email}
                readOnly
                disabled
                hint="Email changes are not available yet."
                className="disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-400">Joined {formatDate(user.createdAt)}</p>
                <Button
                  type="submit"
                  loading={savingProfile}
                  disabled={profileUnchanged || profileName.trim().length < 2}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Change password</h2>
                <p className="text-xs text-ink-500">
                  A new password signs out every device, including this one.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4" noValidate>
              {passwordFormError && <Alert variant="error">{passwordFormError}</Alert>}

              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                error={passwordErrors.currentPassword}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  error={passwordErrors.newPassword}
                  hint="At least 8 characters."
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  error={passwordErrors.confirmPassword}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={changingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Session &amp; security
                </h2>
                <p className="text-xs text-ink-500">How this browser stays signed in.</p>
              </div>
            </div>

            <dl className="mt-5">
              <DetailRow icon={KeyRound} label="Access token" value="In memory · 15 minutes" />
              <DetailRow
                icon={ShieldCheck}
                label="Refresh token"
                value="httpOnly cookie · 7 days"
              />
              <DetailRow icon={RefreshCw} label="Rotation" value="New token on every renewal" />
              <DetailRow
                icon={ShieldCheck}
                label="After reload"
                value="Session restored silently"
              />
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              The access token never touches localStorage, so a cross-site scripting bug cannot read
              it. The refresh cookie is httpOnly and scoped to the auth routes.
            </p>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">What comes next</h2>
                <p className="text-xs text-ink-500">This storefront grows one phase at a time.</p>
              </div>
            </div>

            <ol className="mt-5 space-y-4">
              {roadmap.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="font-display text-sm font-semibold text-accent-600">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </Container>
  );
}

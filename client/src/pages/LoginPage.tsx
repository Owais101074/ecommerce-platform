import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  useDocumentTitle('Sign in');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: trimmedEmail, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length === 0 ? getErrorMessage(error) : null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="surface surface-shadow p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">
            Sign in to manage your profile and reach protected pages.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {formError && <Alert variant="error">{formError}</Alert>}

            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              error={errors.email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button type="submit" fullWidth loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}

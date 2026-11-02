import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  useDocumentTitle('Create account');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      nextErrors.name = 'Name must be at most 50 characters';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    } else if (password.length > 72) {
      nextErrors.password = 'Password must be at most 72 characters';
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({ name: trimmedName, email: trimmedEmail, password });
      navigate('/account', { replace: true });
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
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            One account for your profile, orders and saved items.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {formError && <Alert variant="error">{formError}</Alert>}

            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Owais Khan"
              value={name}
              error={errors.name}
              onChange={(event) => setName(event.target.value)}
            />

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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint="Use 8–72 characters."
              value={password}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <Button type="submit" fullWidth loading={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}

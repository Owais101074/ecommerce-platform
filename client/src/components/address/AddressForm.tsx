import { useState, type FormEvent } from 'react';
import { getErrorMessage, getFieldErrors } from '@/api/errors';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Address, AddressInput } from '@/types/address';

interface AddressFormProps {
  initial?: Address;
  onSubmit: (input: AddressInput) => Promise<void>;
  onCancel: () => void;
}

export function AddressForm({ initial, onSubmit, onCancel }: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? 'Home');
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [line1, setLine1] = useState(initial?.line1 ?? '');
  const [line2, setLine2] = useState(initial?.line2 ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [pincode, setPincode] = useState(initial?.pincode ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const labelOptions = ['Home', 'Work', 'Other'];

  if (initial && !labelOptions.includes(initial.label)) {
    labelOptions.push(initial.label);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setErrors({});
    setSaving(true);

    try {
      await onSubmit({
        label,
        fullName: fullName.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Address label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={errors.label}
        >
          {labelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>

        <Input
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          error={errors.fullName}
        />
      </div>

      <Input
        label="Mobile number"
        value={phone}
        onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
        inputMode="numeric"
        autoComplete="tel-national"
        error={errors.phone}
        hint="10 digits, starting with 6–9."
      />

      <Input
        label="Address line 1"
        value={line1}
        onChange={(event) => setLine1(event.target.value)}
        autoComplete="address-line1"
        error={errors.line1}
      />

      <Input
        label="Address line 2 (optional)"
        value={line2}
        onChange={(event) => setLine2(event.target.value)}
        autoComplete="address-line2"
        error={errors.line2}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          autoComplete="address-level2"
          error={errors.city}
        />
        <Input
          label="State"
          value={state}
          onChange={(event) => setState(event.target.value)}
          autoComplete="address-level1"
          error={errors.state}
        />
      </div>

      <Input
        label="Pincode"
        value={pincode}
        onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="postal-code"
        error={errors.pincode}
        hint="6 digits."
      />

      <label className="flex items-start gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-brand-800"
        />
        Use this as my default delivery address
      </label>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? 'Save address' : 'Add address'}
        </Button>
      </div>
    </form>
  );
}

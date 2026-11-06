import { useEffect, useState } from 'react';
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/types/address';

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  deleting?: boolean;
  settingDefault?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  deleting = false,
  settingDefault = false,
}: AddressCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) {
      return;
    }

    const timer = window.setTimeout(() => setConfirmDelete(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  return (
    <article
      className={`surface flex h-full flex-col p-5 shadow-soft ${
        address.isDefault ? 'ring-1 ring-brand-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{address.label}</p>
            {address.isDefault && <Badge tone="success">Default</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${address.label} address`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            disabled={deleting}
            aria-label={
              confirmDelete
                ? `Confirm deleting ${address.label}`
                : `Delete ${address.label} address`
            }
            className={`flex h-8 items-center justify-center rounded-full px-2 text-xs font-semibold transition disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-ink-400 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {confirmDelete ? 'Confirm' : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm leading-relaxed text-ink-600">
        <p className="font-medium text-ink-900">{address.fullName}</p>
        <p>{address.phone}</p>
        <p>
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ''}
        </p>
        <p>
          {address.city}, {address.state} {address.pincode}
        </p>
      </div>

      {!address.isDefault && (
        <div className="mt-auto pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={settingDefault}
            onClick={onSetDefault}
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            Set as default
          </Button>
        </div>
      )}
    </article>
  );
}

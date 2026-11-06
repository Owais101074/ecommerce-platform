import type { AddressDocument } from './address.model';
import type { AddressDTO } from './address.types';

export function toAddressDTO(address: AddressDocument): AddressDTO {
  return {
    id: address._id.toString(),
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

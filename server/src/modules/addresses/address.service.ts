import { ApiError } from '../../utils/ApiError';
import { Address } from './address.model';
import type { AddressDocument } from './address.model';
import { toAddressDTO } from './address.mapper';
import type { AddressDTO } from './address.types';
import type { CreateAddressInput, UpdateAddressInput } from './address.validation';

async function listAddressDTOs(userId: string): Promise<AddressDTO[]> {
  const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  return addresses.map(toAddressDTO);
}

async function findOwnedAddress(userId: string, addressId: string): Promise<AddressDocument> {
  const address = await Address.findOne({ _id: addressId, userId });

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  return address;
}

export async function listAddresses(userId: string): Promise<AddressDTO[]> {
  return listAddressDTOs(userId);
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput,
): Promise<AddressDTO[]> {
  const existingCount = await Address.countDocuments({ userId });
  const isDefault = input.isDefault === true || existingCount === 0;

  if (isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  await Address.create({
    userId,
    label: input.label,
    fullName: input.fullName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 ?? null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    isDefault,
  });

  return listAddressDTOs(userId);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
): Promise<AddressDTO[]> {
  const address = await findOwnedAddress(userId, addressId);

  if (input.isDefault === false && address.isDefault) {
    const otherCount = await Address.countDocuments({ userId, _id: { $ne: address._id } });

    if (otherCount === 0) {
      throw new ApiError(400, 'Your only address must stay the default');
    }
  }

  if (input.isDefault === true) {
    await Address.updateMany({ userId, _id: { $ne: address._id } }, { $set: { isDefault: false } });
    address.isDefault = true;
  } else if (input.isDefault === false) {
    address.isDefault = false;
  }

  if (input.label !== undefined) address.label = input.label;
  if (input.fullName !== undefined) address.fullName = input.fullName;
  if (input.phone !== undefined) address.phone = input.phone;
  if (input.line1 !== undefined) address.line1 = input.line1;
  if (input.line2 !== undefined) address.line2 = input.line2;
  if (input.city !== undefined) address.city = input.city;
  if (input.state !== undefined) address.state = input.state;
  if (input.pincode !== undefined) address.pincode = input.pincode;

  await address.save();

  return listAddressDTOs(userId);
}

export async function deleteAddress(userId: string, addressId: string): Promise<AddressDTO[]> {
  const address = await findOwnedAddress(userId, addressId);
  const wasDefault = address.isDefault;

  await address.deleteOne();

  if (wasDefault) {
    const replacement = await Address.findOne({ userId }).sort({ createdAt: 1 });

    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return listAddressDTOs(userId);
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<AddressDTO[]> {
  const address = await findOwnedAddress(userId, addressId);

  await Address.updateMany({ userId, _id: { $ne: address._id } }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  return listAddressDTOs(userId);
}

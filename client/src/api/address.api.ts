import type { ApiSuccess } from '@/types/api';
import type { Address, AddressInput, AddressUpdateInput } from '@/types/address';
import { http } from './http';

type AddressList = { addresses: Address[] };

export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await http.get<ApiSuccess<AddressList>>('/addresses');
  return data.data.addresses;
}

export async function createAddressRequest(input: AddressInput): Promise<Address[]> {
  const { data } = await http.post<ApiSuccess<AddressList>>('/addresses', input);
  return data.data.addresses;
}

export async function updateAddressRequest(
  addressId: string,
  input: AddressUpdateInput,
): Promise<Address[]> {
  const { data } = await http.patch<ApiSuccess<AddressList>>(`/addresses/${addressId}`, input);
  return data.data.addresses;
}

export async function removeAddressRequest(addressId: string): Promise<Address[]> {
  const { data } = await http.delete<ApiSuccess<AddressList>>(`/addresses/${addressId}`);
  return data.data.addresses;
}

export async function setDefaultAddressRequest(addressId: string): Promise<Address[]> {
  const { data } = await http.patch<ApiSuccess<AddressList>>(`/addresses/${addressId}/default`);
  return data.data.addresses;
}

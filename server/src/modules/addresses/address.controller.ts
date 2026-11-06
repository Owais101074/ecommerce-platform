import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import * as addressService from './address.service';
import type { CreateAddressInput, UpdateAddressInput } from './address.validation';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const addresses = await addressService.listAddresses(currentUserId(req));
  sendSuccess(res, 200, 'Addresses fetched', { addresses });
}

export async function create(req: Request, res: Response): Promise<void> {
  const addresses = await addressService.createAddress(
    currentUserId(req),
    req.body as CreateAddressInput,
  );
  sendSuccess(res, 201, 'Address added', { addresses });
}

export async function update(req: Request, res: Response): Promise<void> {
  const addresses = await addressService.updateAddress(
    currentUserId(req),
    req.params.id as string,
    req.body as UpdateAddressInput,
  );
  sendSuccess(res, 200, 'Address updated', { addresses });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const addresses = await addressService.deleteAddress(currentUserId(req), req.params.id as string);
  sendSuccess(res, 200, 'Address removed', { addresses });
}

export async function setDefault(req: Request, res: Response): Promise<void> {
  const addresses = await addressService.setDefaultAddress(
    currentUserId(req),
    req.params.id as string,
  );
  sendSuccess(res, 200, 'Default address updated', { addresses });
}

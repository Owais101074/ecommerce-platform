import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import * as customerService from './admin.customer.service';
import type { AdminCustomerListQuery, AdminCustomerStatusInput } from './admin.customer.validation';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const result = await customerService.listCustomers(req.validatedQuery as AdminCustomerListQuery);
  sendSuccess(res, 200, 'Customers fetched', { customers: result.customers }, result.meta);
}

export async function customerDetail(req: Request, res: Response): Promise<void> {
  const customer = await customerService.getCustomer(req.params.id as string);
  sendSuccess(res, 200, 'Customer fetched', { customer });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { isActive } = req.body as AdminCustomerStatusInput;
  const customer = await customerService.updateCustomerStatus(req.params.id as string, isActive);
  sendSuccess(res, 200, isActive ? 'Customer reactivated' : 'Customer deactivated', {
    customer,
  });
}

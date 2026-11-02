import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import * as categoryService from './category.service';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.validation';

export async function list(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories();
  sendSuccess(res, 200, 'Categories fetched', { categories });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const category = await categoryService.getCategoryBySlug(req.params.slug as string);
  sendSuccess(res, 200, 'Category fetched', { category });
}

export async function create(req: Request, res: Response): Promise<void> {
  const category = await categoryService.createCategory(req.body as CreateCategoryInput);
  sendSuccess(res, 201, 'Category created', { category });
}

export async function update(req: Request, res: Response): Promise<void> {
  const category = await categoryService.updateCategory(
    req.params.id as string,
    req.body as UpdateCategoryInput,
  );
  sendSuccess(res, 200, 'Category updated', { category });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await categoryService.deleteCategory(req.params.id as string);
  res.status(204).send();
}

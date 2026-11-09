import type { Request, Response } from 'express';
import { cacheKeys, cached } from '../../infra/cache';
import { sendSuccess } from '../../utils/ApiResponse';
import * as productService from './product.service';
import type {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
  UpdateStockInput,
} from './product.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ProductQuery;
  const result = await cached(cacheKeys.productList(query), () =>
    productService.listProducts(query),
  );

  sendSuccess(
    res,
    200,
    'Products fetched',
    { products: result.products },
    {
      ...result.meta,
    },
  );
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const slug = req.params.slug as string;
  const product = await cached(cacheKeys.productDetail(slug), () =>
    productService.getProductBySlug(slug),
  );

  sendSuccess(res, 200, 'Product fetched', { product });
}

export async function create(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body as CreateProductInput);
  sendSuccess(res, 201, 'Product created', { product });
}

export async function update(req: Request, res: Response): Promise<void> {
  const product = await productService.updateProduct(
    req.params.id as string,
    req.body as UpdateProductInput,
  );
  sendSuccess(res, 200, 'Product updated', { product });
}

export async function updateStock(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateStockInput;
  const product = await productService.updateStock(req.params.id as string, input.stock);
  sendSuccess(res, 200, 'Stock updated', { product });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await productService.deleteProduct(req.params.id as string);
  res.status(204).send();
}

import { useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, Package, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useUploadProductImage,
} from '@/hooks/useAdminCatalog';
import { useCategories } from '@/hooks/useCategories';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProducts } from '@/hooks/useProducts';
import { formatDate, formatPrice } from '@/lib/format';
import type { Category, Product } from '@/types/catalog';

interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...flattenCategories(category.children, depth + 1),
  ]);
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  stock: string;
  images: string[];
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  stock: '0',
  images: [],
};

export function AdminProductsPage() {
  useDocumentTitle('Admin products');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const productsQuery = useProducts({ q: search || undefined, page, limit: 10 });
  const categoriesQuery = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();

  const categoryOptions = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(product: Product): void {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price / 100),
      categoryId: product.category?.id ?? '',
      stock: String(product.stock),
      images: [...product.images],
    });
    setFormError(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm(): void {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  function updateField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleUpload(file: File | undefined): Promise<void> {
    if (!file || form.images.length >= 5) {
      return;
    }

    try {
      const image = await uploadImage.mutateAsync(file);
      setForm((current) =>
        current.images.length >= 5
          ? current
          : { ...current, images: [...current.images, image.url] },
      );
    } catch {
      // The mutation hook already shows the error toast.
    }
  }

  function addImageUrl(): void {
    const value = imageUrl.trim();

    if (!value) {
      return;
    }

    try {
      new URL(value);
    } catch {
      setFormError('Enter a valid image URL');
      return;
    }

    if (form.images.length >= 5) {
      setFormError('At most 5 images are allowed');
      return;
    }

    setForm((current) => ({ ...current, images: [...current.images, value] }));
    setImageUrl('');
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (form.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }

    if (form.description.trim().length < 20) {
      setFormError('Description must be at least 20 characters');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Enter a price greater than zero');
      return;
    }

    if (!form.categoryId) {
      setFormError('Choose a category');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setFormError('Stock must be zero or a positive whole number');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Math.round(price * 100),
      categoryId: form.categoryId,
      images: form.images,
      stock,
    };

    setFormError(null);

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }

      closeForm();
    } catch {
      // The mutation hook already shows the error toast.
    }
  }

  function handleDelete(product: Product): void {
    if (window.confirm(`Remove ${product.name} from the storefront?`)) {
      deleteProduct.mutate(product.id);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  if (productsQuery.isPending) {
    return (
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <Skeleton className="mt-10 h-80 rounded-2xl" />
      </Container>
    );
  }

  if (productsQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Products could not be loaded"
          message={getErrorMessage(productsQuery.error)}
          onRetry={() => void productsQuery.refetch()}
        />
      </Container>
    );
  }

  const { products, meta } = productsQuery.data;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Catalogue
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Products.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {meta.total} active {meta.total === 1 ? 'product' : 'products'} in the storefront.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New product
        </Button>
      </div>

      {formOpen && (
        <section className="surface mt-6 p-6 shadow-soft sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {editing ? `Edit ${editing.name}` : 'New product'}
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Prices are entered in rupees and sent to the API as integer paise.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Oak serving board"
                required
              />
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
                required
              >
                <option value="">Choose a category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'— '.repeat(category.depth)}
                    {category.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Price (₹)"
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                placeholder="2499"
                required
              />
              <Input
                label="Stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
                required
              />
            </div>

            <Textarea
              label="Description"
              rows={4}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              hint="Between 20 and 5000 characters."
              required
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink-700">Images</p>
                  <p className="text-[13px] text-ink-500">
                    Up to 5 images. Uploads go to Cloudinary when it is configured.
                  </p>
                </div>
                <label
                  className={`${buttonStyles({ variant: 'secondary', size: 'sm' })} cursor-pointer ${
                    uploadImage.isPending || form.images.length >= 5
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {uploadImage.isPending ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void handleUpload(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>

              {form.images.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {form.images.map((image) => (
                    <li
                      key={image}
                      className="group relative overflow-hidden rounded-xl border border-ink-200 bg-ink-50"
                    >
                      <img src={image} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'images',
                            form.images.filter((item) => item !== image),
                          )
                        }
                        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/80 text-cream transition hover:bg-red-600"
                        aria-label="Remove image"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  label="Image URL"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="sm:flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="sm:self-end"
                  onClick={addImageUrl}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Add URL
                </Button>
              </div>
            </div>

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-ink-200/80 pt-5">
              <Button type="submit" loading={createProduct.isPending || updateProduct.isPending}>
                {editing ? 'Save changes' : 'Create product'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or description"
            className="h-11 w-full rounded-full border border-ink-200 bg-paper pr-4 pl-11 text-sm text-ink-900 transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none"
          />
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {products.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Package className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">
            No products found.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {search
              ? `Nothing matches “${search}”. Try a different search.`
              : 'Create the first product to start selling.'}
          </p>
        </div>
      ) : (
        <>
          <div className="surface mt-6 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5 text-right">Price</th>
                    <th className="px-5 py-3.5">Stock</th>
                    <th className="px-5 py-3.5">Updated</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {products.map((product) => (
                    <tr key={product.id} className="transition hover:bg-ink-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-ink-400">
                                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-900">{product.name}</p>
                            <p className="truncate font-mono text-xs text-ink-500">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ink-600">{product.category?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-right font-semibold text-ink-900 tabular-nums">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={
                            product.stock === 0
                              ? 'danger'
                              : product.stock <= 5
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-ink-600">{formatDate(product.updatedAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(product)}
                            loading={
                              deleteProduct.isPending && deleteProduct.variables === product.id
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </Container>
  );
}

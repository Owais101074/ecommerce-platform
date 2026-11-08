import { useMemo, useState, type FormEvent } from 'react';
import { FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useAdminCatalog';
import { useCategories } from '@/hooks/useCategories';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Category } from '@/types/catalog';

interface CategoryOption {
  id: string;
  name: string;
  depth: number;
  disabled: boolean;
}

function flattenCategories(
  categories: Category[],
  depth: number,
  blocked: Set<string>,
): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth, disabled: blocked.has(category.id) },
    ...flattenCategories(category.children, depth + 1, blocked),
  ]);
}

function subtreeIds(category: Category): Set<string> {
  const ids = new Set<string>([category.id]);

  for (const child of category.children) {
    for (const id of subtreeIds(child)) {
      ids.add(id);
    }
  }

  return ids;
}

interface CategoryFormState {
  name: string;
  description: string;
  parentId: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', description: '', parentId: '' };

function CategoryRow({
  category,
  depth,
  onEdit,
  onDelete,
  deletingId,
}: {
  category: Category;
  depth: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  deletingId: string | undefined;
}) {
  return (
    <>
      <tr className="transition hover:bg-ink-50/60">
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 20}px` }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
              <FolderTree className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-900">{category.name}</p>
              <p className="truncate font-mono text-xs text-ink-500">{category.slug}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 text-ink-600">
          {category.description ?? <span className="text-ink-400">—</span>}
        </td>
        <td className="px-5 py-3.5">
          {category.children.length > 0 ? (
            <Badge tone="neutral">{category.children.length} children</Badge>
          ) : (
            <span className="text-xs text-ink-400">Leaf</span>
          )}
        </td>
        <td className="px-5 py-3.5">
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(category)}
              loading={deletingId === category.id}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </Button>
          </div>
        </td>
      </tr>
      {category.children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      ))}
    </>
  );
}

export function AdminCategoriesPage() {
  useDocumentTitle('Admin categories');
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const parentOptions = useMemo<CategoryOption[]>(() => {
    const blocked = editing ? subtreeIds(editing) : new Set<string>();
    return flattenCategories(categoriesQuery.data ?? [], 0, blocked);
  }, [categoriesQuery.data, editing]);

  function openCreate(): void {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(category: Category): void {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (form.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      parentId: form.parentId || null,
    };

    setFormError(null);

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createCategory.mutateAsync(payload);
      }

      closeForm();
    } catch {
      // The mutation hook already shows the error toast.
    }
  }

  function handleDelete(category: Category): void {
    if (window.confirm(`Remove ${category.name}? Categories with products cannot be removed.`)) {
      deleteCategory.mutate(category.id);
    }
  }

  if (categoriesQuery.isPending) {
    return (
      <Container className="py-10 sm:py-14">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <Skeleton className="mt-10 h-72 rounded-2xl" />
      </Container>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Categories could not be loaded"
          message={getErrorMessage(categoriesQuery.error)}
          onRetry={() => void categoriesQuery.refetch()}
        />
      </Container>
    );
  }

  const categories = categoriesQuery.data;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Catalogue
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Categories.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Categories form a tree. Deeper levels appear indented.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New category
        </Button>
      </div>

      {formOpen && (
        <section className="surface mt-6 p-6 shadow-soft sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {editing ? `Edit ${editing.name}` : 'New category'}
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Leave the parent empty to keep this category at the top level.
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
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <Select
                label="Parent category"
                value={form.parentId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parentId: event.target.value }))
                }
              >
                <option value="">Top level</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id} disabled={option.disabled}>
                    {'— '.repeat(option.depth)}
                    {option.name}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              hint="Optional, up to 500 characters."
            />

            {formError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-ink-200/80 pt-5">
              <Button type="submit" loading={createCategory.isPending || updateCategory.isPending}>
                {editing ? 'Save changes' : 'Create category'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {categories.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <FolderTree className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">
            No categories yet.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Create a top-level category, then add subcategories beneath it.
          </p>
        </div>
      ) : (
        <div className="surface mt-6 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Structure</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    depth={0}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deletingId={deleteCategory.isPending ? deleteCategory.variables : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
}

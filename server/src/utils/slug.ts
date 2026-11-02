export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function generateUniqueSlug(
  value: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(value) || 'item';
  let slug = base;
  let suffix = 2;

  while (await exists(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

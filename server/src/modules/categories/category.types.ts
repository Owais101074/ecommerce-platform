export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryNode extends CategoryDTO {
  children: CategoryNode[];
}

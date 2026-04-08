export interface CategoryDetail {
  id: string;
  name: string;
  parentCategory: { id: string; name: string } | null;
}

export interface CategoryJoinColumns {
  categoryName: string | null;
  parentCatId: string | null;
  parentCatName: string | null;
}

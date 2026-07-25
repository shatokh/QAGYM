export const CATALOG_PAGE_SIZE = 6;

export interface CatalogPageState {
  page: number;
  shouldCanonicalize: boolean;
}

export function parseCatalogPage(search: string): CatalogPageState {
  const params = new URLSearchParams(search);
  const values = params.getAll("page");
  const value = values.length === 1 ? values[0] : null;

  if (!value || !/^[1-9]\d*$/.test(value)) {
    return {
      page: 1,
      shouldCanonicalize: values.length > 0,
    };
  }

  const page = Number(value);
  if (!Number.isSafeInteger(page)) {
    return { page: 1, shouldCanonicalize: true };
  }

  return {
    page,
    shouldCanonicalize: false,
  };
}

export function canonicalCatalogSearch(
  search: string,
  page: number,
): string {
  const params = new URLSearchParams(search);
  params.delete("page");

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

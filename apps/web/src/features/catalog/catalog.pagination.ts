export const CATALOG_PAGE_SIZE = 6;

export type CatalogAvailability = "in-stock" | "out-of-stock";

export interface CatalogFilters {
  q: string;
  genre: string;
  series: string;
  availability: CatalogAvailability | "";
}

export interface CatalogFiltersState {
  filters: CatalogFilters;
  shouldCanonicalize: boolean;
}

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
  filters?: CatalogFilters,
): string {
  const params = new URLSearchParams(search);
  params.delete("page");

  if (filters) {
    for (const key of ["q", "genre", "series", "availability"]) {
      params.delete(key);
    }

    if (filters.q) params.set("q", filters.q);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.series) params.set("series", filters.series);
    if (filters.availability) params.set("availability", filters.availability);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

export function parseCatalogFilters(search: string): CatalogFiltersState {
  const params = new URLSearchParams(search);
  let shouldCanonicalize = false;

  function readSingle(name: string): string {
    const values = params.getAll(name);
    if (values.length > 1) {
      shouldCanonicalize = true;
      return "";
    }

    if (values.length === 0) return "";
    if (!values[0]) {
      shouldCanonicalize = true;
      return "";
    }

    return values[0];
  }

  const rawQuery = readSingle("q");
  const q = rawQuery.trim();
  shouldCanonicalize ||= q !== rawQuery;

  const availabilityValue = readSingle("availability");
  const availability: CatalogAvailability | "" =
    availabilityValue === "in-stock" || availabilityValue === "out-of-stock"
      ? availabilityValue
      : "";
  if (availabilityValue && !availability) shouldCanonicalize = true;

  return {
    filters: {
      q,
      genre: readSingle("genre"),
      series: readSingle("series"),
      availability,
    },
    shouldCanonicalize,
  };
}

export function hasCatalogFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.q || filters.genre || filters.series || filters.availability,
  );
}

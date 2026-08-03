import type { CatalogLocale } from "../catalog/api/catalog.contract";

export function formatOrderDate(isoDate: string, locale: CatalogLocale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface CatalogPaginationProps {
  locale: "en" | "ru";
  page: number;
  totalPages: number;
}

function pageHref(locale: "en" | "ru", page: number): string {
  return page === 1 ? `/${locale}/comics` : `/${locale}/comics?page=${page}`;
}

export function CatalogPagination({
  locale,
  page,
  totalPages,
}: CatalogPaginationProps) {
  const { t } = useTranslation();
  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="catalog-pagination"
      aria-label={t("catalog.paginationLabel")}
    >
      {previousPage ? (
        <Link
          data-testid="pagination-previous"
          to={pageHref(locale, previousPage)}
        >
          {t("catalog.previousPage")}
        </Link>
      ) : (
        <span
          data-testid="pagination-previous"
          aria-disabled="true"
          className="pagination-disabled"
        >
          {t("catalog.previousPage")}
        </span>
      )}
      <span className="catalog-pagination__status" role="status">
        {t("catalog.pageStatus", { page, totalPages })}
      </span>
      {nextPage ? (
        <Link data-testid="pagination-next" to={pageHref(locale, nextPage)}>
          {t("catalog.nextPage")}
        </Link>
      ) : (
        <span
          data-testid="pagination-next"
          aria-disabled="true"
          className="pagination-disabled"
        >
          {t("catalog.nextPage")}
        </span>
      )}
    </nav>
  );
}

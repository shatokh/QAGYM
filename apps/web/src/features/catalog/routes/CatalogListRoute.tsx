import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCatalogListQuery } from "../api/catalog.queries";
import {
  CATALOG_PAGE_SIZE,
  canonicalCatalogSearch,
  parseCatalogPage,
} from "../catalog.pagination";
import { CatalogPagination } from "../components/CatalogPagination";
import { ComicCard } from "../components/ComicCard";

export function CatalogListRoute() {
  const { locale } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  useRouteTitle("catalog.title");

  if (!isAppLocale(locale)) {
    throw new Error("Catalog route rendered without a supported locale.");
  }

  const pageState = parseCatalogPage(location.search);
  const catalogQuery = useCatalogListQuery({
    locale,
    page: pageState.page,
    pageSize: CATALOG_PAGE_SIZE,
  });

  useEffect(() => {
    if (!pageState.shouldCanonicalize) {
      return;
    }

    const canonicalSearch = canonicalCatalogSearch(location.search, 1);
    void navigate(
      {
        search: canonicalSearch ? `?${canonicalSearch}` : "",
      },
      { replace: true },
    );
  }, [location.search, navigate, pageState.shouldCanonicalize]);

  const isEmptyPage = Boolean(catalogQuery.data && catalogQuery.data.data.length === 0);

  return (
    <section
      className="catalog-page"
      aria-labelledby="catalog-title"
      aria-busy={catalogQuery.isPending || catalogQuery.isFetching}
    >
      <div className="catalog-page__header">
        <p className="eyebrow">{t("catalog.eyebrow")}</p>
        <h1 id="catalog-title">{t("catalog.title")}</h1>
        <p className="intro">{t("catalog.introduction")}</p>
      </div>

      {catalogQuery.isPending ? (
        <p className="route-status" data-testid="catalog-loading" role="status">
          {t("catalog.loading")}
        </p>
      ) : null}

      {catalogQuery.isError ? (
        <div className="route-status route-status--error" data-testid="catalog-error" role="alert">
          <strong>{t("catalog.errorTitle")}</strong>
          <span>{t("catalog.errorMessage")}</span>
          <button type="button" onClick={() => void catalogQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {catalogQuery.data && !isEmptyPage ? (
        <>
          <ul className="catalog-grid" data-testid="catalog-grid">
            {catalogQuery.data.data.map((comic) => (
              <ComicCard key={comic.slug} comic={comic} locale={locale} />
            ))}
          </ul>
          <CatalogPagination
            locale={locale}
            page={catalogQuery.data.pagination.page}
            totalPages={catalogQuery.data.pagination.totalPages}
          />
        </>
      ) : null}

      {catalogQuery.data && isEmptyPage ? (
        <div className="route-status catalog-empty" data-testid="catalog-empty" role="status">
          <strong>
            {pageState.page > 1
              ? t("catalog.emptyPageTitle")
              : t("catalog.emptyTitle")}
          </strong>
          <span>
            {pageState.page > 1
              ? t("catalog.emptyPageMessage")
              : t("catalog.emptyMessage")}
          </span>
          {pageState.page > 1 ? (
            <Link className="text-link" to={`/${locale}/comics`}>
              {t("actions.firstCatalogPage")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

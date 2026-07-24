import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { useCatalogListQuery } from "../api/catalog.queries";

export function CatalogListRoute() {
  const { locale } = useParams();
  const { t } = useTranslation();
  useRouteTitle("catalog.title");

  if (!isAppLocale(locale)) {
    throw new Error("Catalog route rendered without a supported locale.");
  }

  const catalogQuery = useCatalogListQuery({
    locale,
    page: 1,
    pageSize: 12,
  });

  return (
    <section
      className="route-placeholder"
      aria-labelledby="catalog-title"
      aria-busy={catalogQuery.isPending}
    >
      <p className="eyebrow">{t("catalog.eyebrow")}</p>
      <h1 id="catalog-title">{t("catalog.title")}</h1>
      <p className="intro">{t("catalog.introduction")}</p>

      {catalogQuery.isPending ? (
        <p
          className="route-status"
          data-testid="catalog-loading"
          role="status"
        >
          {t("catalog.loading")}
        </p>
      ) : null}

      {catalogQuery.isError ? (
        <div
          className="route-status route-status--error"
          data-testid="catalog-error"
          role="alert"
        >
          <strong>{t("catalog.errorTitle")}</strong>
          <span>{t("catalog.errorMessage")}</span>
          <button type="button" onClick={() => void catalogQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {catalogQuery.data ? (
        <p
          className="route-status"
          data-testid="catalog-ready"
          role="status"
        >
          {t("catalog.ready", {
            count: catalogQuery.data.pagination.totalItems,
          })}
        </p>
      ) : null}
    </section>
  );
}

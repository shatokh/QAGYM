import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { isAppLocale } from "../../../i18n/locales";
import { useRouteTitle } from "../../../routing/useRouteTitle";
import { isCatalogApiError } from "../api/catalog.errors";
import { useComicDetailQuery } from "../api/catalog.queries";

export function ComicDetailRoute() {
  const { locale, slug } = useParams();
  const { t } = useTranslation();
  useRouteTitle("comic.title");

  if (!isAppLocale(locale) || !slug) {
    throw new Error("Comic route rendered without valid route parameters.");
  }

  const comicQuery = useComicDetailQuery({
    locale,
    slug,
  });

  const isNotFound =
    comicQuery.isError &&
    isCatalogApiError(comicQuery.error) &&
    comicQuery.error.status === 404;

  return (
    <section
      className="route-placeholder"
      aria-labelledby="comic-title"
      aria-busy={comicQuery.isPending}
    >
      <p className="eyebrow">{t("comic.eyebrow")}</p>
      <h1 id="comic-title">{t("comic.title")}</h1>
      <p className="intro">{t("comic.introduction")}</p>

      {comicQuery.isPending ? (
        <p className="route-status" data-testid="comic-loading" role="status">
          {t("comic.loading")}
        </p>
      ) : null}

      {isNotFound ? (
        <div
          className="route-status route-status--error"
          data-testid="comic-not-found"
          role="alert"
        >
          <strong>{t("comic.notFoundTitle")}</strong>
          <span>{t("comic.notFoundMessage")}</span>
          <Link className="text-link" to={`/${locale}/comics`}>
            {t("actions.backToCatalog")}
          </Link>
        </div>
      ) : null}

      {comicQuery.isError && !isNotFound ? (
        <div
          className="route-status route-status--error"
          data-testid="comic-error"
          role="alert"
        >
          <strong>{t("comic.errorTitle")}</strong>
          <span>{t("comic.errorMessage")}</span>
          <button type="button" onClick={() => void comicQuery.refetch()}>
            {t("actions.retry")}
          </button>
        </div>
      ) : null}

      {comicQuery.data ? (
        <p className="route-status" data-testid="comic-ready" role="status">
          {t("comic.ready", {
            title: comicQuery.data.data.title,
          })}
        </p>
      ) : null}
    </section>
  );
}

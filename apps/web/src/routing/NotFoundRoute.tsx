import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAppLocale } from "../i18n/locales";
import { useRouteTitle } from "./useRouteTitle";

interface NotFoundRouteProps {
  standalone?: boolean;
}

export function NotFoundRoute({ standalone = false }: NotFoundRouteProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const activeLocale = isAppLocale(locale) ? locale : "en";

  useRouteTitle("notFound.title");

  const content = (
    <section
      className="route-state route-state--not-found"
      data-testid="route-not-found"
      aria-labelledby="not-found-title"
    >
      <p className="eyebrow">{t("notFound.eyebrow")}</p>
      <h1 id="not-found-title">{t("notFound.title")}</h1>
      <p>{t("notFound.message")}</p>
      <Link className="text-link" to={`/${activeLocale}/comics`}>
        {t("actions.backToCatalog")}
      </Link>
    </section>
  );

  if (standalone) {
    return (
      <main className="standalone-state" id="main-content">
        {content}
      </main>
    );
  }

  return content;
}

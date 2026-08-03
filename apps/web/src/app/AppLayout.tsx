import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthShellStatus } from "../features/auth/components/AuthShellStatus";
import type { AppLocale } from "../i18n/locales";

interface AppLayoutProps {
  locale: AppLocale;
}

function replacePathLocale(pathname: string, locale: AppLocale): string {
  const segments = pathname.split("/");
  segments[1] = locale;
  return segments.join("/") || `/${locale}/comics`;
}

export function AppLayout({ locale }: AppLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const localeHref = (nextLocale: AppLocale) =>
    `${replacePathLocale(location.pathname, nextLocale)}${location.search}${location.hash}`;

  return (
    <div className="app" data-testid="app-shell">
      <a className="skip-link" href="#main-content">
        {t("app.skipToContent")}
      </a>

      <header className="app-header">
        <Link
          className="brand"
          to={`/${locale}/comics`}
          aria-label={t("app.homeLabel")}
        >
          <span className="brand-mark" aria-hidden="true">
            QA
          </span>
          <span>{t("app.brand")}</span>
        </Link>

        <div className="app-header__tools">
          <Link className="cart-link" to={`/${locale}/cart`}>
            {t("cart.nav")}
          </Link>
          <Link className="cart-link" to={`/${locale}/orders`}>
            {t("orders.nav")}
          </Link>

          <AuthShellStatus locale={locale} />

          <nav
            className="locale-switcher"
            aria-label={t("locale.navigationLabel")}
            data-testid="locale-switcher"
          >
            <Link
              to={localeHref("en")}
              lang="en"
              aria-current={locale === "en" ? "page" : undefined}
            >
              EN
            </Link>
            <Link
              to={localeHref("ru")}
              lang="ru"
              aria-current={locale === "ru" ? "page" : undefined}
            >
              RU
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>{t("app.brand")}</span>
        <span>{t("app.cleanCore")}</span>
      </footer>
    </div>
  );
}

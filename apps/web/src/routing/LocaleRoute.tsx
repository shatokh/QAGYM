import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "../app/AppLayout";
import { i18n } from "../i18n/i18n";
import { isAppLocale } from "../i18n/locales";
import { NotFoundRoute } from "./NotFoundRoute";

export function LocaleRoute() {
  const { locale } = useParams();

  useEffect(() => {
    if (!isAppLocale(locale)) {
      return;
    }

    document.documentElement.lang = locale;

    if (i18n.resolvedLanguage !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (!isAppLocale(locale)) {
    return <NotFoundRoute standalone />;
  }

  return <AppLayout locale={locale} />;
}

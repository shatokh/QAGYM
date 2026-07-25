import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useRouteTitle(key: string, override?: string) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = `${override ?? t(key)} | QA Comics Gym`;
  }, [i18n.resolvedLanguage, key, override, t]);
}

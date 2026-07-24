export const appLocales = ["en", "ru"] as const;

export type AppLocale = (typeof appLocales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return appLocales.some((locale) => locale === value);
}
